import {
  ArrowLeftRight,
  Ban,
  Banknote,
  Bell,
  BookOpen,
  Briefcase,
  Calendar,
  Car,
  CarTaxiFront,
  ChartPie,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  Clapperboard,
  Coffee,
  CreditCard,
  Database,
  Download,
  Ellipsis,
  Flame,
  Fuel,
  Gift,
  GripVertical,
  HeartPulse,
  Home,
  Info,
  Landmark,
  Languages,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plane,
  Plus,
  PlusCircle,
  Receipt,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Target,
  Trash2,
  TriangleAlert,
  TrendingUp,
  User,
  Users,
  Utensils,
  Wallet,
  X,
  Zap,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react-native';

import {useTheme} from '../theme/ThemeProvider';

/**
 * Closed icon registry — single Lucide set, no mixed families.
 * Add icons here as screens need them (keeps the binary lean).
 */
const registry = {
  ArrowLeftRight,
  Ban,
  Banknote,
  Bell,
  BookOpen,
  Briefcase,
  Calendar,
  Car,
  CarTaxiFront,
  ChartPie,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  Clapperboard,
  Coffee,
  CreditCard,
  Database,
  Download,
  Ellipsis,
  Flame,
  Fuel,
  Gift,
  GripVertical,
  HeartPulse,
  Home,
  Info,
  Landmark,
  Languages,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plane,
  Plus,
  PlusCircle,
  Receipt,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Target,
  Trash2,
  TriangleAlert,
  TrendingUp,
  User,
  Users,
  Utensils,
  Wallet,
  X,
  Zap,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof registry;

export function isIconName(value: string): value is IconName {
  return Object.prototype.hasOwnProperty.call(registry, value);
}

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  accessibilityLabel?: string;
};

export function Icon({
  name,
  size = 22,
  color,
  strokeWidth = 2,
  accessibilityLabel,
}: IconProps) {
  const {theme} = useTheme();
  const Cmp = registry[name];

  const props: LucideProps = {
    size,
    color: color ?? theme.colors.text.primary,
    strokeWidth,
    accessibilityLabel,
  };

  return <Cmp {...props} />;
}
