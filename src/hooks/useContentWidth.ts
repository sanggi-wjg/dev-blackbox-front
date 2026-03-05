import { useState } from 'react';

const STORAGE_KEY = 'content-width';

const WIDTH_PRESETS = [
  { key: 'narrow', className: 'max-w-5xl', label: '좁게' },
  { key: 'default', className: 'max-w-7xl', label: '기본' },
  { key: 'wide', className: 'max-w-[1600px]', label: '넓게' },
  { key: 'full', className: 'max-w-none', label: '전체' },
] as const;

type WidthKey = (typeof WIDTH_PRESETS)[number]['key'];

function getInitialIndex(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as WidthKey | null;
    if (stored) {
      const idx = WIDTH_PRESETS.findIndex((p) => p.key === stored);
      if (idx !== -1) return idx;
    }
  } catch {
    // localStorage 접근 실패 무시
  }
  return 1; // 기본값: 'default'
}

export function useContentWidth() {
  const [index, setIndex] = useState(getInitialIndex);

  const preset = WIDTH_PRESETS[index];

  const cycleWidth = () => {
    const next = (index + 1) % WIDTH_PRESETS.length;
    setIndex(next);
    try {
      localStorage.setItem(STORAGE_KEY, WIDTH_PRESETS[next].key);
    } catch {
      // localStorage 쓰기 실패 무시
    }
  };

  return {
    widthClass: preset.className,
    widthLabel: preset.label,
    cycleWidth,
  };
}
