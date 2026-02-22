import type { ReactNode } from 'react';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'danger'
  | 'brand'
  | 'github'
  | 'jira'
  | 'slack'
  | 'confluence';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-tertiary text-text-secondary',
  success: 'bg-success-50 text-success-600',
  danger: 'bg-danger-50 text-danger-600',
  brand: 'bg-brand-50 text-brand-700',
  github: 'bg-platform-github text-text-inverse',
  jira: 'bg-platform-jira text-text-inverse',
  slack: 'bg-platform-slack text-text-inverse',
  confluence: 'bg-platform-confluence text-text-inverse',
};

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
