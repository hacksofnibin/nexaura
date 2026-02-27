/* =====================================================
   NexAura – News Engine
   Loads news.json, renders cards, handles filtering/search
   ===================================================== */

let allNews = [];
let activeCategory = 'All';

// ── Load News Data ────────────────────────────────────
async function loadNews() {
  try {
    const res = await fetch('data/news.json');
    allNews = await res.json();
  } catch (e) {
    console.error('Failed to load news:', e);
    allNews = [];
  }
}

// ── Get Category Color Class ──────────────────────────
function getCatClass(cat) {
  const map = {
    'AI': 'ai',
    'Cybersecurity': 'cybersecurity',
    'Education': 'education',
    'Startups': 'startups',
    'Research': 'research',
    'Tools': 'tools',
    'Developer': 'developer'
  };
  return map[cat] || 'ai';
}

// ── Category Color for dots ───────────────────────────
function getCatColor(cat) {
  const map = {
    'AI': '#00d4ff',
    'Cybersecurity': '#ec4899',
    'Education': '#f59e0b',
    'Startups': '#10b981',
    'Research': '#8b5cf6',
    'Tools': '#ff6b35',
    'Developer': '#3b82f6'
  };
  return map[cat] || '#00d4ff';
}

// ── Format Date ───────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Render a single news card ─────────────────────────
function renderNewsCard(article, delay = 0) {
  const catClass = getCatClass(article.category);
  return `
    <div class="news-card" style="animation-delay:${delay}ms" onclick="goToArticle(${article.id})">
      <div style="overflow:hidden;position:relative;">
        ${article.hot ? '<div class="hot-badge" style="position:absolute;top:12px;left:12px;z-index:2"> HOT</div>' : ''}
        <img class="news-card-img" src="${article.image}" alt="${article.title}" loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80'">
      </div>
      <div class="news-card-body">
        <span class="cat-badge ${catClass}">${article.category}</span>
        <h3 class="card-title">${article.title}</h3>
        <p class="news-card-summary">${article.summary}</p>
        <div class="news-card-footer">
          <div class="card-meta">
            <span> ${article.source}</span>
            <span> ${article.readTime}m read</span>
          </div>
          <a class="read-more-btn">Read →</a>
        </div>
      </div>
    </div>`;
}

// ── Render Hot News Section ───────────────────────────
function renderHotNews() {
  const container = document.getElementById('hotNewsContainer');
  if (!container) return;

  const hot = allNews.filter(n => n.hot).slice(0, 3);
  if (hot.length === 0) { container.innerHTML = ''; return; }

  const [main, ...sides] = hot;

  container.innerHTML = `
    <div class="hot-grid">
      <div class="hot-card-main" onclick="goToArticle(${main.id})">
        <img src="${main.image}" alt="${main.title}" loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80'">
        <div class="hot-card-content">
          <div class="hot-badge"> HOT</div>
          <span class="cat-badge ${getCatClass(main.category)}">${main.category}</span>
          <h2 class="card-title" style="font-size:1.45rem;margin-bottom:10px;">${main.title}</h2>
          <p style="font-size:0.875rem;color:#94a3b8;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${main.summary}</p>
          <div class="card-meta" style="color:#64748b;">
            <span> ${main.source}</span>
            <span> ${formatDate(main.date)}</span>
            <span> ${main.readTime}m read</span>
          </div>
        </div>
      </div>
      ${sides.map(s => `
        <div class="hot-card-side" onclick="goToArticle(${s.id})">
          <img src="${s.image}" alt="${s.title}" loading="lazy"
            onerror="this.src='https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80'">
          <div class="hot-card-content">
            <span class="cat-badge ${getCatClass(s.category)}">${s.category}</span>
            <h3 class="card-title" style="font-size:0.95rem;margin-bottom:6px;">${s.title}</h3>
            <div class="card-meta" style="color:#64748b;font-size:0.75rem;">
              <span> ${s.source}</span>
              <span> ${formatDate(s.date)}</span>
            </div>
          </div>
        </div>`).join('')}
    </div>`;
}

// ── Render News Grid ──────────────────────────────────
function renderNewsGrid(filtered) {
  const container = document.getElementById('newsGrid');
  if (!container) return;

  if (!filtered || filtered.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <div class="icon"></div>
        <h3>No articles found</h3>
        <p>Try a different category or search term.</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map((a, i) => renderNewsCard(a, i * 50)).join('');
}

// ── Personalized Section ──────────────────────────────
function renderPersonalizedSection() {
  const section = document.getElementById('personalizedSection');
  if (!section) return;

  if (typeof NexAuraCookies === 'undefined' || !NexAuraCookies.hasConsent()) return;

  const preferred = NexAuraCookies.getPreferredCategories();
  if (preferred.length === 0) return;

  const topCat = preferred[0];
  const personalized = allNews.filter(n => n.category === topCat).slice(0, 3);
  if (personalized.length === 0) return;

  section.classList.add('visible');
  document.getElementById('personalizedCatName').textContent = topCat;
  document.getElementById('personalizedGrid').innerHTML = personalized.map((a, i) => renderNewsCard(a, i * 60)).join('');
}

// ── Category Filtering ────────────────────────────────
function initCategoryFilter() {
  const buttons = document.querySelectorAll('.cat-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;

      // Track in cookies
      if (typeof NexAuraCookies !== 'undefined' && activeCategory !== 'All') {
        NexAuraCookies.trackCategory(activeCategory);
      }

      applyFilters();
    });
  });
}

// ── Search ────────────────────────────────────────────
let searchQuery = '';

function initSearch() {
  const inputs = document.querySelectorAll('.search-input');
  const dropdowns = document.querySelectorAll('.search-results-dropdown');

  inputs.forEach((input, idx) => {
    input.addEventListener('input', async (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      if (allNews.length === 0) await loadNews();
      applyFilters();
      updateSearchDropdown(dropdowns[idx], searchQuery);
    });

    input.addEventListener('focus', async (e) => {
      if (allNews.length === 0) await loadNews();
      if (e.target.value.trim()) updateSearchDropdown(dropdowns[idx], e.target.value.toLowerCase().trim());
    });

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdowns[idx]?.contains(e.target)) {
        if (dropdowns[idx]) dropdowns[idx].classList.remove('active');
      }
    });
  });
}

function updateSearchDropdown(dropdown, query) {
  if (!dropdown || !query) {
    if (dropdown) dropdown.classList.remove('active');
    return;
  }
  const results = allNews.filter(n =>
    n.title.toLowerCase().includes(query) ||
    n.category.toLowerCase().includes(query) ||
    n.tags.some(t => t.toLowerCase().includes(query))
  ).slice(0, 6);

  if (results.length === 0) {
    dropdown.classList.remove('active');
    return;
  }

  dropdown.innerHTML = results.map(n => `
    <div class="search-result-item" onclick="goToArticle(${n.id})">
      <div class="result-title">${n.title}</div>
      <div class="result-meta">
        <span class="cat-badge ${getCatClass(n.category)}" style="font-size:0.65rem;padding:2px 7px;">${n.category}</span>
        <span style="margin-left:8px;font-size:0.72rem;color:var(--text-muted);"> ${n.source}</span>
      </div>
    </div>`).join('');
  dropdown.classList.add('active');
}

// ── Apply Both Filters ────────────────────────────────
function applyFilters() {
  let filtered = [...allNews];

  if (activeCategory !== 'All') {
    filtered = filtered.filter(n => n.category === activeCategory);
  }

  if (searchQuery) {
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(searchQuery) ||
      n.summary.toLowerCase().includes(searchQuery) ||
      n.tags.some(t => t.toLowerCase().includes(searchQuery)) ||
      n.source.toLowerCase().includes(searchQuery)
    );
  }

  renderNewsGrid(filtered);
}

// ── Navigate to Article ───────────────────────────────
function goToArticle(id) {
  window.location.href = `article.html?id=${id}`;
}

// ── Breaking News Ticker ──────────────────────────────
function renderTicker() {
  const ticker = document.getElementById('tickerContent');
  if (!ticker) return;

  const items = allNews.slice(0, 10).map(n => n.title);
  // Duplicate for seamless loop
  const all = [...items, ...items];
  ticker.innerHTML = all.map(t => `<span class="ticker-item">${t}</span>`).join('');
}

// ── Sidebar: Trending Articles ────────────────────────
function renderSidebarTrending() {
  const container = document.getElementById('sidebarTrending');
  if (!container) return;

  const trending = allNews.filter(n => n.trending).slice(0, 5);
  container.innerHTML = trending.map(n => `
    <div class="sidebar-news-item" onclick="goToArticle(${n.id})">
      <img class="sidebar-news-img" src="${n.image}" alt="${n.title}"
        onerror="this.src='https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=300&q=80'" loading="lazy">
      <div>
        <p class="sidebar-news-title">${n.title}</p>
        <div class="sidebar-news-meta">
          <span class="cat-badge ${getCatClass(n.category)}" style="font-size:0.65rem;padding:2px 7px;">${n.category}</span>
        </div>
      </div>
    </div>`).join('');
}

// ── Article Page ──────────────────────────────────────
async function renderArticlePage() {
  await loadNews();
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  const article = allNews.find(n => n.id === id);

  if (!article) {
    document.getElementById('articleContent').innerHTML = `
      <div style="text-align:center;padding:80px 20px">
        <div style="font-size:4rem;margin-bottom:16px">😕</div>
        <h2>Article not found</h2>
        <a href="index.html" style="color:var(--accent-blue)">← Back to Home</a>
      </div>`;
    return;
  }

  // Update page title
  document.title = `${article.title} – NexAura`;

  // Track category interest
  if (typeof NexAuraCookies !== 'undefined') {
    NexAuraCookies.trackCategory(article.category);
  }

  const content = document.getElementById('articleContent');
  if (content) {
    content.innerHTML = `
      <div class="new-badge"> ${formatDate(article.date)}</div>
      <span class="cat-badge ${getCatClass(article.category)}" style="margin-left:8px;">${article.category}</span>
      <h1 class="article-title" style="margin-top:16px;">${article.title}</h1>
      <div class="article-meta">
        <span> <strong>${article.source}</strong></span>
        <span> ${article.readTime} min read</span>
        <span> ${article.tags.join(', ')}</span>
        <a href="${article.sourceUrl}" target="_blank" rel="noopener" style="color:var(--accent-blue);margin-left:auto;">
          View Original ↗
        </a>
      </div>
      <img class="article-hero-img" src="${article.image}" alt="${article.title}"
        onerror="this.src='https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80'">
      <div class="article-content">
        <p style="font-size:1.05rem;color:var(--text-primary);font-weight:500;margin-bottom:24px;">${article.summary}</p>
        ${article.content.split('. ').reduce((acc, s, i, arr) => {
      if (i % 3 === 0) acc.push(arr.slice(i, i + 3).join('. ') + (arr[i + 3] !== undefined ? '.' : ''));
      return acc;
    }, []).map(p => `<p>${p}</p>`).join('')}
        <div style="margin-top:32px;padding:20px;background:var(--bg-glass);border-left:3px solid var(--accent-blue);border-radius:0 12px 12px 0;">
          <p style="color:var(--text-muted);font-size:0.85rem;font-style:italic;">
            Source: <a href="${article.sourceUrl}" target="_blank" style="color:var(--accent-blue);">${article.source}</a>. 
            NexAura aggregates and curates content from leading technology publications. All rights belong to original publishers.
          </p>
        </div>
      </div>`;
  }

  // Render tags
  const tagsEl = document.getElementById('articleTags');
  if (tagsEl) {
    tagsEl.innerHTML = article.tags.map(t =>
      `<span style="padding:4px 12px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:50px;font-size:0.78rem;color:var(--text-secondary);">#${t}</span>`
    ).join('');
  }

  // Related articles sidebar
  renderSidebarTrending();
  const relatedEl = document.getElementById('relatedArticles');
  if (relatedEl) {
    const related = allNews.filter(n => n.category === article.category && n.id !== article.id).slice(0, 3);
    relatedEl.innerHTML = related.map(n => `
      <div class="sidebar-news-item" onclick="goToArticle(${n.id})">
        <img class="sidebar-news-img" src="${n.image}" alt="${n.title}"
          onerror="this.src='https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=300&q=80'" loading="lazy">
        <div>
          <p class="sidebar-news-title">${n.title}</p>
          <span class="sidebar-news-meta">${formatDate(n.date)}</span>
        </div>
      </div>`).join('');
  }

  // Init comments
  initCommentsSection(id);
}

// ── Init Homepage ─────────────────────────────────────
async function initHomepage() {
  await loadNews();
  renderHotNews();
  renderNewsGrid(allNews);
  renderTicker();
  renderPersonalizedSection();
  initCategoryFilter();
  initSearch();
}

// ── Auto-detect and init ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Standard components for all pages
  initSearch();

  if (document.getElementById('hotNewsContainer')) {
    initHomepage();
  }
  if (document.getElementById('articleContent')) {
    renderArticlePage();
  }
});
