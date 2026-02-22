import dayjs from 'dayjs';

interface SummaryDatePickerProps {
  date: string;
  onChange: (date: string) => void;
}

export default function SummaryDatePicker({ date, onChange }: SummaryDatePickerProps) {
  const goPrev = () => onChange(dayjs(date).subtract(1, 'day').format('YYYY-MM-DD'));
  const goNext = () => onChange(dayjs(date).add(1, 'day').format('YYYY-MM-DD'));
  const isToday = dayjs(date).isSame(dayjs(), 'day');

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={goPrev}
        className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm hover:bg-gray-100"
      >
        ◀
      </button>
      <input
        type="date"
        value={date}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
      <button
        onClick={goNext}
        disabled={isToday}
        className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ▶
      </button>
    </div>
  );
}
