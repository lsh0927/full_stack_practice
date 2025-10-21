/**
 * UI 컴포넌트 라이브러리
 *
 * 토스, 인스타그램 스타일의 모던한 컴포넌트 시스템
 * 일관된 디자인과 재사용성을 위한 공통 컴포넌트
 */

// Button
export { default as Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

// Input
export { default as Input } from './Input';
export type { InputProps, InputVariant, InputSize } from './Input';

// Card
export {
  default as Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
} from './Card';
export type { CardProps, CardVariant, CardPadding } from './Card';

// Modal
export { default as Modal, ConfirmModal } from './Modal';
export type { ModalProps, ModalSize, ConfirmModalProps } from './Modal';

// Avatar
export { default as Avatar, AvatarGroup } from './Avatar';
export type { AvatarProps, AvatarSize, AvatarGroupProps } from './Avatar';

// Spinner
export {
  default as Spinner,
  LoadingOverlay,
  LoadingSection,
} from './Spinner';
export type {
  SpinnerProps,
  SpinnerSize,
  SpinnerVariant,
  LoadingOverlayProps,
  LoadingSectionProps,
} from './Spinner';

// Icon
export { default as Icon, icons } from './Icon';
export type { IconProps, IconName } from './Icon';
