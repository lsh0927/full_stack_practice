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
  default: 'rounded-2xl border-gray-300 focus:ring-purple-500',
  search: 'rounded-full border-gray-300 focus:ring-blue-500',
  rounded: 'rounded-xl border-gray-300 focus:ring-purple-500',
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={`
              w-full border bg-white
              focus:outline-none focus:ring-2 focus:border-transparent
              transition-all duration-200
              text-gray-900 placeholder:text-gray-400
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${variantClasses[variant]}
              ${sizeClasses[inputSize]}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
