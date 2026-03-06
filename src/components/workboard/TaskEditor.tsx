import { useState, useRef, useEffect, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useTheme } from '@/hooks/useTheme';
import { TaskStatusEnum } from '@/api/generated/model';
import type { TaskResponseDto, TaskUpdateRequestDto } from '@/api/generated/model';
import { CATEGORY_PRESETS, STATUS_CONFIG } from '@/utils/workboard';
import { ConfirmDialog } from '@/components/common/Modal';
import { ArchiveBoxArrowDownIcon, ArchiveBoxIcon, TrashIcon } from '@/components/icons';

interface TaskEditorProps {
  task: TaskResponseDto;
  onUpdate: (taskId: number, data: TaskUpdateRequestDto) => void;
  onDelete: (taskId: number) => void;
  onArchive: (taskId: number) => void;
  saving?: boolean;
}

const DEBOUNCE_MS = 1000;

const STATUS_OPTIONS = [
  TaskStatusEnum.BACKLOG,
  TaskStatusEnum.TODO,
  TaskStatusEnum.IN_PROGRESS,
  TaskStatusEnum.DONE,
  TaskStatusEnum.CANCELED,
];

export default function TaskEditor({ task, onUpdate, onDelete, onArchive, saving = false }: TaskEditorProps) {
  const { theme } = useTheme();
  const [editorHeight, setEditorHeight] = useState(400);
  const editorWrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // 로컬 편집 상태
  const [title, setTitle] = useState(task.title);
  const [content, setContent] = useState(task.content);
  const [tags, setTags] = useState(task.tags ?? '');
  const [status, setStatus] = useState(task.status);

  // 디바운스 저장
  const debouncedSave = useCallback(
    (data: Partial<TaskUpdateRequestDto>) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate(task.id, { title, content, tags: tags || null, status, ...data });
      }, DEBOUNCE_MS);
    },
    [task.id, title, content, tags, status, onUpdate],
  );

  // 언마운트 시 pending 디바운스가 있으면 즉시 flush
  const latestRef = useRef({ title, content, tags, status });
  latestRef.current = { title, content, tags, status };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        onUpdate(task.id, {
          title: latestRef.current.title,
          content: latestRef.current.content,
          tags: latestRef.current.tags || null,
          status: latestRef.current.status,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    debouncedSave({ title: val });
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    debouncedSave({ content: val });
  };

  const handleTagsChange = (val: string) => {
    setTags(val);
    debouncedSave({ tags: val || null });
  };

  const handleStatusChange = (newStatus: TaskStatusEnum) => {
    setStatus(newStatus);
    // 상태 변경은 즉시 저장
    clearTimeout(debounceRef.current);
    onUpdate(task.id, { title, content, tags: tags || null, status: newStatus });
  };

  const handleImmediateSave = () => {
    clearTimeout(debounceRef.current);
    onUpdate(task.id, { title, content, tags: tags || null, status });
  };

  // 에디터 높이 계산 — flex 레이아웃이 결정한 컨테이너 높이를 그대로 사용
  const calcHeight = useCallback(() => {
    if (!editorWrapRef.current) return;
    const h = editorWrapRef.current.clientHeight;
    if (h > 0) setEditorHeight(Math.max(200, h - 3));
  }, []);

  useEffect(() => {
    calcHeight();
    const ro = new ResizeObserver(calcHeight);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [calcHeight]);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* 상단: 제목 + 액션 버튼 */}
      <div className="flex items-start gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="업무 제목"
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleImmediateSave();
            }
          }}
          className="min-w-0 flex-1 rounded-lg border border-border-primary bg-surface px-3 py-2 text-sm font-medium text-text-primary placeholder:text-text-tertiary transition-colors focus:border-border-focus focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        />
        <div className="flex items-center gap-1">
          {saving && <span className="text-xs text-text-tertiary whitespace-nowrap">저장 중...</span>}
          <button
            onClick={() => onArchive(task.id)}
            title={task.is_archived ? '아카이브 해제' : '아카이브'}
            aria-label={task.is_archived ? '아카이브 해제' : '아카이브'}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            {task.is_archived ? (
              <ArchiveBoxIcon className="h-4 w-4" />
            ) : (
              <ArchiveBoxArrowDownIcon className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            title="삭제"
            aria-label="삭제"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-danger-50 hover:text-danger-600"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 상태 셀렉터 */}
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_OPTIONS.map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                status === s
                  ? `${cfg.dot.replace('bg-', 'bg-')}/10 ${cfg.textClass} ring-1 ring-current`
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* 카테고리(태그) */}
      <div className="flex flex-wrap items-center gap-1.5">
        {CATEGORY_PRESETS.map((cat: string) => (
          <button
            key={cat}
            onClick={() => handleTagsChange(tags === cat ? '' : cat)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              tags === cat
                ? 'bg-brand-600 text-text-inverse'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {cat}
          </button>
        ))}
        <input
          type="text"
          value={CATEGORY_PRESETS.includes(tags) ? '' : tags}
          onChange={(e) => handleTagsChange(e.target.value)}
          placeholder="직접 입력"
          className="h-6 w-20 rounded-full border border-border-primary bg-surface px-2 text-xs text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:ring-1 focus:ring-brand-500/20 focus:outline-none"
        />
      </div>

      {/* 마크다운 에디터 — 남은 공간 전체 사용 */}
      <div ref={editorWrapRef} className="min-h-0 flex-1 overflow-hidden" data-color-mode={theme}>
        <MDEditor
          value={content}
          onChange={(val) => handleContentChange(val ?? '')}
          height={editorHeight}
          preview="live"
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !saving) {
              e.preventDefault();
              handleImmediateSave();
            }
          }}
        />
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          onDelete(task.id);
          setDeleteOpen(false);
        }}
        title="업무 삭제"
        message={`"${task.title || '제목 없음'}" 업무를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
      />
    </div>
  );
}
