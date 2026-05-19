import { apiFetch } from '../api.js';
import { showToast } from '../components/toast.js';

export async function render(container) {
  let settings, lists;
  try {
    settings = await apiFetch('/settings');
  } catch {
    settings = { daily_new_limit: 20, daily_review_limit: 50, theme: 'light', auto_pronounce: false };
  }

  try {
    lists = await apiFetch('/lists');
  } catch { lists = []; }

  const currentTheme = settings.theme || localStorage.getItem('theme') || 'light';

  container.innerHTML = `
    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">设置</h3>
    <div class="settings-form">
      <div class="setting-group">
        <label>每日新词数量: <span class="range-value" id="new-limit-value">${settings.daily_new_limit}</span></label>
        <input type="range" id="new-limit" min="5" max="100" value="${settings.daily_new_limit}">
      </div>
      <div class="setting-group">
        <label>每日复习上限: <span class="range-value" id="review-limit-value">${settings.daily_review_limit}</span></label>
        <input type="range" id="review-limit" min="10" max="200" value="${settings.daily_review_limit}">
      </div>
      <div class="setting-group">
        <label>默认词库</label>
        <select id="preferred-list" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg); color: var(--text);">
          <option value="">未选择</option>
          ${(lists || []).map(l => `<option value="${l.id}" ${settings.preferred_list === l.id ? 'selected' : ''}>${l.name}</option>`).join('')}
        </select>
      </div>
      <div class="setting-group">
        <label>深色模式</label>
        <div class="toggle-switch">
          <div class="toggle ${currentTheme === 'dark' ? 'active' : ''}" id="theme-toggle"></div>
          <span>${currentTheme === 'dark' ? '已开启' : '已关闭'}</span>
        </div>
      </div>
      <button class="btn-primary" id="btn-save-settings" style="margin-top: 16px;">保存设置</button>
    </div>
  `;

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', () => {
    const isDark = themeToggle.classList.toggle('active');
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // Apply saved theme on load
  document.documentElement.setAttribute('data-theme', currentTheme);

  // Range sliders
  document.getElementById('new-limit').addEventListener('input', (e) => {
    document.getElementById('new-limit-value').textContent = e.target.value;
  });
  document.getElementById('review-limit').addEventListener('input', (e) => {
    document.getElementById('review-limit-value').textContent = e.target.value;
  });

  // Save
  document.getElementById('btn-save-settings').addEventListener('click', async () => {
    try {
      const theme = themeToggle.classList.contains('active') ? 'dark' : 'light';
      await apiFetch('/settings', {
        method: 'PUT',
        body: {
          daily_new_limit: parseInt(document.getElementById('new-limit').value),
          daily_review_limit: parseInt(document.getElementById('review-limit').value),
          preferred_list: document.getElementById('preferred-list').value || null,
          theme
        }
      });
      showToast('设置已保存', 'success');
    } catch (err) {
      showToast(`保存失败: ${err.message}`, 'error');
    }
  });
}