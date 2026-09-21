import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  pointerWithin,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import {
  batchReorderTasks,
  type ColumnWithTasks,
  type TaskWithAssignee,
  type BoardFullData,
} from '../services/boardDetail';
import { moveTask } from '../utils/moveTask';
import { getErrorMessage } from '../utils/errors';

export const useTaskDnD = (boardId: string) => {
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<TaskWithAssignee | null>(null);
  const snapshotRef = useRef<BoardFullData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      const taskCollision = pointerCollisions.find(
        (c) => args.droppableContainers.find((d) => d.id === c.id)?.data?.current?.type === 'Task'
      );
      if (taskCollision) return [taskCollision];
      return pointerCollisions;
    }
    return closestCenter(args);
  };

  const findColumnByTaskId = (taskId: string, columns: ColumnWithTasks[]) =>
    columns.find((c) => c.tasks.some((t) => t.id === taskId));

  const findColumnById = (colId: string, columns: ColumnWithTasks[]) =>
    columns.find((c) => c.id === colId);

  const restoreSnapshot = () => {
    if (snapshotRef.current) {
      queryClient.setQueryData(['board', boardId], snapshotRef.current);
    }
    snapshotRef.current = null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as TaskWithAssignee | undefined;
    if (task) setActiveTask(task);
    snapshotRef.current = queryClient.getQueryData<BoardFullData>(['board', boardId]) ?? null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    queryClient.setQueryData<BoardFullData>(['board', boardId], (old) => {
      if (!old) return old;

      const sourceCol = findColumnByTaskId(activeId, old.columns);
      const targetCol = findColumnById(overId, old.columns) || findColumnByTaskId(overId, old.columns);
      if (!sourceCol || !targetCol || sourceCol.id === targetCol.id) return old;

      const activeTaskItem = sourceCol.tasks.find((t) => t.id === activeId);
      if (!activeTaskItem) return old;

      const overIndex = targetCol.tasks.findIndex((t) => t.id === overId);
      const newIndex = overIndex >= 0 ? overIndex : targetCol.tasks.length;

      return {
        ...old,
        columns: old.columns.map((c) => {
          if (c.id === sourceCol.id) {
            return { ...c, tasks: c.tasks.filter((t) => t.id !== activeId) };
          }
          if (c.id === targetCol.id) {
            const nextTasks = [...c.tasks];
            nextTasks.splice(newIndex, 0, { ...activeTaskItem, column_id: targetCol.id });
            return { ...c, tasks: nextTasks };
          }
          return c;
        }),
      };
    });
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    restoreSnapshot();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    const snapshot = snapshotRef.current;
    snapshotRef.current = null;
    if (!snapshot) return;

    if (!over) {
      queryClient.setQueryData(['board', boardId], snapshot);
      return;
    }

    const result = moveTask(snapshot.columns, String(active.id), String(over.id));
    if (!result.changed) {
      queryClient.setQueryData(['board', boardId], snapshot);
      return;
    }

    queryClient.setQueryData<BoardFullData>(['board', boardId], {
      ...snapshot,
      columns: result.columns,
    });

    try {
      await batchReorderTasks(result.updates);
    } catch (error) {
      toast.error(getErrorMessage(error));
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    }
  };

  return {
    activeTask,
    sensors,
    collisionDetectionStrategy,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
};
