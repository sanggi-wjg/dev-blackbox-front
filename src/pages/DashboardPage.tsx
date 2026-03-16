import { useState } from 'react';
import dayjs from 'dayjs';
import WorkLogDatePicker from '@/components/worklog/WorkLogDatePicker';
import ActivityHeatmapWidget from '@/components/dashboard/ActivityHeatmapWidget';
import PlatformSummaryWidget from '@/components/dashboard/PlatformSummaryWidget';
import TaskSummaryWidget from '@/components/dashboard/TaskSummaryWidget';

import Card from '@/components/common/Card';

export default function DashboardPage() {
  const [targetDate, setTargetDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary tracking-tight">대시보드</h2>
        <p className="mt-0.5 text-sm text-text-secondary">하루의 업무를 한눈에 확인합니다</p>
      </div>

      {/* Control bar */}
      <div className="sticky top-0 z-10 -mx-3 px-3 pb-4 md:-mx-4 md:px-4 lg:-mx-5 lg:px-5 bg-surface-secondary">
        <Card padding="sm">
          <WorkLogDatePicker date={targetDate} onChange={setTargetDate} />
        </Card>
      </div>

      {/* Activity Heatmap + Task Summary — single row */}
      <div className="grid grid-cols-1 gap-4 mb-4 lg:grid-cols-3">
        <div className="lg:col-span-2 animate-stagger-up">
          <ActivityHeatmapWidget targetDate={targetDate} onDateClick={setTargetDate} />
        </div>
        <div className="animate-stagger-up" style={{ animationDelay: '80ms' }}>
          <TaskSummaryWidget />
        </div>
      </div>

      {/* Widget grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="animate-stagger-up">
            <PlatformSummaryWidget targetDate={targetDate} />
          </div>
        </div>
      </div>
    </div>
  );
}
