import { renderNavbar } from './components/navbar.js';
import { renderAuthPage } from './auth.js';
import { initSupabase } from './supabase-client.js';
import { showToast } from './components/toast.js';

const SUPABASE_URL_CONFIG = window.SUPABASE_URL || '';
const SUPABASE_ANON_KEY_CONFIG = window.SUPABASE_ANON_KEY || '';

const pageModules = {};

async function loadPage(name) {
  if (!pageModules[name]) {
    pageModules[name] = await import(`./pages/${name}.js`);
  }
  return pageModules[name];
}

function isLoggedIn() {
  return !!localStorage.getItem('auth_token');
}

async function route() {
  const hash = window.location.hash.replace('#', '') || 'learn';
  const nav = document.getElementById('navbar');
  const content = document.getElementById('app-content');

  // Init Supabase
  if (SUPABASE_URL_CONFIG && SUPABASE_ANON_KEY_CONFIG) {
    initSupabase(SUPABASE_URL_CONFIG, SUPABASE_ANON_KEY_CONFIG);
  }

  // Auth check
  if (!isLoggedIn() && hash !== 'login') {
    window.location.hash = '#login';
    return;
  }

  if (hash === 'login') {
    nav.style.display = 'none';
    renderAuthPage(content);
    return;
  }

  nav.style.display = 'flex';
  renderNavbar(nav);

  try {
    const page = await loadPage(hash);
    if (page && page.render) {
      page.render(content);
    } else {
      content.innerHTML = `<div class="empty-state"><h3>页面不存在</h3></div>`;
    }
  } catch (err) {
    if (hash !== 'login' && hash !== 'learn' && hash !== 'review' && hash !== 'stats' && hash !== 'wordlist' && hash !== 'settings') {
      content.innerHTML = `<div class="empty-state"><h3>页面不存在</h3></div>`;
    }
  }
}

window.addEventListener('hashchange', route);
route();