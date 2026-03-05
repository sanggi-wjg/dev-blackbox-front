import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TaskStatusEnum } from '@/api/generated/model';
import type { TaskUpdateRequestDto, GetTasksApiV1TasksGetParams } from '@/api/generated/model';
import {
  useGetTasksApiV1TasksGet,
  useCreateTaskApiV1TasksPost,
  useUpdateTaskApiV1TasksTaskIdPut,
  useDeleteTaskApiV1TasksTaskIdDelete,
} from '@/api/generated/task/task';
import TaskStatusFilter from '@/components/workboard/TaskStatusFilter';
import type { FilterValue } from '@/components/workboard/TaskStatusFilter';
import TaskCard from '@/components/workboard/TaskCard';
import TaskEditor from '@/components/workboard/TaskEditor';
import Button from '@/components/common/Button';
import { useToast } from '@/components/common/Toast';
import { PlusIcon, ClipboardDocumentIcon, ArrowLeftIcon } from '@/components/icons';
import { tasksToMarkdown } from '@/utils/workboard';

// 필터 → API query params 변환
function getFilterParams(filter: FilterValue): GetTasksApiV1TasksGetParams {
  if (filter === 'all') {
    return { is_archived: false };
  }
  if (filter === 'archived') {
    return { is_archived: true };
  }
  // 개별 상태 필터
  return { status: [filter], is_archived: false };
}

export default function WorkBoardPage() {
  const [filter, setFilter] = useState<FilterValue>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filterParams = getFilterParams(filter);

  const { data: tasks = [] } = useGetTasksApiV1TasksGet(filterParams);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  // 모든 필터의 건수를 위해 전체 데이터도 조회
  const { data: allTasks = [] } = useGetTasksApiV1TasksGet({ is_archived: false });
  const { data: archivedTasks = [] } = useGetTasksApiV1TasksGet({ is_archived: true });

  const counts: Partial<Record<FilterValue, number>> = {
    all: allTasks.length,
    archived: archivedTasks.length,
  };
  // 개별 상태별 건수
  for (const status of Object.values(TaskStatusEnum)) {
    counts[status] = allTasks.filter((t) => t.status === status).length;
  }

  const createTask = useCreateTaskApiV1TasksPost();
  const updateTask = useUpdateTaskApiV1TasksTaskIdPut();
  const deleteTask = useDeleteTaskApiV1TasksTaskIdDelete();

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/v1/tasks'] });
  }, [queryClient]);

  // 업무 추가
  const handleAddTask = () => {
    createTask.mutate(
      { data: { title: '', status: TaskStatusEnum.BACKLOG } },
      {
        onSuccess: (newTask) => {
          invalidateAll();
          setSelectedTaskId(newTask.id);
        },
        onError: (err) => toast('error', err instanceof Error ? err.message : '생성에 실패했습니다'),
      },
    );
  };

  // 업무 수정
  const handleUpdate = useCallback(
    (taskId: number, data: TaskUpdateRequestDto) => {
      updateTask.mutate(
        { taskId, data },
        {
          onSuccess: () => invalidateAll(),
          onError: (err) => toast('error', err instanceof Error ? err.message : '저장에 실패했습니다'),
        },
      );
    },
    [updateTask, invalidateAll, toast],
  );

  // 업무 삭제
  const handleDelete = useCallback(
    (taskId: number) => {
      deleteTask.mutate(
        { taskId },
        {
          onSuccess: () => {
            invalidateAll();
            if (selectedTaskId === taskId) setSelectedTaskId(null);
            toast('success', '삭제되었습니다');
          },
          onError: (err) => toast('error', err instanceof Error ? err.message : '삭제에 실패했습니다'),
        },
      );
    },
    [deleteTask, invalidateAll, selectedTaskId, toast],
  );

  // 아카이브 토글
  const handleArchive = useCallback(
    (taskId: number) => {
      const task = [...allTasks, ...archivedTasks].find((t) => t.id === taskId);
      if (!task) return;
      updateTask.mutate(
        {
          taskId,
          data: {
            title: task.title,
            status: task.status,
            content: task.content,
            tags: task.tags,
          },
        },
        {
          onSuccess: () => {
            invalidateAll();
            toast('success', task.is_archived ? '아카이브 해제되었습니다' : '아카이브되었습니다');
          },
          onError: (err) => toast('error', err instanceof Error ? err.message : '처리에 실패했습니다'),
        },
      );
    },
    [allTasks, archivedTasks, updateTask, invalidateAll, toast],
  );

  // 복사
  const handleCopy = () => {
    const markdown = tasksToMarkdown(tasks);
    navigator.clipboard.writeText(markdown).then(
      () => toast('success', '업무 내용이 복사되었습니다'),
      () => toast('error', '복사에 실패했습니다'),
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary tracking-tight">업무 보드</h2>
        <p className="mt-0.5 text-sm text-text-secondary">업무를 카드 단위로 관리하고 상세 내용을 기록합니다</p>
      </div>

      {/* Control bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border-primary bg-surface p-3 shadow-xs">
        <TaskStatusFilter value={filter} onChange={setFilter} counts={counts} />
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddTask}
            loading={createTask.isPending}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            업무 추가
          </Button>
          {tasks.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              icon={<ClipboardDocumentIcon className="h-4 w-4" />}
            >
              복사
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      {tasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-primary bg-surface py-16">
          <p className="text-sm text-text-tertiary">
            {filter === 'archived' ? '아카이브된 업무가 없습니다' : '등록된 업무가 없습니다'}
          </p>
          {filter !== 'archived' && (
            <Button variant="primary" size="sm" onClick={handleAddTask} icon={<PlusIcon className="h-4 w-4" />}>
              첫 업무 추가하기
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden flex-1 gap-4 overflow-hidden pb-4 lg:flex">
            <div className="flex w-72 shrink-0 flex-col gap-2 overflow-y-auto pr-1 xl:w-80">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  selected={task.id === selectedTaskId}
                  onSelect={() => setSelectedTaskId(task.id)}
                />
              ))}
            </div>
            <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-border-primary bg-surface p-4 shadow-xs">
              {selectedTask ? (
                <TaskEditor
                  key={selectedTask.id}
                  task={selectedTask}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onArchive={handleArchive}
                  saving={updateTask.isPending}
                />
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-text-tertiary">
                  카드를 선택해주세요
                </div>
              )}
            </div>
          </div>

          {/* Mobile */}
          <div className="flex flex-1 flex-col overflow-hidden pb-4 lg:hidden">
            {selectedTaskId && selectedTask ? (
              <div className="flex flex-1 flex-col gap-3 overflow-hidden">
                <button
                  onClick={() => setSelectedTaskId(null)}
                  className="flex items-center gap-1 self-start text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  목록으로
                </button>
                <div className="flex-1 overflow-hidden rounded-xl border border-border-primary bg-surface p-3 shadow-xs">
                  <TaskEditor
                    key={selectedTask.id}
                    task={selectedTask}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
                    saving={updateTask.isPending}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    selected={false}
                    onSelect={() => setSelectedTaskId(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}