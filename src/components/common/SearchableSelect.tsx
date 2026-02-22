import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDownIcon } from '@/components/icons';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '선택하세요',
  searchPlaceholder = '검색...',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // open이 변경될 때 highlightIndex 리셋 (useEffect 대신 이벤트 핸들러에서 처리)
  const toggleOpen = () => {
    setOpen((prev) => {
      if (!prev) setHighlightIndex(-1);
      return !prev;
    });
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = options.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.label.toLowerCase().includes(q) ||
      (o.description?.toLowerCase().includes(q) ?? false)
    );
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const selectOption = useCallback(
    (option: SearchableSelectOption) => {
      onChange(option.value);
      setOpen(false);
      setSearch('');
      setHighlightIndex(-1);
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          selectOption(filtered[highlightIndex]);
        }
        break;
      case 'Escape':
        setOpen(false);
        setSearch('');
        setHighlightIndex(-1);
        break;
    }
  };

  // 하이라이트된 항목이 보이도록 스크롤
  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex]);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full items-center justify-between rounded-lg border border-border-primary bg-surface px-3 py-2 text-left text-sm transition-colors focus:border-border-focus focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
      >
        <span className={selectedOption ? 'text-text-primary' : 'text-text-tertiary'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-border-primary bg-surface shadow-lg animate-slide-up">
          <div className="border-b border-border-primary p-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightIndex(-1);
              }}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-border-primary bg-surface px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            />
          </div>
          <ul ref={listRef} className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-text-tertiary">검색 결과가 없습니다</li>
            ) : (
              filtered.map((option, idx) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => selectOption(option)}
                    className={`flex w-full flex-col px-3 py-2 text-left text-sm transition-colors ${
                      option.value === value
                        ? 'bg-brand-50 font-medium text-brand-700'
                        : idx === highlightIndex
                          ? 'bg-surface-hover text-text-primary'
                          : 'text-text-primary hover:bg-surface-hover'
                    }`}
                  >
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-text-tertiary">{option.description}</span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
