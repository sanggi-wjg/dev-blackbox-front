import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { TaskStatusEnum } from '@/api/generated/model';
import type { TaskUpdateRequestDto, GetTasksApiV1TasksGetParams } from '@/api/generated/model';
import {
  useGetTasksApiV1TasksGet,
  useCreateTaskApiV1TasksPost,
  useUpdateTaskApiV1TasksTaskIdPut,
  useDeleteTaskApiV1TasksTaskIdDelete,
  useReorderTasksApiV1TasksReorderPatch,
} from '@/api/generated/task/task';
import TaskStatusFilter from '@/components/workboard/TaskStatusFilter';
import type { FilterValue } from '@/components/workboard/TaskStatusFilter';
import SortableTaskCard from '@/components/workboard/SortableTaskCard';
import TaskEditor from '@/components/workboard/TaskEditor';
import KanbanBoard from '@/components/workboard/KanbanBoard';
import Button from '@/components/common/Button';
import { useToast } from '@/components/common/Toast';
import { PlusIcon, ClipboardDocumentIcon, ArrowLeftIcon, QueueListIcon, ViewColumnsIcon } from '@/components/icons';
import { tasksToMarkdown } from '@/utils/workboard';

type ViewMode = 'list' | 'kanban';

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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filterParams = getFilterParams(filter);

  const { data: tasks = [] } = useGetTasksApiV1TasksGet(filterParams);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  // 목록 내용이 바뀔 때만 stagger 애니메이션을 재생하기 위한 key
  const taskListKey = useMemo(() => tasks.map((t) => t.id).join(','), [tasks]);

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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const createTask = useCreateTaskApiV1TasksPost();
  const updateTask = useUpdateTaskApiV1TasksTaskIdPut();
  const deleteTask = useDeleteTaskApiV1TasksTaskIdDelete();
  const reorderTasks = useReorderTasksApiV1TasksReorderPatch();

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

  // 순서 변경
  const handleReorder = useCallback(
    (taskIds: number[]) => {
      reorderTasks.mutate(
        { data: { task_ids: taskIds } },
        {
          onSuccess: () => invalidateAll(),
          onError: (err) => toast('error', err instanceof Error ? err.message : '순서 변경에 실패했습니다'),
        },
      );
    },
    [reorderTasks, invalidateAll, toast],
  );

  // 리스트 뷰 드래그 종료 핸들러
  const handleListDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // 같은 상태의 태스크끼리만 재정렬
      const activeTask = tasks[oldIndex];
      const overTask = tasks[newIndex];
      if (activeTask.status !== overTask.status) return;

      const statusTasks = tasks.filter((t) => t.status === activeTask.status);
      const oldStatusIndex = statusTasks.findIndex((t) => t.id === active.id);
      const newStatusIndex = statusTasks.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(statusTasks, oldStatusIndex, newStatusIndex);
      handleReorder(reordered.map((t) => t.id));
    },
    [tasks, handleReorder],
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
      <div className="sticky top-0 z-10 -mx-3 px-3 pb-4 md:-mx-4 md:px-4 lg:-mx-5 lg:px-5 bg-surface-secondary">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-primary bg-surface p-3 shadow-xs">
          <TaskStatusFilter value={filter} onChange={setFilter} counts={counts} />
          <div className="ml-auto flex items-center gap-2">
            {/* 뷰 모드 토글 */}
            <div className="hidden items-center rounded-lg border border-border-primary lg:flex" role="group" aria-label="뷰 모드">
              <button
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className={`rounded-l-lg p-1.5 transition-colors ${viewMode === 'list' ? 'bg-brand-600 text-text-inverse' : 'text-text-secondary hover:bg-surface-hover'}`}
                title="리스트 뷰"
              >
                <QueueListIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                aria-pressed={viewMode === 'kanban'}
                className={`rounded-r-lg p-1.5 transition-colors ${viewMode === 'kanban' ? 'bg-brand-600 text-text-inverse' : 'text-text-secondary hover:bg-surface-hover'}`}
                title="칸반 뷰"
              >
                <ViewColumnsIcon className="h-4 w-4" />
              </button>
            </div>
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
            {viewMode === 'kanban' ? (
              <div className="flex flex-1 flex-col gap-4 overflow-hidden">
                <KanbanBoard tasks={tasks} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} onReorder={handleReorder} />
                {selectedTask && (
                  <div className="flex min-h-[240px] flex-col rounded-xl border border-border-primary bg-surface p-4 shadow-xs animate-stagger-up">
                    <TaskEditor
                      key={selectedTask.id}
                      task={selectedTask}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      onArchive={handleArchive}
                      saving={updateTask.isPending}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleListDragEnd}>
                  <div key={taskListKey} className="flex w-72 shrink-0 flex-col gap-2 overflow-y-auto pr-1 xl:w-80">
                    <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                      {tasks.map((task) => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          selected={task.id === selectedTaskId}
                          onSelect={() => setSelectedTaskId(task.id)}
                        />
                      ))}
                    </SortableContext>
                  </div>
                </DndContext>
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
              </>
            )}
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleListDragEnd}>
                <div key={taskListKey} className="flex flex-col gap-2 overflow-y-auto">
                  <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        selected={false}
                        onSelect={() => setSelectedTaskId(task.id)}
                      />
                    ))}
                  </SortableContext>
                </div>
              </DndContext>
            )}
          </div>
        </>
      )}
    </div>
  );
}
