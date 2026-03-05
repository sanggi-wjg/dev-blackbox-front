import { TaskStatusEnum } from '@/api/generated/model';
import { useGetTasksApiV1TasksGet } from '@/api/generated/task/task';
import { STATUS_CONFIG } from '@/utils/workboard';

export default function TaskSummaryWidget() {
  const { data: tasks = [], isLoading, error } = useGetTasksApiV1TasksGet({ is_archived: false });

  const statusCounts = Object.values(TaskStatusEnum).map((status) => ({
    status,
    ...STATUS_CONFIG[status],
    count: tasks.filter((t) => t.status === status).length,
  }));

  return (
    <div className="rounded-xl border border-border-primary bg-surface shadow-xs">
      <div className="border-b border-border-primary px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">업무 현황</h3>
      </div>
      <div className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        )}
        {error && <p className="text-sm text-danger-500">데이터를 불러올 수 없습니다</p>}
        {!isLoading && !error && (
          <>
            <div className="mb-3 text-center">
              <p className="text-2xl font-bold text-text-primary">{tasks.length}</p>
              <p className="text-xs text-text-tertiary">전체 업무</p>
            </div>
            <div className="space-y-2">
              {statusCounts.map(({ status, label, dot, count }) => (
                <div key={status} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  <span className="flex-1 text-xs text-text-secondary">{label}</span>
                  <span className="text-xs font-medium text-text-primary">{count}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
