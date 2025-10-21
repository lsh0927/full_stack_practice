import React from 'react';
import type { LucideProps } from 'lucide-react';
import {
  // Navigation
  Home,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,

  // User & Profile
  User,
  UserPlus,
  Users,
  UserCheck,
  UserX,

  // Actions
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  Share2,
  Copy,
  Check,

  // Communication
  MessageCircle,
  Send,
  Mail,
  Phone,
  Bell,
  BellOff,

  // Media
  Image,
  Video,
  File,
  FileText,
  Paperclip,

  // Interface
  Settings,
  Search,
  Filter,
  SlidersHorizontal,
  MoreVertical,
  MoreHorizontal,
  Eye,
  EyeOff,
  Heart,
  Star,
  Bookmark,

  // Status
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Loader,

  // Theme
  Sun,
  Moon,
  Monitor,

  // Social
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Repeat,

  // Other
  Calendar,
  Clock,
  MapPin,
  Lock,
  Unlock,
  Link,
  ExternalLink,
  Zap,
} from 'lucide-react';

// Icon mapping
export const icons = {
  // Navigation
  home: Home,
  menu: Menu,
  close: X,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,

  // User & Profile
  user: User,
  userPlus: UserPlus,
  users: Users,
  userCheck: UserCheck,
  userX: UserX,

  // Actions
  plus: Plus,
  minus: Minus,
  edit: Edit,
  trash: Trash2,
  save: Save,
  download: Download,
  upload: Upload,
  share: Share2,
  copy: Copy,
  check: Check,

  // Communication
  message: MessageCircle,
  send: Send,
  mail: Mail,
  phone: Phone,
  bell: Bell,
  bellOff: BellOff,

  // Media
  image: Image,
  video: Video,
  file: File,
  fileText: FileText,
  paperclip: Paperclip,

  // Interface
  settings: Settings,
  search: Search,
  filter: Filter,
  sliders: SlidersHorizontal,
  moreVertical: MoreVertical,
  moreHorizontal: MoreHorizontal,
  eye: Eye,
  eyeOff: EyeOff,
  heart: Heart,
  star: Star,
  bookmark: Bookmark,

  // Status
  alertCircle: AlertCircle,
  alertTriangle: AlertTriangle,
  info: Info,
  checkCircle: CheckCircle,
  xCircle: XCircle,
  loader: Loader,

  // Theme
  sun: Sun,
  moon: Moon,
  monitor: Monitor,

  // Social
  thumbsUp: ThumbsUp,
  thumbsDown: ThumbsDown,
  comment: MessageSquare,
  repeat: Repeat,

  // Other
  calendar: Calendar,
  clock: Clock,
  mapPin: MapPin,
  lock: Lock,
  unlock: Unlock,
  link: Link,
  externalLink: ExternalLink,
  zap: Zap,
} as const;

export type IconName = keyof typeof icons;

export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
  className?: string;
}

/**
 * Icon component for consistent icon usage across the application
 * @param name - Name of the icon from the icons object
 * @param size - Size of the icon (default: 24)
 * @param className - Additional CSS classes
 * @param props - Additional Lucide icon props
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  className = '',
  ...props
}) => {
  const IconComponent = icons[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return <IconComponent size={size} className={className} {...props} />;
};

export default Icon;
