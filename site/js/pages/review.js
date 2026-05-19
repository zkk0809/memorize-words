import { apiFetch } from '../api.js';
import { cardHTML, bindCardEvents } from '../components/card.js';
import { showToast } from '../components/toast.js';

let reviewWords = [];
let currentIndex = 0;
let sessionId = null;
let startTime = null;
let correctCount = 0;
let totalCount = 0;
let listId = null;

export async function render(container) {
  try {
    const settings = await apiFetch('/settings');
    listId = settings.preferred_list;
  } catch {}

  if (!listId) {
    try {
      const lists = await apiFetch('/lists');
      if (lists && lists.length > 0) listId = lists[0].id;
    } catch {}
  }

  if (!listId) {
    container.innerHTML = `<div class="empty-state"><h3>暂无词库</h3><p>请先选择一个词库</p></div>`;
    return;
  }

  try {
    const session = await apiFetch('/session/start', {
      method: 'POST',
      body: { list_id: listId, session_type: 'review' }
    });
    sessionId = session.id;
  } catch {}

  try {
    const data = await apiFetch(`/lists/${listId}/words/review`);
    reviewWords = data.words || [];
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>获取复习词失败</h3><p>${err.message}</p></div>`;
    return;
  }

  if (reviewWords.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>今日没有需要复习的单词</h3>
        <p>太棒了！所有单词都已复习完毕</p>
      </div>
    `;
    return;
  }

  currentIndex = 0;
  correctCount = 0;
  totalCount = 0;
  showCurrentWord(container);
}

function showCurrentWord(container) {
  const word = reviewWords[currentIndex];

  container.innerHTML = `
    <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">
      复习 ${currentIndex + 1} / ${reviewWords.length}
    </div>
    <div class="progress-bar">
      <div class="progress-bar-fill" style="width: ${(currentIndex / reviewWords.length) * 100}%"></div>
    </div>
    ${cardHTML(word)}
  `;

  startTime = Date.now();
  bindCardEvents(null, (grade) => handleGrade(container, word, grade));
}

async function handleGrade(container, word, grade) {
  const timeMs = Date.now() - startTime;
  totalCount++;
  if (grade >= 3) correctCount++;

  try {
    await apiFetch('/review', {
      method: 'POST',
      body: {
        word_id: word.id,
        list_id: listId,
        grade,
        time_ms: timeMs,
        session_id: sessionId
      }
    });
    showToast(grade >= 3 ? '记住了！' : '需要多复习', grade >= 3 ? 'success' : 'error');
  } catch (err) {
    showToast(`提交失败: ${err.message}`, 'error');
  }

  currentIndex++;
  if (currentIndex < reviewWords.length) {
    showCurrentWord(container);
  } else {
    showSummary(container);
  }
}

function showSummary(container) {
  const accuracy = totalCount > 0 ? Math.round(correctCount / totalCount * 100) : 0;

  if (sessionId) {
    apiFetch('/session/end', {
      method: 'POST',
      body: { session_id: sessionId, words_count: totalCount, correct_count: correctCount }
    }).catch(() => {});
  }

  container.innerHTML = `
    <div class="session-summary">
      <h3>复习完成！</h3>
      <div class="summary-stats">
        <div class="stat-card">
          <div class="stat-value">${totalCount}</div>
          <div class="stat-label">已复习</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${accuracy}%</div>
          <div class="stat-label">正确率</div>
        </div>
      </div>
      <button class="btn-flip" onclick="window.location.hash='#stats'" style="width: 100%; max-width: 200px;">查看统计</button>
    </div>
  `;
}