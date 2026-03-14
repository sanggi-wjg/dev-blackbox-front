import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TaskResponseDto } from '@/api/generated/model';
import { Bars2Icon } from '@/components/icons';
import TaskCard from './TaskCard';

interface SortableTaskCardProps {
  task: TaskResponseDto;
  selected: boolean;
  onSelect: () => void;
  /** 칸반 뷰용 컴팩트 모드: 고정 높이, 콘텐츠 미리보기 숨김 */
  compact?: boolean;
}

export default function SortableTaskCard({ task, selected, onSelect, compact }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = (
    <button
      type="button"
      className="shrink-0 cursor-grab touch-none text-text-tertiary opacity-0 transition-opacity hover:text-text-secondary active:cursor-grabbing group-hover:opacity-100"
      {...attributes}
      {...listeners}
    >
      <Bars2Icon className="h-4 w-4" />
    </button>
  );

  return (
    <TaskCard
      ref={setNodeRef}
      style={style}
      task={task}
      selected={selected}
      onSelect={onSelect}
      compact={compact}
      dragHandle={dragHandle}
      className={isDragging ? 'z-50 opacity-50' : ''}
    />
  );
}
