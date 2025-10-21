'use client';

import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

export type InputVariant = 'default' | 'search' | 'rounded';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  inputSize?: InputSize;
  error?: string;
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  helperText?: string;
}

const variantClasses: Record<InputVariant, string> = {
  default: 'rounded-2xl border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-400',
  search: 'rounded-full border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400',
  rounded: 'rounded-xl border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-400',
};

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
};

/**
 * 모던한 인풋 컴포넌트
 * 다양한 스타일과 유효성 검사 지원
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      inputSize = 'md',
      error,
      label,
      leftIcon,
      rightIcon,
      helperText,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
            {props.required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={`
              w-full border bg-white dark:bg-gray-800
              focus:outline-none focus:ring-2 focus:border-transparent
              transition-all duration-200
              text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500
              disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed
              ${variantClasses[variant]}
              ${sizeClasses[inputSize]}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400' : ''}
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
