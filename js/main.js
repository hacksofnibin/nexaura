const ENTRY_KEY = 'campusvotex_session_v2';
const ISSUE_KEY = 'campusvotex_issues_v2';
const HIGH_ALERT_THRESHOLD = 12;

const DEMO_USERS = {
  student: [
    { registerNo: '23CSE104', password: 'student123', name: 'Student User' },
    { registerNo: '23ECE201', password: 'student123', name: 'Class Rep' }
  ],
  staff: [
    { registerNo: 'STAFF1001', password: 'staff123', name: 'Prof. Arun' },
    { registerNo: 'STAFF1002', password: 'staff123', name: 'Admin Staff' }
  ]
};

const entryOverlay = document.getElementById('entryOverlay');
const enterPortalBtn = document.getElementById('enterPortalBtn');
const authModal = document.getElementById('authModal');
const app = document.getElementById('app');

const loginForm = document.getElementById('loginForm');
const loginHint = document.getElementById('loginHint');
const logoutBtn = document.getElementById('logoutBtn');
const sessionInfo = document.getElementById('sessionInfo');

const issueForm = document.getElementById('issueForm');
const issueList = document.getElementById('issueList');
const statusFilter = document.getElementById('statusFilter');
const issueCount = document.getElementById('issueCount');
const staffAlarm = document.getElementById('staffAlarm');
const topProblems = document.getElementById('topProblems');
const ratingList = document.getElementById('ratingList');

const statOpen = document.getElementById('statOpen');
const statTopTitle = document.getElementById('statTopTitle');
const statTopVotes = document.getElementById('statTopVotes');
const statAlerts = document.getElementById('statAlerts');

function getSession() {
  return JSON.parse(localStorage.getItem(ENTRY_KEY) || 'null');
}

function saveSession(session) {
  localStorage.setItem(ENTRY_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(ENTRY_KEY);
}

function getIssues() {
  return JSON.parse(localStorage.getItem(ISSUE_KEY) || '[]');
}

function saveIssues(issues) {
  localStorage.setItem(ISSUE_KEY, JSON.stringify(issues));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function sanitize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function similarityScore(a, b) {
  const sa = new Set(sanitize(a).split(' ').filter(Boolean));
  const sb = new Set(sanitize(b).split(' ').filter(Boolean));
  const common = [...sa].filter((x) => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size || 1;
  return common / union;
}

function severity(votes, merges) {
  const score = votes + merges * 2;
  if (score >= 20) return 'high';
  if (score >= 10) return 'medium';
  return 'low';
}

function statusClass(status) {
  if (status === 'Resolved') return 'resolved';
  if (status === 'In Progress') return 'progress';
  return 'open';
}

function canVote(session) {
  return session?.role === 'student';
}

function canManage(session) {
  return session?.role === 'staff';
}

function showAuth() {
  app.classList.add('hidden');
  authModal.classList.remove('hidden');
}

function showApp(session) {
  authModal.classList.add('hidden');
  app.classList.remove('hidden');
  sessionInfo.textContent = `${session.name} (${session.registerNo}) • ${session.role.toUpperCase()}`;
  render();
}

function handleLogin(event) {
  event.preventDefault();
  const role = document.getElementById('role').value;
  const registerNo = document.getElementById('registerNo').value.trim().toUpperCase();
  const password = document.getElementById('password').value.trim();

  const found = DEMO_USERS[role].find((u) => u.registerNo === registerNo && u.password === password);
  if (!found) {
    loginHint.textContent = `Invalid credentials. Demo ${role} account: ${role === 'student' ? '23CSE104 / student123' : 'STAFF1001 / staff123'}`;
    return;
  }

  const session = { registerNo: found.registerNo, name: found.name, role };
  saveSession(session);
  loginHint.textContent = '';
  showApp(session);
}

function updateStats(issues) {
  const open = issues.filter((i) => i.status !== 'Resolved');
  const top = [...issues].sort((a, b) => b.votes - a.votes)[0];
  const alerts = issues.filter((i) => i.status !== 'Resolved' && i.votes >= HIGH_ALERT_THRESHOLD).length;

  statOpen.textContent = String(open.length);
  statTopTitle.textContent = top ? top.title : '-';
  statTopVotes.textContent = top ? `${top.votes} votes` : '0 votes';
  statAlerts.textContent = String(alerts);

  const topThree = [...issues]
    .filter((i) => i.status !== 'Resolved')
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 3);

  topProblems.innerHTML = topThree.length
    ? topThree
      .map((item, idx) => `<div class="top-item"><strong>#${idx + 1} ${item.title}</strong><div class="muted">${item.votes} votes • ${item.location}</div></div>`)
      .join('')
    : '<p class="empty">No active problems yet.</p>';
}

function renderRatings(issues, session) {
  const resolved = issues.filter((i) => i.status === 'Resolved');
  if (!resolved.length) {
    ratingList.innerHTML = '<p class="empty">Ratings will appear after issues are marked resolved.</p>';
    return;
  }

  ratingList.innerHTML = resolved.map((issue) => {
    const avg = issue.ratings?.length
      ? (issue.ratings.reduce((s, n) => s + n, 0) / issue.ratings.length).toFixed(1)
      : 'No ratings';

    const rateControl = canVote(session)
      ? `<label>Rate Solution
          <select data-action="rate" data-id="${issue.id}">
            <option value="">Select</option>
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Okay</option>
            <option value="2">2 - Poor</option>
            <option value="1">1 - Bad</option>
          </select>
        </label>`
      : '<span class="muted">Only students can rate resolved issues.</span>';

    return `<article class="rating-item"><strong>${issue.title}</strong><div class="muted">Average rating: ${avg}</div>${rateControl}</article>`;
  }).join('');
}

function render() {
  const session = getSession();
  if (!session) return;

  const filter = statusFilter.value;
  const issues = getIssues().sort((a, b) => (b.votes - a.votes) || (new Date(b.createdAt) - new Date(a.createdAt)));
  const visible = filter === 'all' ? issues : issues.filter((i) => i.status === filter);

  issueCount.textContent = `${visible.length} issue${visible.length === 1 ? '' : 's'}`;
  updateStats(issues);
  renderRatings(issues, session);

  const alertCount = issues.filter((i) => i.status !== 'Resolved' && i.votes >= HIGH_ALERT_THRESHOLD).length;
  if (canManage(session) && alertCount) {
    staffAlarm.classList.remove('hidden');
    staffAlarm.textContent = `⚠ Alert: ${alertCount} unresolved issue(s) crossed ${HIGH_ALERT_THRESHOLD}+ votes. Please review and update status.`;
  } else {
    staffAlarm.classList.add('hidden');
  }

  if (!visible.length) {
    issueList.innerHTML = '<p class="empty">No issues available in this filter.</p>';
    return;
  }

  issueList.innerHTML = visible.map((issue) => {
    const sev = severity(issue.votes, issue.mergeCount || 0);
    const voteBtn = canVote(session)
      ? `<button class="btn btn-primary" data-action="vote" data-id="${issue.id}">Vote</button>`
      : '<span class="muted">Teachers/staff cannot vote.</span>';

    const staffControls = canManage(session)
      ? `<select data-action="status" data-id="${issue.id}">
          <option ${issue.status === 'Open' ? 'selected' : ''}>Open</option>
          <option ${issue.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option ${issue.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
        </select>`
      : '';

    return `
      <article class="issue-item">
        <div class="issue-top">
          <div>
            <h4 class="issue-title">${issue.title}</h4>
            <p class="issue-meta">📍 ${issue.location} • ${new Date(issue.createdAt).toLocaleString()}</p>
          </div>
          <span class="pill ${statusClass(issue.status)}">${issue.status}</span>
        </div>
        <p class="issue-desc">${issue.description}</p>
        <div class="issue-actions">
          ${voteBtn}
          <span class="vote-chip">${issue.votes} votes</span>
          <span class="severity ${sev}">Severity: ${sev.toUpperCase()}</span>
          ${issue.mergeCount ? `<span class="muted">Merged ${issue.mergeCount} similar report(s)</span>` : ''}
          ${staffControls}
        </div>
      </article>
    `;
  }).join('');
}

function mergeOrCreateIssue(payload) {
  const issues = getIssues();
  const similar = issues.find((issue) => issue.status !== 'Resolved' && (
    similarityScore(`${issue.title} ${issue.description}`, `${payload.title} ${payload.description}`) > 0.45 ||
    sanitize(issue.title) === sanitize(payload.title)
  ));

  if (similar) {
    similar.votes += 1;
    similar.mergeCount = (similar.mergeCount || 0) + 1;
    similar.lastMergedAt = new Date().toISOString();
    saveIssues(issues);
    return { merged: true, issue: similar };
  }

  issues.push({
    id: uid(),
    title: payload.title,
    location: payload.location,
    description: payload.description,
    status: 'Open',
    votes: 1,
    mergeCount: 0,
    ratings: [],
    createdAt: new Date().toISOString()
  });
  saveIssues(issues);
  return { merged: false };
}

enterPortalBtn.addEventListener('click', () => {
  entryOverlay.classList.add('hidden');
  const session = getSession();
  if (session) showApp(session);
  else showAuth();
});

loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', () => {
  clearSession();
  app.classList.add('hidden');
  authModal.classList.add('hidden');
  entryOverlay.classList.remove('hidden');
});

issueForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const session = getSession();
  if (!session) return;

  const title = document.getElementById('title').value.trim();
  const location = document.getElementById('location').value.trim();
  const description = document.getElementById('description').value.trim();

  const result = mergeOrCreateIssue({ title, location, description });
  issueForm.reset();

  if (result.merged) {
    alert('Similar issue detected. Your report was merged and vote added to existing issue.');
  }
  render();
});

issueList.addEventListener('click', (event) => {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  const session = getSession();
  if (!action || !id || !session) return;

  const issues = getIssues();
  const issue = issues.find((i) => i.id === id);
  if (!issue) return;

  if (action === 'vote' && canVote(session) && issue.status !== 'Resolved') {
    issue.votes += 1;
    saveIssues(issues);
    render();
  }
});

issueList.addEventListener('change', (event) => {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  const session = getSession();
  if (action !== 'status' || !id || !canManage(session)) return;

  const issues = getIssues();
  const issue = issues.find((i) => i.id === id);
  if (!issue) return;

  issue.status = event.target.value;
  saveIssues(issues);
  render();
});

ratingList.addEventListener('change', (event) => {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  const session = getSession();
  if (action !== 'rate' || !id || !canVote(session)) return;

  const value = Number(event.target.value);
  if (!value) return;

  const issues = getIssues();
  const issue = issues.find((i) => i.id === id);
  if (!issue || issue.status !== 'Resolved') return;

  issue.ratings = issue.ratings || [];
  issue.ratings.push(value);
  saveIssues(issues);
  render();
});

statusFilter.addEventListener('change', render);

(function init() {
  const session = getSession();
  if (session) {
    entryOverlay.classList.add('hidden');
    showApp(session);
  }
})();
