import { TaskStatusEnum } from '@/api/generated/model';
import type { TaskResponseDto } from '@/api/generated/model';

export const CATEGORY_PRESETS = ['계획', '긴급', '버그', '회의', '기타'];

export const STATUS_CONFIG: Record<TaskStatusEnum, { label: string; dot: string; textClass: string }> = {
  [TaskStatusEnum.BACKLOG]: { label: 'Backlog', dot: 'bg-text-tertiary', textClass: 'text-text-tertiary' },
  [TaskStatusEnum.TODO]: { label: 'Todo', dot: 'bg-warning-500', textClass: 'text-warning-600' },
  [TaskStatusEnum.IN_PROGRESS]: { label: '진행중', dot: 'bg-brand-500', textClass: 'text-brand-600' },
  [TaskStatusEnum.DONE]: { label: '완료', dot: 'bg-success-500', textClass: 'text-success-600' },
  [TaskStatusEnum.CANCELED]: { label: '취소', dot: 'bg-danger-500', textClass: 'text-danger-600' },
};

export const TERMINAL_STATUSES: TaskStatusEnum[] = [TaskStatusEnum.DONE, TaskStatusEnum.CANCELED];

export function isTerminalStatus(status: TaskStatusEnum): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** 마크다운 복사용 텍스트 생성 */
export function tasksToMarkdown(tasks: TaskResponseDto[]): string {
  return tasks
    .map((t) => {
      const parts: string[] = [];
      const title = t.title || '제목 없음';
      const tag = t.tags ? ` [${t.tags}]` : '';
      const status = STATUS_CONFIG[t.status]?.label ?? t.status;
      parts.push(`## ${title}${tag} (${status})`);
      if (t.content?.trim()) parts.push(t.content);
      return parts.join('\n\n');
    })
    .join('\n\n---\n\n');
}

/** 상대 시간 표시 */
export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return `${Math.floor(days / 30)}개월 전`;
}
