// Small DOM helpers. Text is always set with textContent/append, never innerHTML (prevents XSS).
export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (k in el) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...kids.flat().filter((x) => x != null && x !== false));
  return el;
}

export function toast(message, { label, onAction } = {}) {
  const el = h('div', { class: 'toast' }, h('span', {}, message),
    label && h('button', { class: 'link', onClick: () => { onAction(); el.remove(); } }, label));
  document.getElementById('toasts').append(el);
  setTimeout(() => el.remove(), 5000);
}

// Task dialog built on the native <dialog> element (focus trap and Esc come for free).
export function openTaskDialog({ task, columns, onSave, onDelete }) {
  const field = (label, control) => h('label', { class: 'field' }, h('span', {}, label), control);
  const title = h('input', { name: 'title', required: true, maxLength: 80, value: task?.title ?? '', placeholder: 'What needs to be done?' });
  const desc = h('textarea', { name: 'description', rows: 3, value: task?.description ?? '' });
  const select = (name, opts, current) => h('select', { name },
    opts.map(([v, text]) => h('option', { value: v, selected: v === current }, text)));
  const priority = select('priority', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']], task?.priority ?? 'medium');
  const column = select('column', columns, task?.column ?? 'todo');
  const due = h('input', { name: 'due', type: 'date', value: task?.due ?? '' });
  const tags = h('input', { name: 'tags', value: task?.tags.join(', ') ?? '', placeholder: 'design, frontend' });

  const dialog = h('dialog', { class: 'dialog' });
  const close = () => { dialog.close(); dialog.remove(); };
  const form = h('form', { onSubmit: (e) => {
    e.preventDefault();
    if (!title.value.trim()) return;
    onSave({ title: title.value.trim(), description: desc.value.trim(), priority: priority.value, column: column.value, due: due.value, tags: tags.value });
    close();
  } },
  h('h2', {}, task ? 'Edit task' : 'New task'),
  field('Title', title), field('Description', desc),
  h('div', { class: 'row' }, field('Priority', priority), field('Status', column)),
  h('div', { class: 'row' }, field('Due date', due), field('Tags (comma separated)', tags)),
  h('div', { class: 'actions' },
    task && h('button', { type: 'button', class: 'btn danger', onClick: () => { onDelete(task); close(); } }, 'Delete'),
    h('span', { class: 'spacer' }),
    h('button', { type: 'button', class: 'btn ghost', onClick: close }, 'Cancel'),
    h('button', { type: 'submit', class: 'btn primary' }, 'Save')));
  dialog.append(form);
  dialog.addEventListener('cancel', () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
  title.focus();
}
