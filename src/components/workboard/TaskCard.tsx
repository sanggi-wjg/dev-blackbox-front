import { forwardRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { TaskResponseDto } from '@/api/generated/model';
import { STATUS_CONFIG, isTerminalStatus, relativeTime } from '@/utils/workboard';
import { JiraIcon } from '@/components/icons';

interface TaskCardProps {
  task: TaskResponseDto;
  selected: boolean;
  onSelect: () => void;
  /** 칸반 뷰용 컴팩트 모드: 고정 높이, 콘텐츠 미리보기 숨김 */
  compact?: boolean;
  /** 드래그 핸들 슬롯 (상태 dot 앞에 렌더링) */
  dragHandle?: ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 인라인 스타일 (sortable transform 등) */
  style?: CSSProperties;
}

const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task, selected, onSelect, compact, dragHandle, className = '', style }, ref) => {
    const statusCfg = STATUS_CONFIG[task.status];
    const isTerminal = isTerminalStatus(task.status);
    const isJira = !!task.jira_issue_key;

    // 컴팩트 모드: 태그 최대 2개만 표시
    const tags = task.tags
      ? task.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const visibleTags = compact ? tags.slice(0, 2) : tags;

    return (
      <div
        ref={ref}
        style={style}
        onClick={onSelect}
        className={`group relative cursor-pointer rounded-lg border p-3 transition-colors ${
          compact ? 'h-[72px]' : ''
        } ${
          selected
            ? 'border-brand-500 bg-brand-50 shadow-sm'
            : 'border-border-primary bg-surface hover:border-border-strong hover:bg-surface-hover'
        } ${isTerminal ? 'opacity-60' : ''} ${className}`}
      >
        {/* 상태 + 제목 */}
        <div className="flex items-center gap-2">
          {dragHandle}
          <span className={`h-2 w-2 shrink-0 rounded-full ${statusCfg.dot}`} title={statusCfg.label} />
          <p
            className={`flex-1 truncate font-medium ${compact ? 'text-xs' : 'text-sm'} ${
              isTerminal
                ? 'text-text-tertiary line-through'
                : task.title
                  ? 'text-text-primary'
                  : 'text-text-tertiary italic'
            }`}
          >
            {task.title || '제목 없음'}
          </p>
        </div>

        {/* 태그 + Jira 배지 + 시간 */}
        <div className={`mt-1.5 flex items-center gap-2 ${dragHandle ? 'pl-6' : ''}`}>
          {visibleTags.map((tag) => (
            <span key={tag} className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">
              {tag}
            </span>
          ))}
          {compact && tags.length > 2 && (
            <span className="text-[10px] text-text-tertiary">+{tags.length - 2}</span>
          )}
          {isJira && (
            <span className="inline-flex items-center gap-1 rounded-full bg-platform-jira/10 px-2 py-0.5 text-[10px] font-medium text-platform-jira">
              <JiraIcon className="h-2.5 w-2.5" />
              {task.jira_issue_key}
            </span>
          )}
          <span className="ml-auto text-[10px] text-text-tertiary">{relativeTime(task.updated_at)}</span>
        </div>

        {/* 내용 미리보기 — 컴팩트 모드에서는 숨김 */}
        {!compact && task.content && (
          <p className={`mt-1 text-xs text-text-tertiary line-clamp-2 ${dragHandle ? 'pl-6' : ''}`}>
            {task.content.replace(/[#*`>\-]/g, '').trim()}
          </p>
        )}
      </div>
    );
  },
);

TaskCard.displayName = 'TaskCard';
export default TaskCard;
