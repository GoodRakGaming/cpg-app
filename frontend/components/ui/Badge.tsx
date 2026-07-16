import { ReactNode } from 'react';

export type BadgeStatus = 'draft' | 'final' | 'archived';

const statusClasses: Record<BadgeStatus, string> = {
  draft: 'bg-surface-0 text-muted',
  final: 'bg-success-soft text-success',
  archived: 'bg-accent-soft text-accent',
};

export function Badge({ status, children }: { status: BadgeStatus; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-tag px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}>
      {children}
    </span>
  );
}
