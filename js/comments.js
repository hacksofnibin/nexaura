/* =====================================================
   NexAura – Comments System
   Uses localStorage per article ID
   ===================================================== */

const CommentsManager = {
    STORAGE_KEY: 'nexaura_comments',

    getAll() {
        try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || {}; }
        catch { return {}; }
    },

    getForArticle(articleId) {
        return this.getAll()[articleId] || [];
    },

    addComment(articleId, name, text) {
        const all = this.getAll();
        if (!all[articleId]) all[articleId] = [];
        const comment = {
            id: Date.now(),
            name: name.trim() || 'Anonymous',
            text: text.trim(),
            date: new Date().toISOString()
        };
        all[articleId].unshift(comment); // newest first
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
        return comment;
    }
};

function formatCommentDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderComment(comment) {
    const initials = comment.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return `
    <div class="comment-card" id="comment-${comment.id}">
      <div class="comment-header">
        <div class="comment-avatar">${initials}</div>
        <span class="comment-name">${escapeHtml(comment.name)}</span>
        <span class="comment-date">${formatCommentDate(comment.date)}</span>
      </div>
      <p class="comment-text">${escapeHtml(comment.text)}</p>
    </div>`;
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function initCommentsSection(articleId) {
    const section = document.getElementById('commentsSection');
    if (!section) return;

    const listEl = document.getElementById('commentsList');
    const form = document.getElementById('commentForm');
    const textarea = document.getElementById('commentText');
    const nameInput = document.getElementById('commentName');
    const countEl = document.getElementById('commentsCount');

    function renderAll() {
        const comments = CommentsManager.getForArticle(articleId);
        if (countEl) countEl.textContent = comments.length;
        if (comments.length === 0) {
            listEl.innerHTML = `<p style="color:var(--text-muted);font-size:0.875rem;padding:20px 0;">No comments yet. Be the first to share your thoughts!</p>`;
        } else {
            listEl.innerHTML = comments.map(renderComment).join('');
        }
    }

    renderAll();

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = textarea.value.trim();
            const name = nameInput.value.trim();
            if (!text) {
                textarea.focus();
                textarea.style.borderColor = 'var(--accent-pink)';
                setTimeout(() => { textarea.style.borderColor = ''; }, 1500);
                return;
            }
            const comment = CommentsManager.addComment(articleId, name, text);
            textarea.value = '';
            // Track in cookies
            if (typeof NexAuraCookies !== 'undefined') NexAuraCookies.trackCategory('commenter');
            renderAll();
            // Scroll to new comment
            const newCard = document.getElementById(`comment-${comment.id}`);
            if (newCard) newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }
}
