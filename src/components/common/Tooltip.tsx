import type { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
}

export default function Tooltip({ children, content }: TooltipProps) {
  return (
    <div className="group relative inline-flex">
      {children}
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-text-primary px-2 py-1 text-xs text-text-inverse opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
      >
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-text-primary" />
      </div>
    </div>
  );
}
