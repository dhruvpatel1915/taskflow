import { describe, it, expect } from 'vitest';
import { createStore } from '../src/store.js';
import { filterTasks, computeStats, isOverdue, parseTags, addDays, dueLabel } from '../src/lib.js';

const sample = () => [
  { id: 'a', title: 'Alpha', description: '', column: 'todo', priority: 'high', due: '2026-01-01', tags: ['ui'] },
  { id: 'b', title: 'Beta', description: 'api work', column: 'todo', priority: 'low', due: '', tags: [] },
  { id: 'c', title: 'Gamma', description: '', column: 'done', priority: 'medium', due: '2026-01-01', tags: [] },
];

describe('store', () => {
  it('adds, updates and removes tasks', () => {
    const s = createStore([]);
    const t = s.add({ title: 'New' });
    expect(s.get()).toHaveLength(1);
    s.update(t.id, { title: 'Renamed' });
    expect(s.get()[0].title).toBe('Renamed');
    s.remove(t.id);
    expect(s.get()).toHaveLength(0);
  });
  it('restores a removed task at its old position (undo)', () => {
    const s = createStore(sample());
    const { task, index } = s.remove('b');
    s.restore(task, index);
    expect(s.get().map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });
  it('moves a task to another column and keeps ordering', () => {
    const s = createStore(sample());
    s.move('a', 'done');
    expect(s.get().find((t) => t.id === 'a').column).toBe('done');
    s.move('b', 'done', 'c');
    const done = s.get().filter((t) => t.column === 'done').map((t) => t.id);
    expect(done).toEqual(['b', 'c', 'a'].filter((id) => done.includes(id)));
    expect(done.indexOf('b')).toBeLessThan(done.indexOf('c'));
  });
  it('notifies subscribers and persists', () => {
    let saved = null, calls = 0;
    const s = createStore([], (t) => { saved = t; });
    s.subscribe(() => calls++);
    s.add({ title: 'X' });
    expect(calls).toBe(1);
    expect(saved).toHaveLength(1);
  });
});

describe('helpers', () => {
  it('filters by query and priority', () => {
    expect(filterTasks(sample(), { query: 'api' }).map((t) => t.id)).toEqual(['b']);
    expect(filterTasks(sample(), { priority: 'high' }).map((t) => t.id)).toEqual(['a']);
    expect(filterTasks(sample(), { query: 'ui' })).toHaveLength(1);
  });
  it('detects overdue tasks (done tasks are never overdue)', () => {
    const [a, , c] = sample();
    expect(isOverdue(a, '2026-02-01')).toBe(true);
    expect(isOverdue(c, '2026-02-01')).toBe(false);
  });
  it('computes stats', () => {
    expect(computeStats(sample(), '2026-02-01')).toEqual({ total: 3, done: 1, active: 0, overdue: 1, completion: 33 });
  });
  it('parses tags without duplicates and limits to 5', () => {
    expect(parseTags('a, b, a, ,c,d,e,f')).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
  it('labels due dates', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(dueLabel({ due: '2026-05-02' }, '2026-05-01')).toBe('Tomorrow');
  });
});
