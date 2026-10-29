// Tiny observable store: all state changes go through these functions.
const KEY = 'taskflow:v1';
export const COLUMNS = [['todo', 'To Do'], ['doing', 'In Progress'], ['review', 'Review'], ['done', 'Done']];
let seq = 0;
const uid = () => `t${Date.now().toString(36)}${(seq++).toString(36)}`;

export function createStore(initial = [], persist = () => {}) {
  let state = initial;
  const subs = new Set();
  const set = (next) => { state = next; persist(state); subs.forEach((fn) => fn(state)); };

  return {
    get: () => state,
    subscribe: (fn) => (subs.add(fn), () => subs.delete(fn)),
    add: (data) => {
      const task = { id: uid(), column: 'todo', description: '', priority: 'medium', due: '', tags: [], ...data };
      set([...state, task]);
      return task;
    },
    update: (id, patch) => set(state.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    remove: (id) => {
      const index = state.findIndex((t) => t.id === id);
      const task = state[index];
      set(state.filter((t) => t.id !== id));
      return { task, index };
    },
    restore: (task, index) => { const next = [...state]; next.splice(index, 0, task); set(next); },
    // Move a task to a column, placed before `beforeId` (or at the end of the column).
    move: (id, column, beforeId = null) => {
      const task = state.find((t) => t.id === id);
      if (!task || id === beforeId) return;
      const rest = state.filter((t) => t.id !== id);
      const moved = { ...task, column };
      const at = beforeId ? rest.findIndex((t) => t.id === beforeId) : -1;
      if (at >= 0) rest.splice(at, 0, moved);
      else {
        const last = rest.map((t) => t.column).lastIndexOf(column);
        rest.splice(last + 1, 0, moved);
      }
      set(rest);
    },
  };
}

export function loadTasks(storage = globalThis.localStorage) {
  try { const v = JSON.parse(storage.getItem(KEY)); return Array.isArray(v) ? v : null; } catch { return null; }
}
export function saveTasks(tasks, storage = globalThis.localStorage) {
  try { storage.setItem(KEY, JSON.stringify(tasks)); } catch { /* storage unavailable */ }
}
