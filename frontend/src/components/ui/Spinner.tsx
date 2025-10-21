'use client';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'default' | 'primary' | 'white';

export interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
  label?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'h-4 w-4 border-2',
  sm: 'h-6 w-6 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
};

const variantClasses: Record<SpinnerVariant, string> = {
  default: 'border-gray-300 border-t-gray-600',
  primary: 'border-purple-200 border-t-purple-600',
  white: 'border-white/30 border-t-white',
};

/**
 * 로딩 스피너 컴포넌트
 */
export default function Spinner({
  size = 'md',
  variant = 'default',
  className = '',
  label,
}: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`
          rounded-full animate-spin
          ${sizeClasses[size]}
          ${variantClasses[variant]}
        `}
        role="status"
        aria-label={label || 'Loading'}
      >
        <span className="sr-only">{label || 'Loading...'}</span>
      </div>
      {label && <p className="text-sm text-gray-600">{label}</p>}
    </div>
  );
}

/**
 * 전체 화면 로딩 오버레이
 */
export interface LoadingOverlayProps {
  isLoading: boolean;
  label?: string;
  blur?: boolean;
}

export function LoadingOverlay({ isLoading, label, blur = true }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/30 ${blur ? 'backdrop-blur-sm' : ''}`}
        aria-hidden="true"
      />
      <div className="relative">
        <Spinner size="xl" variant="white" label={label} />
      </div>
    </div>
  );
}

/**
 * 페이지 섹션 로딩
 */
export interface LoadingSectionProps {
  label?: string;
  minHeight?: string;
}

export function LoadingSection({ label, minHeight = 'h-64' }: LoadingSectionProps) {
  return (
    <div className={`flex items-center justify-center ${minHeight}`}>
      <Spinner size="lg" variant="primary" label={label} />
    </div>
  );
}
