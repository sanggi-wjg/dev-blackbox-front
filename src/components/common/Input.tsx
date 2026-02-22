import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={`h-9 w-full rounded-lg border bg-surface px-3 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-tertiary disabled:opacity-60 ${
          error
            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
            : 'border-border-primary focus:border-border-focus focus:ring-brand-500/20'
        } ${className}`}
        {...rest}
      />
    );
  },
);

Input.displayName = 'Input';

export default Input;
