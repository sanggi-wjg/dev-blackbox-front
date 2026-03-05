import { TaskStatusEnum } from '@/api/generated/model';
import { STATUS_CONFIG } from '@/utils/workboard';

// 개별 상태 + 전체 + 아카이브
export type FilterValue = 'all' | TaskStatusEnum | 'archived';

interface TaskStatusFilterProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  counts?: Partial<Record<FilterValue, number>>;
}

const FILTER_TABS: { id: FilterValue; label: string; dot?: string }[] = [
  { id: 'all', label: '전체' },
  ...Object.values(TaskStatusEnum).map((status) => ({
    id: status as FilterValue,
    label: STATUS_CONFIG[status].label,
    dot: STATUS_CONFIG[status].dot,
  })),
  { id: 'archived', label: '아카이브' },
];

export default function TaskStatusFilter({ value, onChange, counts }: TaskStatusFilterProps) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1">
      {FILTER_TABS.map((tab) => {
        const isActive = tab.id === value;
        const count = counts?.[tab.id];
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-600 text-text-inverse'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            {tab.dot && <span className={`inline-block h-2 w-2 rounded-full ${tab.dot}`} />}
            {tab.label}
            {count !== undefined && count > 0 && (
              <span className={`text-xs ${isActive ? 'text-text-inverse/70' : 'text-text-tertiary'}`}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}