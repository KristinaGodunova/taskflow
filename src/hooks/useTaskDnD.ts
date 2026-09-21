import { useState } from 'react';
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
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import {
  batchReorderTasks,
  type ColumnWithTasks,
  type TaskWithAssignee,
  type TaskPositionUpdate,
  type BoardFullData,
} from '../services/boardDetail';

export const useTaskDnD = (boardId: string) => {
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<TaskWithAssignee | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
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

  const findColumnByTaskId = (taskId: string, columns: ColumnWithTasks[]) => {
    return columns.find((c) => c.tasks.some((t) => t.id === taskId));
  };

  const findColumnById = (colId: string, columns: ColumnWithTasks[]) => {
    return columns.find((c) => c.id === colId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as TaskWithAssignee;
    if (task) setActiveTask(task);
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
            return {
              ...c,
              tasks: c.tasks.filter((t) => t.id !== activeId),
            };
          }
          if (c.id === targetCol.id) {
            const updatedTask: TaskWithAssignee = {
              ...activeTaskItem,
              column_id: targetCol.id,
            };
            const nextTasks = [...c.tasks];
            nextTasks.splice(newIndex, 0, updatedTask);
            return {
              ...c,
              tasks: nextTasks,
            };
          }
          return c;
        }),
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const currentBoard = queryClient.getQueryData<BoardFullData>(['board', boardId]);
    if (!currentBoard) return;

    const sourceCol = findColumnByTaskId(activeId, currentBoard.columns);
    const targetCol = findColumnByTaskId(overId, currentBoard.columns) || findColumnById(overId, currentBoard.columns);

    if (!sourceCol || !targetCol) return;

    // Внутри одной колонки
    if (sourceCol.id === targetCol.id) {
      const oldIndex = sourceCol.tasks.findIndex((t) => t.id === activeId);
      const newIndex = sourceCol.tasks.findIndex((t) => t.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reorderedTasks = arrayMove(sourceCol.tasks, oldIndex, newIndex).map((t, idx) => ({
        ...t,
        position: idx,
      }));

      const updates: TaskPositionUpdate[] = reorderedTasks.map((t) => ({
        id: t.id,
        column_id: sourceCol.id,
        position: t.position,
      }));

      queryClient.setQueryData<BoardFullData>(['board', boardId], {
        ...currentBoard,
        columns: currentBoard.columns.map((c) =>
          c.id === sourceCol.id ? { ...c, tasks: reorderedTasks } : c
        ),
      });

      try {
        await batchReorderTasks(updates);
      } catch {
        queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      }
      return;
    }

    // Между разными колонками
    const targetTasks = [...targetCol.tasks];
    const updates: TaskPositionUpdate[] = targetTasks.map((t, idx) => ({
      id: t.id,
      column_id: targetCol.id,
      position: idx,
    }));

    try {
      await batchReorderTasks(updates);
    } catch {
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
  };
};