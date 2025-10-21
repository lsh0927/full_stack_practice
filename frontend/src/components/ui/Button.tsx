'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'kakao' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500',
  secondary: 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700',
  danger: 'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800',
  ghost: 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800',
  kakao: 'bg-[#FEE500] text-[#000000D9] hover:shadow-lg hover:bg-[#FDD835]',
  outline: 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
  full: 'w-full px-6 py-3 text-base',
};

/**
 * 모던한 버튼 컴포넌트
 * 토스, 인스타그램 스타일의 다양한 variant 지원
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-full
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      whileHover={
        disabled || isLoading
          ? undefined
          : {
              scale: 1.02,
              y: -2,
              transition: { type: 'spring', stiffness: 400, damping: 17 },
            }
      }
      whileTap={
        disabled || isLoading
          ? undefined
          : {
              scale: 0.95,
              y: 0,
              transition: { type: 'spring', stiffness: 400, damping: 17 },
            }
      }
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        ease: 'easeOut',
      }}
      {...props}
    >
      {isLoading && (
        <motion.svg
          className="-ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </motion.svg>
      )}
      {!isLoading && leftIcon && (
        <motion.span
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {leftIcon}
        </motion.span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <motion.span
          initial={{ opacity: 0, x: 5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {rightIcon}
        </motion.span>
      )}
    </motion.button>
  );
}
