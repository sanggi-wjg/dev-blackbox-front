import { TaskStatusEnum } from '@/api/generated/model';
import { useGetTasksApiV1TasksGet } from '@/api/generated/task/task';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import { STATUS_CONFIG } from '@/utils/workboard';

export default function TaskSummaryWidget() {
  const { data: tasks = [], isLoading, error } = useGetTasksApiV1TasksGet({ is_archived: false });

  const statusCounts = Object.values(TaskStatusEnum).map((status) => ({
    status,
    ...STATUS_CONFIG[status],
    count: tasks.filter((t) => t.status === status).length,
  }));

  return (
    <Card padding="none" className="h-full flex flex-col">
      <div className="border-b border-border-primary px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">업무 현황</h3>
      </div>
      <div className="flex-1 p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner message="업무 현황 로딩 중..." />
          </div>
        )}
        {error && <ErrorMessage error={error} />}
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
    </Card>
  );
}
