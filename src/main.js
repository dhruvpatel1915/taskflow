import './style.css';
import { COLUMNS, createStore, loadTasks, saveTasks } from './store.js';
import { computeStats, dueLabel, filterTasks, isOverdue, parseTags, seedTasks, todayISO } from './lib.js';
import { h, openTaskDialog, toast } from './ui.js';

const today = todayISO();
const store = createStore(loadTasks() ?? seedTasks(today), saveTasks);
const filters = { query: '', priority: 'all' };
const $ = (id) => document.getElementById(id);

// ---------- Rendering ----------
function renderStats() {
  const s = computeStats(store.get(), today);
  const card = (label, value, extra) => h('div', { class: 'stat' }, h('span', { class: 'label' }, label), h('strong', {}, value), extra);
  $('stats').replaceChildren(
    card('Total tasks', s.total),
    card('In progress', s.active),
    card('Overdue', s.overdue, null),
    card('Completed', `${s.completion}%`,
      h('div', { class: 'bar', role: 'progressbar', 'aria-valuenow': s.completion, 'aria-valuemin': 0, 'aria-valuemax': 100 },
        h('i', { style: `width:${s.completion}%` }))));
  $('stats').children[2].classList.toggle('alert', s.overdue > 0);
}

function renderCard(task) {
  const idx = COLUMNS.findIndex(([id]) => id === task.column);
  const move = (dir, symbol) => {
    const target = COLUMNS[idx + dir];
    return target && h('button', { class: 'icon', 'aria-label': `Move to ${target[1]}`, onClick: (e) => { e.stopPropagation(); store.move(task.id, target[0]); } }, symbol);
  };
  const due = dueLabel(task, today);
  return h('article', {
    class: 'card', draggable: true, tabIndex: 0, 'data-id': task.id,
    onClick: () => edit(task),
    onKeydown: (e) => { if (e.key === 'Enter') edit(task); },
    onDragstart: (e) => { e.dataTransfer.setData('text/plain', task.id); e.currentTarget.classList.add('dragging'); },
    onDragend: (e) => e.currentTarget.classList.remove('dragging'),
  },
  h('div', { class: 'card-top' }, h('span', { class: `chip p-${task.priority}` }, task.priority), h('span', { class: 'spacer' }), move(-1, '‹'), move(1, '›')),
  h('h3', {}, task.title),
  task.description && h('p', {}, task.description),
  h('div', { class: 'meta' },
    due && h('span', { class: `due${isOverdue(task, today) ? ' late' : ''}` }, `📅 ${due}${isOverdue(task, today) ? ' · overdue' : ''}`),
    task.tags.map((t) => h('span', { class: 'tag' }, `#${t}`))));
}

function renderBoard() {
  const visible = filterTasks(store.get(), filters);
  $('board').replaceChildren(...COLUMNS.map(([id, name]) => {
    const items = visible.filter((t) => t.column === id);
    const list = h('div', { class: 'list' }, items.map(renderCard), !items.length && h('p', { class: 'empty' }, 'Nothing here'));
    list.addEventListener('dragover', (e) => { e.preventDefault(); list.classList.add('over'); });
    list.addEventListener('dragleave', () => list.classList.remove('over'));
    list.addEventListener('drop', (e) => {
      e.preventDefault();
      list.classList.remove('over');
      const cards = [...list.querySelectorAll('.card:not(.dragging)')];
      const before = cards.find((c) => { const r = c.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
      store.move(e.dataTransfer.getData('text/plain'), id, before?.dataset.id ?? null);
    });
    return h('section', { class: 'column', 'aria-label': name }, h('header', {}, h('h2', {}, name), h('span', { class: 'count' }, items.length)), list);
  }));
}

const render = () => { renderStats(); renderBoard(); };
store.subscribe(render);
render();

// ---------- Actions ----------
function edit(task) {
  openTaskDialog({
    task, columns: COLUMNS,
    onSave: (data) => { store.update(task.id, { ...data, tags: parseTags(data.tags) }); toast('Task updated'); },
    onDelete: (t) => { const { task: removed, index } = store.remove(t.id); toast('Task deleted', { label: 'Undo', onAction: () => store.restore(removed, index) }); },
  });
}
$('new').addEventListener('click', () => openTaskDialog({
  columns: COLUMNS,
  onSave: (data) => { store.add({ ...data, tags: parseTags(data.tags) }); toast('Task created'); },
}));
$('search').addEventListener('input', (e) => { filters.query = e.target.value; renderBoard(); });
$('priority').addEventListener('change', (e) => { filters.priority = e.target.value; renderBoard(); });

// ---------- Theme ----------
const root = document.documentElement;
const saved = (() => { try { return localStorage.getItem('taskflow:theme'); } catch { return null; } })();
root.dataset.theme = saved ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
$('theme').addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('taskflow:theme', root.dataset.theme); } catch { /* ignore */ }
});

// ---------- Shortcuts: N = new task, / = search ----------
addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select, dialog') || e.metaKey || e.ctrlKey) return;
  if (e.key === 'n') { e.preventDefault(); $('new').click(); }
  if (e.key === '/') { e.preventDefault(); $('search').focus(); }
});
