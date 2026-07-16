import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', disabled, ...props }, ref) => (
    <div>
      <input
        ref={ref}
        disabled={disabled}
        className={`w-full rounded-control border px-3 py-2 text-sm text-ink outline-none transition-colors
          ${error ? 'border-danger text-danger' : 'border-line focus:border-accent focus:ring-2 focus:ring-accent-soft'}
          ${disabled ? 'bg-surface-0 text-muted' : 'bg-surface-1'}
          ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
