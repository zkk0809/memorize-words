const routes = {
  'learn': { label: '学习', icon: '📖' },
  'review': { label: '复习', icon: '🔄' },
  'stats': { label: '统计', icon: '📊' },
  'wordlist': { label: '词库', icon: '📚' },
  'settings': { label: '设置', icon: '⚙️' },
};

export function renderNavbar(navEl) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const currentHash = window.location.hash.replace('#', '') || 'learn';

  let html = `<div class="nav-brand">背单词</div><div class="nav-links">`;

  for (const [key, route] of Object.entries(routes)) {
    const active = currentHash === key ? 'active' : '';
    html += `<a class="nav-link ${active}" href="#${key}">${route.icon} ${route.label}</a>`;
  }

  html += `</div><div class="nav-right">`;

  if (user) {
    html += `<span class="user-email">${user.email}</span>`;
    html += `<button class="btn-logout" id="btn-logout">退出</button>`;
  }

  html += `</div>`;
  navEl.innerHTML = html;

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.hash = '#login';
    });
  }
}