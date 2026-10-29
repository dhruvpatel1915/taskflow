// Pure helpers (no DOM), so they are easy to unit test.
export const todayISO = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const isOverdue = (t, today) => Boolean(t.due) && t.due < today && t.column !== 'done';

export function dueLabel(t, today) {
  if (!t.due) return '';
  if (t.due === today) return 'Today';
  if (t.due === addDays(today, 1)) return 'Tomorrow';
  return new Date(`${t.due}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function filterTasks(tasks, { query = '', priority = 'all' } = {}) {
  const q = query.trim().toLowerCase();
  return tasks.filter((t) =>
    (priority === 'all' || t.priority === priority) &&
    (!q || [t.title, t.description, ...t.tags].join(' ').toLowerCase().includes(q)));
}

export function computeStats(tasks, today) {
  const count = (fn) => tasks.filter(fn).length;
  const done = count((t) => t.column === 'done');
  return {
    total: tasks.length,
    done,
    active: count((t) => t.column === 'doing'),
    overdue: count((t) => isOverdue(t, today)),
    completion: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  };
}

export const parseTags = (text) => [...new Set(text.split(',').map((s) => s.trim()).filter(Boolean))].slice(0, 5);

export function seedTasks(today) {
  const rows = [
    ['Audit current website', 'Review analytics and list pages to keep, merge or remove.', 'done', 'medium', -6, ['research']],
    ['Define design tokens', 'Colours, spacing and typography scale in one shared file.', 'done', 'high', -3, ['design']],
    ['Build responsive navigation', 'Accessible menu that works with keyboard and screen readers.', 'review', 'high', 1, ['frontend', 'a11y']],
    ['Homepage hero section', 'Headline, call to action and optimised image.', 'doing', 'high', 2, ['frontend']],
    ['Write case study copy', 'Three short case studies with measurable results.', 'doing', 'medium', 4, ['content']],
    ['Set up analytics events', 'Track sign-ups and key button clicks.', 'todo', 'medium', 7, ['data']],
    ['Fix image loading performance', 'Lazy-load images and serve modern formats.', 'todo', 'high', -1, ['performance']],
    ['Cross-browser testing', 'Check Chrome, Safari, Firefox and mobile browsers.', 'todo', 'low', 10, ['qa']],
    ['Prepare launch checklist', '', 'todo', 'low', null, []],
  ];
  return rows.map(([title, description, column, priority, offset, tags], i) => ({
    id: `seed${i}`, title, description, column, priority, tags, due: offset === null ? '' : addDays(today, offset),
  }));
}
