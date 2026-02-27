import dayjs from 'dayjs';
import Button from '@/components/common/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';

interface WorkLogDatePickerProps {
  date: string;
  onChange: (date: string) => void;
}

export default function WorkLogDatePicker({ date, onChange }: WorkLogDatePickerProps) {
  const goPrev = () => onChange(dayjs(date).subtract(1, 'day').format('YYYY-MM-DD'));
  const goNext = () => onChange(dayjs(date).add(1, 'day').format('YYYY-MM-DD'));
  const goToday = () => onChange(dayjs().format('YYYY-MM-DD'));
  const isToday = dayjs(date).isSame(dayjs(), 'day');

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={goPrev}
        aria-label="이전 날짜"
        icon={<ChevronLeftIcon className="h-4 w-4" />}
      />
      <input
        type="date"
        value={date}
        max={dayjs().format('YYYY-MM-DD')}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-lg border border-border-primary bg-surface px-3 text-sm text-text-primary transition-colors focus:border-border-focus focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={goNext}
        disabled={isToday}
        aria-label="다음 날짜"
        icon={<ChevronRightIcon className="h-4 w-4" />}
      />
      {!isToday && (
        <Button variant="ghost" size="sm" onClick={goToday}>
          오늘
        </Button>
      )}
    </div>
  );
}
