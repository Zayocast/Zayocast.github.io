let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let correctAnswers = 0;
let userAnswers = [];
let quizLength = 50;
let trainingMode = true;
let useTimer = false;
let selectedCategories = [];
let pilotRank = '';
let pilotName = '';
let startTime = 0;
let questionStartTime = 0;
let questionTimes = [];
let currentTimer = null;

const screens = {
  start: document.getElementById('start-screen'),
  quiz: document.getElementById('quiz-screen'),
  debrief: document.getElementById('debrief-screen')
};

async function loadQuestions() {
  const res = await fetch('questions.json');
  allQuestions = await res.json();
  const el = document.getElementById('total-count');
  if (el) el.textContent = allQuestions.length + ' въпроса';

  populateCategorySelector();
}

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function populateCategorySelector() {
  const container = document.getElementById('category-selector');
  if (!container) return;

  const categories = [...new Set(allQuestions.map(q => q.category))].sort();
  container.innerHTML = '';

  categories.forEach(cat => {
    const chip = document.createElement('div');
    chip.className = 'category-chip active';
    chip.textContent = cat;
    chip.dataset.category = cat;
    chip.onclick = () => {
      chip.classList.toggle('active');
      updateSelectedCategories();
    };
    container.appendChild(chip);
  });

  updateSelectedCategories();
}

function updateSelectedCategories() {
  const container = document.getElementById('category-selector');
  if (!container) return;
  selectedCategories = Array.from(container.querySelectorAll('.category-chip.active'))
    .map(el => el.dataset.category);
}

function selectLength(e) {
  document.querySelectorAll('.length-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  const val = e.target.dataset.length;
  quizLength = val === 'all' ? allQuestions.length : parseInt(val);
}

function shuffleAnswers(question) {
  const indices = [0, 1, 2, 3];
  const shuffledIndices = shuffle(indices);
  const newA = shuffledIndices.map(i => question.a[i]);
  const newCorrect = shuffledIndices.indexOf(question.correct);
  return {
    ...question,
    a: newA,
    correct: newCorrect,
    originalCorrect: question.correct // keep if needed
  };
}

function updateAccuracyDisplay(acc) {
  // No side panel anymore - kept for compatibility
}

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

function startQuiz() {
  pilotRank = document.getElementById('pilot-rank').value.trim() || 'Пилот';
  pilotName = document.getElementById('pilot-name').value.trim() || 'Anon';
  trainingMode = document.getElementById('training-toggle').checked;
  useTimer = document.getElementById('timer-toggle').checked;

  const activeBtn = document.querySelector('.length-btn.active');
  if (activeBtn) {
    const val = activeBtn.dataset.length;
    quizLength = val === 'all' ? allQuestions.length : parseInt(val);
  }

  updateSelectedCategories();

  let filtered = allQuestions;
  if (selectedCategories.length > 0) {
    filtered = allQuestions.filter(q => selectedCategories.includes(q.category));
  }

  if (filtered.length === 0) filtered = allQuestions;

  // Shuffle questions + shuffle answers inside each question
  currentQuestions = shuffle(filtered)
    .slice(0, quizLength)
    .map(q => shuffleAnswers(q));

  currentIndex = 0;
  correctAnswers = 0;
  userAnswers = [];
  questionTimes = [];
  startTime = Date.now();

  showScreen('quiz');
  renderQuestion();
}

function renderQuestion() {
  clearInterval(currentTimer);

  const q = currentQuestions[currentIndex];
  const progress = Math.round(((currentIndex) / currentQuestions.length) * 100);

  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = progress + '%';

  document.getElementById('q-progress').textContent = `${currentIndex + 1} / ${currentQuestions.length}`;
  document.getElementById('question-text').textContent = q.q;

  const categoryEl = document.getElementById('category-badge');
  if (categoryEl) categoryEl.textContent = q.category || '';

  const acc = currentIndex > 0 ? Math.round((correctAnswers / currentIndex) * 100) : 100;
  document.getElementById('accuracy').textContent = acc + '%';
  document.getElementById('live-accuracy').textContent = acc + '%';
  document.getElementById('correct-count').textContent = correctAnswers + ' верни';

  const answersEl = document.getElementById('answers');
  answersEl.innerHTML = '';

  const explanationBox = document.getElementById('explanation-box');
  if (explanationBox) explanationBox.style.display = 'none';

  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) nextBtn.style.display = 'none';

  // Display image if present
  const existingImg = document.getElementById('question-image');
  if (existingImg) existingImg.remove();

  if (q.image) {
    const img = document.createElement('img');
    img.id = 'question-image';
    img.src = 'images/' + q.image;
    img.alt = 'F-16 training visual';
    img.style.cssText = 'max-width:100%; height:auto; border-radius:8px; border:1px solid #334155; margin-bottom:16px; display:block;';
    const questionText = document.getElementById('question-text');
    questionText.parentNode.insertBefore(img, questionText.nextSibling);
  }

  q.a.forEach((answer, i) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.innerHTML = `<span class="letter">${String.fromCharCode(65 + i)}</span><span>${answer}</span>`;
    btn.onclick = () => handleAnswer(i, btn);
    answersEl.appendChild(btn);
  });

  questionStartTime = Date.now();

  const largeTimer = document.getElementById('large-timer');
  if (useTimer) {
    let timeLeft = 30;
    if (largeTimer) {
      largeTimer.style.display = 'block';
      largeTimer.textContent = timeLeft;
    }
    currentTimer = setInterval(() => {
      timeLeft--;
      if (largeTimer) {
        largeTimer.textContent = timeLeft;
        if (timeLeft <= 5) {
          largeTimer.classList.add('urgent');
        } else {
          largeTimer.classList.remove('urgent');
        }
      }
      if (timeLeft <= 0) {
        clearInterval(currentTimer);
        if (largeTimer) {
          largeTimer.style.display = 'none';
          largeTimer.classList.remove('urgent');
        }
        // Auto select or proceed
        const correctBtn = answersEl.children[q.correct];
        if (correctBtn) correctBtn.click();
      }
    }, 1000);
  } else {
    if (largeTimer) largeTimer.style.display = 'none';
  }
}

function handleAnswer(selected, btn) {
  clearInterval(currentTimer);

  const largeTimer = document.getElementById('large-timer');
  if (largeTimer) largeTimer.style.display = 'none';

  const q = currentQuestions[currentIndex];
  const isCorrect = selected === q.correct;
  const elapsed = Math.round((Date.now() - questionStartTime) / 1000);
  questionTimes.push(elapsed);

  if (isCorrect) correctAnswers++;

  userAnswers.push({
    question: q.q,
    selected,
    correct: q.correct,
    options: q.a,
    category: q.category,
    isCorrect,
    time: elapsed,
    explanation: q.explanation || ''
  });

  const allBtns = document.querySelectorAll('#answers .answer-btn');
  allBtns.forEach((b, i) => {
    b.disabled = true;
    if (i === q.correct) b.classList.add('correct');
    if (i === selected && !isCorrect) b.classList.add('wrong');
  });

  // Show explanation
  const explanationBox = document.getElementById('explanation-box');
  const explanationText = document.getElementById('explanation-text');
  if (explanationBox && explanationText && q.explanation) {
    explanationText.textContent = q.explanation;
    explanationBox.style.display = 'block';
  }

  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.style.display = 'inline-block';
    nextBtn.onclick = () => {
      currentIndex++;
      if (currentIndex >= currentQuestions.length) {
        endQuiz();
      } else {
        renderQuestion();
      }
    };
  } else {
    // Fallback auto advance if no button
    setTimeout(() => {
      currentIndex++;
      if (currentIndex >= currentQuestions.length) {
        endQuiz();
      } else {
        renderQuestion();
      }
    }, trainingMode ? 1200 : 1800);
  }
}

function calculateCategoryStats() {
  const stats = {};
  userAnswers.forEach(a => {
    if (!stats[a.category]) stats[a.category] = { correct: 0, total: 0 };
    stats[a.category].total++;
    if (a.isCorrect) stats[a.category].correct++;
  });
  return stats;
}

function getPilotRating(percentage) {
  if (percentage >= 92) return 'Mission Qualified — Advanced';
  if (percentage >= 82) return 'Mission Qualified — Proficient';
  if (percentage >= 70) return 'Combat Ready — Developing';
  if (percentage >= 55) return 'Basic Proficiency';
  return 'Requires Additional Training';
}

function endQuiz() {
  const percentage = Math.round((correctAnswers / currentQuestions.length) * 100);
  const totalSec = Math.round((Date.now() - startTime) / 1000);
  const avg = questionTimes.length ? (questionTimes.reduce((s, t) => s + t, 0) / questionTimes.length).toFixed(1) : '0';

  const fullName = `${pilotRank} ${pilotName}`.trim();

  showScreen('debrief');

  document.getElementById('final-score').textContent = percentage + '%';
  const ratingEl = document.getElementById('pilot-rating');
  ratingEl.textContent = `${getPilotRating(percentage)} — ${fullName}`;

  // Build fresh metrics row
  const metricsEl = document.getElementById('metrics');
  metricsEl.innerHTML = `
    <div class="metric-card">
      <div class="value">${percentage}%</div>
      <div class="label">Точност</div>
    </div>
    <div class="metric-card">
      <div class="value">${correctAnswers}/${currentQuestions.length}</div>
      <div class="label">Верни отговори</div>
    </div>
    <div class="metric-card">
      <div class="value">${totalSec}s</div>
      <div class="label">Общо време</div>
    </div>
    <div class="metric-card">
      <div class="value">${avg}s</div>
      <div class="label">Средно на въпрос</div>
    </div>
  `;

  const categoryStats = calculateCategoryStats();

  createOverallChart(percentage);
  createRadarChart(categoryStats);

  renderReview('all');

  // Save to history
  saveAttemptToHistory(fullName, percentage, currentQuestions.length, totalSec);

  document.querySelectorAll('.filter-bar button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.filter-bar button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderReview(btn.dataset.filter);
    };
  });
}

function createOverallChart(percentage) {
  const ctx = document.getElementById('overall-chart');
  if (window.overallChart) window.overallChart.destroy();
  window.overallChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Верни', 'Грешни'],
      datasets: [{
        data: [percentage, 100 - percentage],
        backgroundColor: ['#f97316', '#334155'],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '72%',
      plugins: { legend: { display: false } }
    }
  });
}

function createRadarChart(catStats) {
  const ctx = document.getElementById('radar-chart');
  const labels = Object.keys(catStats);
  const data = labels.map(l => Math.round((catStats[l].correct / catStats[l].total) * 100));

  if (window.radarChart) window.radarChart.destroy();
  window.radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Точност %',
        data: data,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.18)',
        borderWidth: 2,
        pointBackgroundColor: '#fb923c'
      }]
    },
    options: {
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { stepSize: 25, color: '#64748b' },
          grid: { color: '#334155' },
          angleLines: { color: '#334155' }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function saveAttemptToHistory(fullName, percentage, totalQ, duration) {
  try {
    const history = JSON.parse(localStorage.getItem('grafIgnatievoPilotHistory') || '[]');
    history.unshift({
      date: new Date().toISOString(),
      name: fullName,
      score: percentage,
      questions: totalQ,
      duration: duration
    });
    // Keep last 20
    localStorage.setItem('grafIgnatievoPilotHistory', JSON.stringify(history.slice(0, 20)));
  } catch (e) {}
}

function renderReview(filter) {
  const container = document.getElementById('review-items');
  container.innerHTML = '';

  let filtered = userAnswers;
  if (filter === 'correct') filtered = userAnswers.filter(a => a.isCorrect);
  if (filter === 'wrong') filtered = userAnswers.filter(a => !a.isCorrect);
  if (filter === 'images') filtered = userAnswers.filter(a => a.image);

  filtered.forEach((a, idx) => {
    const div = document.createElement('div');
    div.className = `review-item ${a.isCorrect ? 'correct' : 'wrong'}`;
    const selectedText = a.options[a.selected];
    const correctText = a.options[a.correct];
    let html = `
      <div class="q">${a.question}</div>
    `;
    if (a.image) {
      html += `<img src="images/${a.image}" style="max-width:100%; margin:8px 0; border-radius:6px; border:1px solid #334155;" />`;
    }
    html += `
      <div class="meta">
        Твоят отговор: <strong style="color:${a.isCorrect ? '#10b981' : '#ef4444'}">${selectedText}</strong><br>
        ${a.isCorrect ? '' : `Верен отговор: <strong style="color:#10b981">${correctText}</strong>`}
        <span style="float:right; opacity:0.6; font-size:12px;">${a.category} • ${a.time}s</span>
      </div>
    `;
    if (a.explanation) {
      html += `<div class="explanation-meta" style="margin-top:8px;font-size:13px;color:#94a3b8;">${a.explanation}</div>`;
    }
    div.innerHTML = html;
    container.appendChild(div);
  });
}

function retakeWrong() {
  const missed = userAnswers.filter(a => !a.isCorrect);
  if (missed.length === 0) {
    alert('No missed questions. Excellent work!');
    return;
  }
  const missedIds = new Set(missed.map(m => m.question));
  currentQuestions = allQuestions.filter(q => missedIds.has(q.q));
  currentIndex = 0;
  correctAnswers = 0;
  userAnswers = [];
  questionTimes = [];
  startTime = Date.now();

  showScreen('quiz');
  renderQuestion();
}

function restartQuiz() {
  showScreen('start');
  document.querySelectorAll('.length-btn').forEach((b, i) => {
    b.classList.toggle('active', i === 0);
  });
}

function goToStart() {
  // Clear any running timer
  if (typeof currentTimer !== 'undefined' && currentTimer) {
    clearInterval(currentTimer);
  }
  const largeTimer = document.getElementById('large-timer');
  if (largeTimer) largeTimer.style.display = 'none';
  showScreen('start');
}

function startStudyMode() {
  // Simple study: show all questions with answers and explanations
  pilotRank = document.getElementById('pilot-rank').value.trim() || 'Пилот';
  pilotName = document.getElementById('pilot-name').value.trim() || '';

  let filtered = allQuestions;
  updateSelectedCategories();
  if (selectedCategories.length > 0) {
    filtered = allQuestions.filter(q => selectedCategories.includes(q.category));
  }

  currentQuestions = shuffle(filtered).slice(0, 50); // limit for study

  const debrief = document.getElementById('debrief-screen');
  const container = document.getElementById('review-items');
  const metrics = document.getElementById('metrics');

  showScreen('debrief');

  document.getElementById('final-score').textContent = 'STUDY';
  document.getElementById('pilot-rating').textContent = `Study Mode — ${pilotRank} ${pilotName}`;

  if (metrics) metrics.innerHTML = `<div style="text-align:center; color:#64748b; grid-column: 1 / -1;">Преглед на въпроси с обяснения (фокус върху пилотски знания)</div>`;

  container.innerHTML = '';
  // populate for filter support
  userAnswers = currentQuestions.map(q => ({
    question: q.q,
    selected: q.correct,
    correct: q.correct,
    options: q.a,
    category: q.category,
    isCorrect: true,
    time: 0,
    explanation: q.explanation || '',
    image: q.image || null
  }));

  currentQuestions.forEach(q => {
    const div = document.createElement('div');
    div.className = 'review-item';
    let imgHtml = '';
    if (q.image) {
      imgHtml = `<img src="images/${q.image}" style="max-width:100%; margin:10px 0; border-radius:6px; border:1px solid #334155;" />`;
    }
    div.innerHTML = `
      <div class="q">${q.q}</div>
      ${imgHtml}
      <div class="meta">
        Верен отговор: <strong style="color:#10b981">${q.a[q.correct]}</strong><br>
        ${q.explanation ? q.explanation : ''}
      </div>
    `;
    container.appendChild(div);
  });
}

function startStudyWithImages() {
  pilotRank = document.getElementById('pilot-rank').value.trim() || 'Пилот';
  pilotName = document.getElementById('pilot-name').value.trim() || '';

  let filtered = allQuestions.filter(q => q.image);

  if (filtered.length === 0) {
    alert('Няма въпроси с изображения все още.');
    return;
  }

  currentQuestions = shuffle(filtered).slice(0, 50);

  const container = document.getElementById('review-items');
  const metrics = document.getElementById('metrics');

  showScreen('debrief');

  document.getElementById('final-score').textContent = 'IMAGES';
  document.getElementById('pilot-rating').textContent = `ВЪПРОСИ С ИЗОБРАЖЕНИЯ — ${pilotRank} ${pilotName}`;

  if (metrics) metrics.innerHTML = `<div style="text-align:center; color:#64748b; grid-column: 1 / -1;">Филтър: Само въпроси с изображения</div>`;

  userAnswers = currentQuestions.map(q => ({
    question: q.q,
    selected: q.correct,
    correct: q.correct,
    options: q.a,
    category: q.category,
    isCorrect: true,
    time: 0,
    explanation: q.explanation || '',
    image: q.image || null
  }));

  container.innerHTML = '';
  currentQuestions.forEach(q => {
    const div = document.createElement('div');
    div.className = 'review-item';
    let imgHtml = q.image ? `<img src="images/${q.image}" style="max-width:100%; margin:10px 0; border-radius:6px; border:1px solid #334155;" />` : '';
    div.innerHTML = `
      <div class="q">${q.q}</div>
      ${imgHtml}
      <div class="meta">
        Верен отговор: <strong style="color:#10b981">${q.a[q.correct]}</strong><br>
        ${q.explanation ? q.explanation : ''}
      </div>
    `;
    container.appendChild(div);
  });
}

function showHistory() {
  try {
    const history = JSON.parse(localStorage.getItem('grafIgnatievoPilotHistory') || '[]');
    const container = document.getElementById('review-items');
    const metrics = document.getElementById('metrics');

    showScreen('debrief');
    document.getElementById('final-score').textContent = 'HISTORY';
    document.getElementById('pilot-rating').textContent = 'ПРЕДИШНИ ОПИТИ - F-16';

    if (metrics) metrics.innerHTML = '';

    container.innerHTML = '';
    if (history.length === 0) {
      container.innerHTML = '<div class="review-item">Няма записани опити все още.</div>';
      return;
    }

    history.forEach((h, i) => {
      const div = document.createElement('div');
      div.className = 'review-item';
      div.innerHTML = `
        <div class="q">${new Date(h.date).toLocaleString('bg-BG')} — ${h.name}</div>
        <div class="meta">Резултат: <strong>${h.score}%</strong> (${h.questions} въпроса) • Време: ${h.duration}s</div>
      `;
      container.appendChild(div);
    });
  } catch(e) {
    alert('Историята не е достъпна.');
  }
}

function downloadDebrief() {
  const percentage = Math.round((correctAnswers / currentQuestions.length) * 100);
  const fullName = document.getElementById('pilot-rating').textContent;
  const totalSec = Math.round((Date.now() - startTime) / 1000);

  const html = `
    <html><head><title>F-16 PILOT READINESS REPORT</title>
    <style>body{font-family: system-ui; padding:40px; max-width:900px; margin:auto; line-height:1.5;}
    h1{color:#f97316;} .meta{font-size:14px;color:#64748b;} table{width:100%;border-collapse:collapse;margin:20px 0;}
    td,th{border:1px solid #334155;padding:8px;text-align:left;} .correct{color:#10b981;} .wrong{color:#ef4444;}</style>
    </head><body>
    <h1>F-16</h1>
    <h2>PILOT READINESS REPORT</h2>
    <p class="meta">${fullName} • ${new Date().toLocaleString('bg-BG')}</p>
    <p><strong>Score:</strong> ${percentage}% (${correctAnswers}/${currentQuestions.length}) • Duration: ${totalSec}s</p>
    <h3>Performance by Category</h3>
    <pre>${JSON.stringify(calculateCategoryStats(), null, 2)}</pre>
    <h3>Detailed Answers</h3>
    <table><tr><th>#</th><th>Question</th><th>Your Answer</th><th>Correct</th><th>Explanation</th></tr>
    ${userAnswers.map((a,i) => `
      <tr>
        <td>${i+1}</td>
        <td>${a.question}</td>
        <td class="${a.isCorrect ? 'correct' : 'wrong'}">${a.options[a.selected]}</td>
        <td>${a.options[a.correct]}</td>
        <td>${a.explanation || ''}</td>
      </tr>`).join('')}
    </table>
    <p style="font-size:12px;color:#64748b;">F-16 — PILOT TRAINING</p>
    </body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Graf_Ignatievo_Pilot_Report_${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function setupListeners() {
  document.querySelectorAll('.length-btn').forEach(btn => {
    btn.addEventListener('click', selectLength);
  });

  document.addEventListener('keydown', (e) => {
    if (!screens.quiz.classList.contains('active')) return;
    const key = e.key.toUpperCase();
    const map = { '1': 0, '2': 1, '3': 2, '4': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
    if (map[key] !== undefined) {
      const btns = document.querySelectorAll('#answers .answer-btn');
      if (btns[map[key]] && !btns[map[key]].disabled) {
        btns[map[key]].click();
      }
    }
  });

  // Global filter for review (works in Study too)
  document.querySelectorAll('.filter-bar button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-bar button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderReview(btn.dataset.filter);
    });
  });
}

async function init() {
  await loadQuestions();
  setupListeners();

  const firstBtn = document.querySelector('.length-btn');
  if (firstBtn) firstBtn.classList.add('active');
  quizLength = 50;

  // Default all categories selected
  setTimeout(() => {
    const chips = document.querySelectorAll('.category-chip');
    chips.forEach(c => c.classList.add('active'));
    updateSelectedCategories();
  }, 300);
}

init();