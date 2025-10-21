'use client';

import { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

export type CardVariant = 'default' | 'bordered' | 'elevated' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700',
  bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600',
  elevated: 'bg-white dark:bg-gray-800 shadow-lg dark:shadow-2xl',
  glass: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 shadow-xl',
};

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * 범용 카드 컴포넌트
 * 게시글, 프로필, 댓글 등 다양한 콘텐츠에 사용
 */
export default function Card({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <motion.div
      className={`
        rounded-2xl
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hoverable ? 'cursor-pointer' : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={
        hoverable
          ? {
              scale: 1.02,
              y: -4,
              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
              transition: {
                type: 'spring',
                stiffness: 400,
                damping: 20,
              },
            }
          : undefined
      }
      whileTap={
        hoverable
          ? {
              scale: 0.98,
              y: 0,
              transition: {
                type: 'spring',
                stiffness: 400,
                damping: 20,
              },
            }
          : undefined
      }
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 카드 헤더 컴포넌트
 */
export function CardHeader({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * 카드 타이틀 컴포넌트
 */
export function CardTitle({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-xl font-bold text-gray-900 dark:text-gray-100 ${className}`} {...props}>
      {children}
    </h3>
  );
}

/**
 * 카드 본문 컴포넌트
 */
export function CardBody({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`text-gray-600 dark:text-gray-300 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * 카드 푸터 컴포넌트
 */
export function CardFooter({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 ${className}`} {...props}>
      {children}
    </div>
  );
}
