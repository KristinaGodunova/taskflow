import { arrayMove } from '@dnd-kit/sortable';
import type { ColumnWithTasks, TaskPositionUpdate } from '../services/boardDetail';

export interface MoveTaskResult {
  columns: ColumnWithTasks[];
  updates: TaskPositionUpdate[];
  changed: boolean;
}

const normalize = (col: ColumnWithTasks): ColumnWithTasks => ({
  ...col,
  tasks: col.tasks.map((t, idx) => ({ ...t, column_id: col.id, position: idx })),
});

const toUpdates = (col: ColumnWithTasks): TaskPositionUpdate[] =>
  col.tasks.map((t) => ({ id: t.id, column_id: col.id, position: t.position }));

export const moveTask = (
  columns: ColumnWithTasks[],
  activeId: string,
  overId: string
): MoveTaskResult => {
  const unchanged: MoveTaskResult = { columns, updates: [], changed: false };

  const sourceCol = columns.find((c) => c.tasks.some((t) => t.id === activeId));
  const targetCol =
    columns.find((c) => c.id === overId) ??
    columns.find((c) => c.tasks.some((t) => t.id === overId));

  if (!sourceCol || !targetCol) return unchanged;

  const fromIndex = sourceCol.tasks.findIndex((t) => t.id === activeId);
  const task = sourceCol.tasks[fromIndex];

  if (sourceCol.id === targetCol.id) {
    const toIndex =
      overId === targetCol.id
        ? targetCol.tasks.length - 1
        : targetCol.tasks.findIndex((t) => t.id === overId);

    if (toIndex < 0 || toIndex === fromIndex) return unchanged;

    const reordered = normalize({
      ...sourceCol,
      tasks: arrayMove(sourceCol.tasks, fromIndex, toIndex),
    });

    return {
      columns: columns.map((c) => (c.id === reordered.id ? reordered : c)),
      updates: toUpdates(reordered),
      changed: true,
    };
  }

  const newSource = normalize({
    ...sourceCol,
    tasks: sourceCol.tasks.filter((t) => t.id !== activeId),
  });

  const insertAt =
    overId === targetCol.id
      ? targetCol.tasks.length
      : targetCol.tasks.findIndex((t) => t.id === overId);

  const targetTasks = [...targetCol.tasks];
  targetTasks.splice(insertAt, 0, task);
  const newTarget = normalize({ ...targetCol, tasks: targetTasks });

  return {
    columns: columns.map((c) => {
      if (c.id === newSource.id) return newSource;
      if (c.id === newTarget.id) return newTarget;
      return c;
    }),
    updates: [...toUpdates(newSource), ...toUpdates(newTarget)],
    changed: true,
  };
};
