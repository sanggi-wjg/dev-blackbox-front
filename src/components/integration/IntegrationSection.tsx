import type { ReactNode } from 'react';

interface IntegrationSectionProps {
  connected: boolean;
  connectedContent: ReactNode;
  disconnectButton: ReactNode;
  connectForm: ReactNode;
  emptyMessage: string;
}

export default function IntegrationSection({
  connected,
  connectedContent,
  disconnectButton,
  connectForm,
  emptyMessage,
}: IntegrationSectionProps) {
  if (connected) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-success-500/20 bg-success-50 p-4">
          {connectedContent}
        </div>
        {disconnectButton}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-tertiary">{emptyMessage}</p>
      {connectForm}
    </div>
  );
}
