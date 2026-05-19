import { apiFetch } from '../api.js';

export async function render(container) {
  let stats, daily;

  try {
    stats = await apiFetch('/stats');
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>加载统计失败</h3><p>${err.message}</p></div>`;
    return;
  }

  try {
    daily = await apiFetch('/stats/daily');
  } catch { daily = null; }

  const accuracy = stats.accuracy || 0;
  const streak = stats.streak || 0;

  container.innerHTML = `
    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">学习统计</h3>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.total_learned || 0}</div>
        <div class="stat-label">已学单词</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.mastered || 0}</div>
        <div class="stat-label">已掌握</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.reviewing || 0}</div>
        <div class="stat-label">学习中</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${accuracy}%</div>
        <div class="stat-label">正确率</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.total_reviews || 0}</div>
        <div class="stat-label">总复习次数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${streak}</div>
        <div class="stat-label">连续天数</div>
      </div>
    </div>

    ${daily ? `
    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">今日数据</h3>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${daily.new_today || 0}</div>
        <div class="stat-label">今日新学</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${daily.reviewed_today || 0}</div>
        <div class="stat-label">今日复习</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${daily.accuracy_today || 0}%</div>
        <div class="stat-label">今日正确率</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${daily.due_reviews || 0}</div>
        <div class="stat-label">待复习</div>
      </div>
    </div>
    ` : ''}
  `;
}