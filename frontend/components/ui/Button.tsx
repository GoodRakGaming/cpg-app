import { ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover disabled:bg-muted/40 disabled:text-white/70',
  secondary: 'bg-surface-1 text-text border border-line hover:bg-surface-0 disabled:bg-surface-0 disabled:text-muted',
  danger: 'bg-danger-soft text-danger border border-danger/20 hover:bg-danger/15 disabled:bg-surface-0 disabled:text-muted disabled:border-line',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-control px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
);
Button.displayName = 'Button';
