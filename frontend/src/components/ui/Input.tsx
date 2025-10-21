'use client';

import { InputHTMLAttributes, ReactNode, forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [isFocused, setIsFocused] = useState(false);

    return (
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {label && (
          <motion.label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            animate={{
              color: isFocused
                ? 'rgb(147, 51, 234)'
                : error
                  ? 'rgb(239, 68, 68)'
                  : undefined,
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {props.required && (
              <motion.span
                className="text-red-500 dark:text-red-400 ml-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                *
              </motion.span>
            )}
          </motion.label>
        )}

        <div className="relative">
          <AnimatePresence>
            {leftIcon && (
              <motion.div
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  color: isFocused ? 'rgb(147, 51, 234)' : undefined,
                }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {leftIcon}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.input
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
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            whileFocus={{
              scale: 1.01,
              transition: { type: 'spring', stiffness: 300, damping: 20 },
            }}
            {...props}
          />

          <AnimatePresence>
            {rightIcon && (
              <motion.div
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                initial={{ opacity: 0, x: 10 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  color: isFocused ? 'rgb(147, 51, 234)' : undefined,
                }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {rightIcon}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {error}
            </motion.p>
          )}
          {helperText && !error && (
            <motion.p
              className="mt-1 text-sm text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
