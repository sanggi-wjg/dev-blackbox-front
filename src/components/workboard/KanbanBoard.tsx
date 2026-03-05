import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { TaskStatusEnum } from '@/api/generated/model';
import type { TaskResponseDto } from '@/api/generated/model';
import KanbanColumn from './KanbanColumn';

const COLUMN_ORDER: TaskStatusEnum[] = [
  TaskStatusEnum.BACKLOG,
  TaskStatusEnum.TODO,
  TaskStatusEnum.IN_PROGRESS,
  TaskStatusEnum.DONE,
  TaskStatusEnum.CANCELED,
];

interface KanbanBoardProps {
  tasks: TaskResponseDto[];
  selectedTaskId: number | null;
  onSelectTask: (id: number) => void;
  onReorder: (taskIds: number[]) => void;
}

export default function KanbanBoard({ tasks, selectedTaskId, onSelectTask, onReorder }: KanbanBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // 상태별 태스크 그룹핑
  const grouped = COLUMN_ORDER.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<TaskStatusEnum, TaskResponseDto[]>,
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // 드래그된 아이템의 상태(컬럼) 찾기
    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const columnTasks = grouped[activeTask.status];
    const oldIndex = columnTasks.findIndex((t) => t.id === active.id);
    const newIndex = columnTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(columnTasks, oldIndex, newIndex);
    onReorder(reordered.map((t) => t.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMN_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={grouped[status]}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
          />
        ))}
      </div>
    </DndContext>
  );
}