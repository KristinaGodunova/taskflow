import { describe, it, expect } from 'vitest';
import { moveTask } from './moveTask';
import type { ColumnWithTasks, TaskWithAssignee } from '../services/boardDetail';

const task = (id: string, column_id: string, position: number): TaskWithAssignee => ({
  id, column_id, position,
  title: id, description: null, priority: 'medium', due_date: null,
  assignee_id: null, created_by: 'u1', created_at: '', assignee: null,
});

const col = (id: string, ids: string[]): ColumnWithTasks => ({
  id, board_id: 'b1', title: id, position: 0,
  tasks: ids.map((t, i) => task(t, id, i)),
});

const ids = (c: ColumnWithTasks) => c.tasks.map((t) => t.id);
const positions = (c: ColumnWithTasks) => c.tasks.map((t) => t.position);

describe('moveTask', () => {
  const base = () => [col('A', ['a1', 'a2', 'a3']), col('B', ['b1', 'b2']), col('C', [])];

  it('перемещает вниз внутри колонки', () => {
    const r = moveTask(base(), 'a1', 'a3');
    expect(ids(r.columns[0])).toEqual(['a2', 'a3', 'a1']);
    expect(positions(r.columns[0])).toEqual([0, 1, 2]);
    expect(r.updates).toHaveLength(3);
  });

  it('перемещает вверх внутри колонки', () => {
    const r = moveTask(base(), 'a3', 'a1');
    expect(ids(r.columns[0])).toEqual(['a3', 'a1', 'a2']);
  });

  it('переносит из A в B на место карточки', () => {
    const r = moveTask(base(), 'a2', 'b2');
    expect(ids(r.columns[0])).toEqual(['a1', 'a3']);
    expect(positions(r.columns[0])).toEqual([0, 1]);
    expect(ids(r.columns[1])).toEqual(['b1', 'a2', 'b2']);
    expect(r.columns[1].tasks[1].column_id).toBe('B');
    expect(r.updates).toHaveLength(5);
  });

  it('переносит в пустую колонку', () => {
    const r = moveTask(base(), 'a1', 'C');
    expect(ids(r.columns[2])).toEqual(['a1']);
    expect(r.columns[2].tasks[0].position).toBe(0);
  });

  it('переносит в начало и в конец колонки', () => {
    expect(ids(moveTask(base(), 'a1', 'b1').columns[1])).toEqual(['a1', 'b1', 'b2']);
    expect(ids(moveTask(base(), 'a1', 'B').columns[1])).toEqual(['b1', 'b2', 'a1']);
  });

  it('cancel / дроп на себя — ничего не меняет', () => {
    const r = moveTask(base(), 'a1', 'a1');
    expect(r.changed).toBe(false);
    expect(r.updates).toEqual([]);
  });

  it('неизвестные id — ничего не меняет', () => {
    expect(moveTask(base(), 'zzz', 'a1').changed).toBe(false);
    expect(moveTask(base(), 'a1', 'zzz').changed).toBe(false);
  });

  it('не мутирует исходные данные', () => {
    const input = base();
    moveTask(input, 'a1', 'B');
    expect(ids(input[0])).toEqual(['a1', 'a2', 'a3']);
  });
});
