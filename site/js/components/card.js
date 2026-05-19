export function cardHTML(word) {
  return `
    <div class="word-card" id="word-card">
      <div class="word-card-inner" id="card-inner">
        <div class="word-card-front">
          <div class="card-word">${word.word}</div>
          ${word.pronunciation ? `<div class="card-pronunciation">${word.pronunciation}</div>` : ''}
          ${word.pos ? `<div class="card-pos">${word.pos}</div>` : ''}
          <div class="card-actions">
            <button class="btn-flip" id="btn-flip">显示释义</button>
          </div>
        </div>
        <div class="word-card-back">
          <div class="card-definition">${word.definition}</div>
          ${word.pos ? `<div class="card-pos">${word.pos}</div>` : ''}
          ${word.example ? `<div class="card-example">${word.example}</div>` : ''}
          ${word.example_translation ? `<div class="card-example-translation">${word.example_translation}</div>` : ''}
          <div class="card-actions">
            <button class="btn-flip" id="btn-flip-back">返回正面</button>
          </div>
        </div>
      </div>
      <div class="grade-buttons" id="grade-buttons" style="display: none;">
        <button class="grade-btn" data-grade="1">忘了</button>
        <button class="grade-btn" data-grade="3">困难</button>
        <button class="grade-btn" data-grade="4">良好</button>
        <button class="grade-btn" data-grade="5">简单</button>
      </div>
    </div>
  `;
}

export function bindCardEvents(onFlip, onGrade) {
  document.getElementById('btn-flip').addEventListener('click', () => {
    document.getElementById('card-inner').classList.add('flipped');
    document.getElementById('grade-buttons').style.display = 'flex';
    if (onFlip) onFlip();
  });

  document.getElementById('btn-flip-back').addEventListener('click', () => {
    document.getElementById('card-inner').classList.remove('flipped');
    document.getElementById('grade-buttons').style.display = 'none';
  });

  document.querySelectorAll('.grade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const grade = parseInt(btn.dataset.grade);
      if (onGrade) onGrade(grade);
    });
  });
}