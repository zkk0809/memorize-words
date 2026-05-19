import { getSupabaseClient } from './supabase-client.js';

let isLoginMode = true;

export function renderAuthPage(container) {
  isLoginMode = true;
  render(container);
}

function render(container) {
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-form">
        <h2>${isLoginMode ? '登录' : '注册'}</h2>
        <div class="form-group">
          <label>邮箱</label>
          <input type="email" id="auth-email" placeholder="请输入邮箱">
        </div>
        <div class="form-group">
          <label>密码</label>
          <input type="password" id="auth-password" placeholder="${isLoginMode ? '请输入密码' : '请输入密码（至少6位）'}">
        </div>
        <button class="btn-primary" id="auth-submit">${isLoginMode ? '登录' : '注册'}</button>
        <div class="switch-mode">
          ${isLoginMode ? '没有账号？<a id="switch-to-register">注册</a>' : '已有账号？<a id="switch-to-login">登录</a>'}
        </div>
      </div>
    </div>
  `;

  document.getElementById('auth-submit').addEventListener('click', handleSubmit);
  document.getElementById(isLoginMode ? 'switch-to-register' : 'switch-to-login').addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    render(container);
  });
}

async function handleSubmit() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;

  if (!email || !password) {
    showToast('请填写邮箱和密码', 'error');
    return;
  }

  const supabase = getSupabaseClient();
  const btn = document.getElementById('auth-submit');
  btn.disabled = true;
  btn.textContent = '处理中...';

  try {
    const { data, error } = isLoginMode
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) throw error;

    if (data.session) {
      localStorage.setItem('auth_token', data.session.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.hash = '#learn';
    } else if (!isLoginMode) {
      showToast('注册成功！请检查邮箱确认链接', 'success');
    }
  } catch (err) {
    showToast(err.message || '操作失败', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = isLoginMode ? '登录' : '注册';
  }
}

function showToast(msg, type) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}