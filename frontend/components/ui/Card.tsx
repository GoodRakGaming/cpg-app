import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ interactive = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-card border border-line bg-surface-1 ${interactive ? 'cursor-pointer transition-shadow hover:shadow-card' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
