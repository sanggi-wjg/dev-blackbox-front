import type { TaskResponseDto } from '@/api/generated/model';
import { STATUS_CONFIG, isTerminalStatus, relativeTime } from '@/utils/workboard';

interface TaskCardProps {
  task: TaskResponseDto;
  selected: boolean;
  onSelect: () => void;
}

export default function TaskCard({ task, selected, onSelect }: TaskCardProps) {
  const statusCfg = STATUS_CONFIG[task.status];
  const isTerminal = isTerminalStatus(task.status);

  return (
    <div
      onClick={onSelect}
      className={`group relative cursor-pointer rounded-lg border p-3 transition-colors ${
        selected
          ? 'border-brand-500 bg-brand-50 shadow-sm'
          : 'border-border-primary bg-surface hover:border-border-strong hover:bg-surface-hover'
      } ${isTerminal ? 'opacity-60' : ''}`}
    >
      {/* 상태 + 제목 */}
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${statusCfg.dot}`} title={statusCfg.label} />
        <p
          className={`flex-1 truncate text-sm font-medium ${
            isTerminal ? 'text-text-tertiary line-through' : task.title ? 'text-text-primary' : 'text-text-tertiary italic'
          }`}
        >
          {task.title || '제목 없음'}
        </p>
      </div>

      {/* 태그 + 시간 */}
      <div className="mt-1.5 flex items-center gap-2">
        {task.tags && (
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">
            {task.tags}
          </span>
        )}
        <span className="ml-auto text-[10px] text-text-tertiary">{relativeTime(task.updated_at)}</span>
      </div>

      {/* 내용 미리보기 */}
      {task.content && (
        <p className="mt-1 text-xs text-text-tertiary line-clamp-2">
          {task.content.replace(/[#*`>\-]/g, '').trim()}
        </p>
      )}
    </div>
  );
}
