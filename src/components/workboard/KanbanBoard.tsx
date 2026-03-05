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
}

export default function KanbanBoard({ tasks, selectedTaskId, onSelectTask }: KanbanBoardProps) {
  // 상태별 태스크 그룹핑
  const grouped = COLUMN_ORDER.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<TaskStatusEnum, TaskResponseDto[]>,
  );

  return (
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
  );
}
