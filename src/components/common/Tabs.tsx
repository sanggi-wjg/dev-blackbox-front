import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-border-primary">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-text-tertiary hover:text-text-secondary hover:border-border-strong'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps {
  active: boolean;
  children: ReactNode;
}

export function TabPanel({ active, children }: TabPanelProps) {
  if (!active) return null;
  return (
    <div role="tabpanel" className="animate-fade-in pt-4">
      {children}
    </div>
  );
}
