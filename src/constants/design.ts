/**
 * Design System Constants
 * Centralized design tokens for consistent UI across the platform
 */

// Background Gradients
export const BACKGROUNDS = {
  dark: 'bg-gradient-to-br from-black via-blue-900 to-blue-800',
  light: 'bg-gradient-to-br from-blue-50 via-white to-purple-50',
  lightCentered: 'bg-gray-50',
} as const;

// Button Variants
export const BUTTON_STYLES = {
  primary: 'px-8 py-4 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all duration-300 transform hover:scale-105',
  secondary: 'px-6 py-2 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 transition-colors duration-200',
  outline: 'px-8 py-4 border-2 border-blue-500 text-blue-400 rounded-lg font-semibold hover:bg-blue-500 hover:text-white transition-all duration-300',
  danger: 'px-6 py-2 bg-red-500 text-white rounded-md font-medium hover:bg-red-600 transition-colors duration-200',
  navAction: 'px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors duration-200',
} as const;

// Card Variants
export const CARD_STYLES = {
  dark: 'bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6 hover:bg-black/40 transition-all duration-300 transform hover:scale-105',
  darkStatic: 'bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6',
  light: 'bg-white rounded-xl shadow-lg p-6',
  feature: 'bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6 text-center hover:bg-black/40 transition-all duration-300 transform hover:scale-105',
} as const;

// Navigation Styles
export const NAV_STYLES = {
  container: 'bg-black/20 backdrop-blur-md border-b border-blue-800/30 sticky top-0 z-50',
  link: 'flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200',
  linkActive: 'text-orange-500 bg-blue-900/50',
  linkInactive: 'text-gray-300 hover:text-white hover:bg-blue-800/50',
  mobileMenu: 'bg-black/30 backdrop-blur-md rounded-md mt-2',
} as const;

// Text Colors
export const TEXT_COLORS = {
  primary: {
    dark: 'text-white',
    light: 'text-gray-900',
  },
  secondary: {
    dark: 'text-gray-300',
    light: 'text-gray-600',
  },
  accent: {
    orange: 'text-orange-500',
    blue: 'text-blue-400',
  },
  status: {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  },
} as const;

// Alert Variants
export const ALERT_STYLES = {
  success: 'border-green-500 bg-green-50',
  error: 'border-red-500 bg-red-50',
  warning: 'border-yellow-500 bg-yellow-50',
  info: 'border-blue-500 bg-blue-50',
} as const;

// Spacing
export const SPACING = {
  sectionPadding: 'py-12 md:py-14 px-4 sm:px-6 lg:px-8',
  containerMaxWidth: {
    full: 'max-w-7xl mx-auto',
    content: 'max-w-4xl mx-auto',
    form: 'max-w-2xl mx-auto',
    narrow: 'max-w-md mx-auto',
  },
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  },
} as const;

// Typography
export const TYPOGRAPHY = {
  heading: {
    hero: 'text-5xl md:text-7xl font-bold',
    page: 'text-3xl md:text-4xl font-bold',
    section: 'text-2xl md:text-3xl font-bold',
    card: 'text-xl font-semibold',
    subheading: 'text-lg font-semibold',
  },
  body: {
    large: 'text-xl md:text-2xl',
    default: 'text-base',
    small: 'text-sm',
    xs: 'text-xs',
  },
} as const;

// Form Styles
export const FORM_STYLES = {
  inputHeight: 'h-11',
  label: 'text-sm font-medium text-gray-700',
  helperText: 'text-xs text-gray-500 mt-1',
  formSection: 'space-y-4',
  formContainer: 'space-y-6',
} as const;

// Transitions
export const TRANSITIONS = {
  colors: 'transition-colors duration-200',
  all: 'transition-all duration-300',
  transform: 'transform hover:scale-105',
} as const;

// Icon Sizes
export const ICON_SIZES = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
} as const;

// Loading States
export const LOADING = {
  spinner: 'animate-spin',
  pulse: 'animate-pulse',
  shimmer: 'animate-shimmer',
} as const;

// Responsive Breakpoints (for reference)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Z-Index Layers
export const Z_INDEX = {
  navbar: 50,
  modal: 100,
  dropdown: 40,
  overlay: 90,
} as const;
