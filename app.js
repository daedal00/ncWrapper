const STORAGE_PREFIX = 'ncw:';
const questions = window.NC_QUESTIONS;
let current = questions[0];

const els = {
  functionName: document.querySelector('#functionName'),
  problemList: document.querySelector('#problemList'),
  categoryFilter: document.querySelector('#categoryFilter'),
  difficultyFilter: document.querySelector('#difficultyFilter'),
  problemSearch: document.querySelector('#problemSearch'),
  editor: document.querySelector('#codeEditor'),
  lines: document.querySelector('#lineNumbers'),
  output: document.querySelector('#output'),
  testCases: document.querySelector('#testCases'),
  doneCount: document.querySelector('#doneCount'),
  totalCount: document.querySelector('#totalCount'),
  progressFill: document.querySelector('#progressFill'),
  progressText: document.querySelector('#progressText'),
  handlerName: document.querySelector('#handlerName'),
  lastSaved: document.querySelector('#lastSaved'),
  stealthMode: document.querySelector('#stealthMode'),
};

function key(id, suffix) { return `${STORAGE_PREFIX}${id}:${suffix}`; }
function getSaved(id) { return localStorage.getItem(key(id, 'saved')) === 'true'; }
function getCode(q) { return localStorage.getItem(key(q.id, 'code')) || templateFor(q); }
function templateFor(q) {
  return `// ${q.category} deployment note\n// Handler contract: ${q.signature}\n// Practice prompt reference is intentionally kept as a comment.\n\nexports.handler = (event) => {\n  ${q.starter.split('\n').join('\n  ')}\n};\n`;
}
function stableStringify(value) { return JSON.stringify(value, Object.keys(value || {}).sort()); }
function equal(a, b) { return stableStringify(a) === stableStringify(b); }
function lineCount() { els.lines.textContent = Array.from({ length: els.editor.value.split('\n').length }, (_, i) => i + 1).join('\n'); }

function categories() {
  const names = ['all', ...new Set(questions.map(q => q.category))];
  els.categoryFilter.innerHTML = names.map(c => `<option value="${c}">${c === 'all' ? 'All layers' : c}</option>`).join('');
}
function filteredQuestions() {
  const category = els.categoryFilter.value;
  const diff = els.difficultyFilter.value;
  const term = els.problemSearch.value.toLowerCase();
  return questions.filter(q => (category === 'all' || q.category === category) && (diff === 'all' || q.difficulty === diff) && `${q.title} ${q.category}`.toLowerCase().includes(term));
}
function renderList() {
  els.problemList.innerHTML = filteredQuestions().map(q => `
    <button class="problem-item ${q.id === current.id ? 'active' : ''} ${getSaved(q.id) ? 'done' : ''}" data-id="${q.id}">
      <div class="problem-title">${q.title}</div>
      <div class="problem-meta"><span class="category-name">${q.category}</span><span>${q.difficulty}</span></div>
    </button>`).join('');
}
function renderProgress() {
  const done = questions.filter(q => getSaved(q.id)).length;
  const pct = Math.round((done / questions.length) * 100);
  els.doneCount.textContent = done;
  els.totalCount.textContent = questions.length;
  els.progressFill.style.width = `${pct}%`;
  els.progressText.textContent = `${pct}% complete`;
}
function renderTests(results = []) {
  els.testCases.innerHTML = current.tests.map((t, i) => {
    const result = results[i];
    const state = result ? (result.pass ? 'pass' : 'fail') : '';
    return `<div class="test-case ${state}"><strong>Event ${i + 1}</strong><br/>Input: ${JSON.stringify(t.input)}<br/>Expected: ${JSON.stringify(t.expected)}${result ? `<br/>Actual: ${JSON.stringify(result.actual)}` : ''}</div>`;
  }).join('');
}
function selectQuestion(id) {
  current = questions.find(q => q.id === id) || questions[0];
  els.functionName.textContent = current.id;
  els.handlerName.textContent = `${current.id}.handler`;
  els.editor.value = getCode(current);
  els.lastSaved.textContent = localStorage.getItem(key(current.id, 'savedAt')) || 'Never';
  renderList(); renderTests(); lineCount();
}
function runTests() {
  localStorage.setItem(key(current.id, 'code'), els.editor.value);
  const source = `${els.editor.value}\nreturn exports.handler(event);`;
  const results = [];
  const logs = [`START RequestId: local-${Date.now()} Version: $LATEST`];
  for (const test of current.tests) {
    try {
      const fn = new Function('event', 'exports', source);
      const actual = fn(structuredClone(test.input), {});
      if (actual && typeof actual.then === 'function') throw new Error('Async handlers are not supported in the local runner.');
      const pass = equal(actual, test.expected);
      results.push({ pass, actual });
      logs.push(`${pass ? 'PASS' : 'FAIL'} ${JSON.stringify(test.input)} => ${JSON.stringify(actual)}`);
    } catch (err) {
      results.push({ pass: false, actual: String(err.message || err) });
      logs.push(`ERROR ${String(err.stack || err)}`);
    }
  }
  const passed = results.filter(r => r.pass).length;
  logs.push(`END RequestId: local-${Date.now()}`);
  logs.push(`REPORT Tests: ${passed}/${results.length} passed`);
  els.output.textContent = logs.join('\n');
  renderTests(results);
  return passed === results.length;
}
function saveProblem() {
  const passed = runTests();
  if (!passed && !confirm('Not all local tests passed. Mark this function saved anyway?')) return;
  localStorage.setItem(key(current.id, 'saved'), 'true');
  localStorage.setItem(key(current.id, 'savedAt'), new Date().toLocaleString());
  els.lastSaved.textContent = localStorage.getItem(key(current.id, 'savedAt'));
  els.output.textContent += '\nSAVE_COMPLETE Function configuration updated locally.';
  renderList(); renderProgress();
}

categories();
renderProgress();
selectQuestion(current.id);
els.editor.addEventListener('input', () => { localStorage.setItem(key(current.id, 'code'), els.editor.value); lineCount(); });
els.problemList.addEventListener('click', e => { const btn = e.target.closest('[data-id]'); if (btn) selectQuestion(btn.dataset.id); });
['change', 'input'].forEach(evt => { els.categoryFilter.addEventListener(evt, renderList); els.difficultyFilter.addEventListener(evt, renderList); els.problemSearch.addEventListener(evt, renderList); });
document.querySelector('#runTests').addEventListener('click', runTests);
document.querySelector('#submitProblem').addEventListener('click', saveProblem);
document.querySelector('#clearOutput').addEventListener('click', () => { els.output.textContent = 'Cleared.'; });
document.querySelector('#openProblem').addEventListener('click', () => window.open(current.link, '_blank', 'noopener'));
els.stealthMode.addEventListener('change', () => document.body.classList.toggle('focus', els.stealthMode.checked));
document.body.classList.toggle('focus', els.stealthMode.checked);
