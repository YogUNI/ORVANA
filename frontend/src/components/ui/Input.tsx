import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border rounded focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors',
              error
                ? 'border-status-danger text-status-danger focus:ring-status-danger'
                : 'border-gray-300 text-gray-900',
              className,
            ),
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-status-danger mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-gray-500 mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
