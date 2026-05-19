import { apiFetch } from '../api.js';
import { showToast } from '../components/toast.js';

export async function render(container) {
  let lists;
  try {
    lists = await apiFetch('/lists');
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>加载词库失败</h3><p>${err.message}</p></div>`;
    return;
  }

  container.innerHTML = `
    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">词库管理</h3>
    <div id="lists-container"></div>
    <button class="btn-flip" id="btn-create-list" style="margin-top: 16px;">创建自定义词库</button>
  `;

  const listsContainer = document.getElementById('lists-container');

  for (const list of (lists || [])) {
    const card = document.createElement('div');
    card.className = 'list-card';
    card.innerHTML = `
      <div class="list-name">${list.name}</div>
      <div class="list-desc">${list.description || ''}</div>
      <div class="list-stats">${list.is_public ? '公共词库' : '个人词库'}</div>
    `;
    card.addEventListener('click', () => {
      showListDetail(container, list);
    });
    listsContainer.appendChild(card);
  }

  document.getElementById('btn-create-list').addEventListener('click', () => {
    showCreateListForm(container);
  });
}

async function showListDetail(container, list) {
  let words;
  try {
    const data = await apiFetch(`/lists/${list.id}/words?limit=100`);
    words = data.words || [];
  } catch (err) {
    showToast(`获取单词失败: ${err.message}`, 'error');
    return;
  }

  container.innerHTML = `
    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">${list.name}</h3>
    <p style="color: var(--text-secondary); margin-bottom: 16px;">共 ${words.length} 个单词</p>
    <div id="words-list"></div>
    <button class="btn-flip" id="btn-back" style="margin-top: 16px;">返回词库列表</button>
    ${!list.is_public ? '<button class="btn-flip" id="btn-add-word" style="margin-top: 8px; background: var(--success);">添加单词</button>' : ''}
  `;

  const wordsList = document.getElementById('words-list');
  for (const word of words) {
    wordsList.innerHTML += `
      <div style="padding: 8px 0; border-bottom: 1px solid var(--border);">
        <strong>${word.word}</strong> <span style="color: var(--text-secondary);">${word.pos || ''}</span>
        <span style="color: var(--primary);">${word.definition}</span>
      </div>
    `;
  }

  document.getElementById('btn-back').addEventListener('click', () => render(container));

  const addBtn = document.getElementById('btn-add-word');
  if (addBtn) {
    addBtn.addEventListener('click', () => showAddWordForm(container, list));
  }
}

function showCreateListForm(container) {
  container.innerHTML = `
    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">创建词库</h3>
    <div class="auth-form">
      <div class="form-group">
        <label>词库名称</label>
        <input type="text" id="list-name" placeholder="输入词库名称">
      </div>
      <div class="form-group">
        <label>描述</label>
        <input type="text" id="list-desc" placeholder="简短描述">
      </div>
      <button class="btn-primary" id="btn-submit-list">创建</button>
    </div>
    <button class="btn-flip" id="btn-back" style="margin-top: 16px;">返回</button>
  `;

  document.getElementById('btn-back').addEventListener('click', () => render(container));

  document.getElementById('btn-submit-list').addEventListener('click', async () => {
    const name = document.getElementById('list-name').value.trim();
    const desc = document.getElementById('list-desc').value.trim();

    if (!name) { showToast('请输入词库名称', 'error'); return; }

    try {
      await apiFetch('/lists', {
        method: 'POST',
        body: { name, description: desc }
      });
      showToast('词库创建成功！', 'success');
      render(container);
    } catch (err) {
      showToast(`创建失败: ${err.message}`, 'error');
    }
  });
}

function showAddWordForm(container, list) {
  container.innerHTML = `
    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">添加单词到 ${list.name}</h3>
    <div class="auth-form">
      <div class="form-group">
        <label>单词</label>
        <input type="text" id="word-input" placeholder="英文单词">
      </div>
      <div class="form-group">
        <label>释义</label>
        <input type="text" id="definition-input" placeholder="中文释义">
      </div>
      <div class="form-group">
        <label>发音</label>
        <input type="text" id="pronunciation-input" placeholder="/əˈbændən/">
      </div>
      <div class="form-group">
        <label>例句</label>
        <input type="text" id="example-input" placeholder="英文例句">
      </div>
      <div class="form-group">
        <label>例句翻译</label>
        <input type="text" id="example-translation-input" placeholder="中文翻译">
      </div>
      <div class="form-group">
        <label>词性</label>
        <input type="text" id="pos-input" placeholder="n./v./adj.">
      </div>
      <button class="btn-primary" id="btn-submit-word">添加</button>
    </div>
    <button class="btn-flip" id="btn-back" style="margin-top: 16px;">返回</button>
  `;

  document.getElementById('btn-back').addEventListener('click', () => showListDetail(container, list));

  document.getElementById('btn-submit-word').addEventListener('click', async () => {
    const word = document.getElementById('word-input').value.trim();
    const definition = document.getElementById('definition-input').value.trim();

    if (!word || !definition) { showToast('单词和释义必填', 'error'); return; }

    try {
      await apiFetch(`/lists/${list.id}/words`, {
        method: 'POST',
        body: {
          word,
          definition,
          pronunciation: document.getElementById('pronunciation-input').value.trim(),
          example: document.getElementById('example-input').value.trim(),
          example_translation: document.getElementById('example-translation-input').value.trim(),
          pos: document.getElementById('pos-input').value.trim()
        }
      });
      showToast('单词添加成功！', 'success');
      showListDetail(container, list);
    } catch (err) {
      showToast(`添加失败: ${err.message}`, 'error');
    }
  });
}