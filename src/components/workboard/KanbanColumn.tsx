import type { TaskResponseDto, TaskStatusEnum } from '@/api/generated/model';
import { STATUS_CONFIG } from '@/utils/workboard';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatusEnum;
  tasks: TaskResponseDto[];
  selectedTaskId: number | null;
  onSelectTask: (id: number) => void;
}

export default function KanbanColumn({ status, tasks, selectedTaskId, onSelectTask }: KanbanColumnProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex min-w-[260px] flex-col rounded-xl border border-border-primary bg-surface-secondary">
      {/* Column header */}
      <div className="flex items-center gap-2 border-b border-border-primary px-3 py-2.5">
        <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
        <span className="text-sm font-semibold text-text-primary">{config.label}</span>
        <span className="ml-auto rounded-full bg-surface-tertiary px-2 py-0.5 text-xs font-medium text-text-tertiary">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-xs text-text-tertiary">항목 없음</p>
        ) : (
          tasks.map((task, index) => (
            <div key={task.id} className="animate-stagger-up" style={{ animationDelay: `${index * 60}ms` }}>
              <TaskCard task={task} selected={task.id === selectedTaskId} onSelect={() => onSelectTask(task.id)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
