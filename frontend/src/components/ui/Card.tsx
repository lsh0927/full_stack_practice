'use client';

import { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'default' | 'bordered' | 'elevated' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white shadow-sm border border-gray-100',
  bordered: 'bg-white border-2 border-gray-200',
  elevated: 'bg-white shadow-lg',
  glass: 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl',
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
    <div
      className={`
        rounded-2xl
        transition-all duration-200
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hoverable ? 'hover:shadow-md hover:scale-[1.01] cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
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
    <h3 className={`text-xl font-bold text-gray-900 ${className}`} {...props}>
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
    <div className={`text-gray-600 ${className}`} {...props}>
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
    <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`} {...props}>
      {children}
    </div>
  );
}
