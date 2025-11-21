/**
 * Status Alert Component
 * Consistent alert styling for success, error, warning, and info states
 */

import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ALERT_STYLES, ICON_SIZES } from '@/constants/design';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface StatusAlertProps {
  variant: AlertVariant;
  message: string;
  title?: string;
  className?: string;
}

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const iconColorMap = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
};

const textColorMap = {
  success: 'text-green-800',
  error: 'text-red-800',
  warning: 'text-yellow-800',
  info: 'text-blue-800',
};

export function StatusAlert({ variant, message, title, className = '' }: StatusAlertProps) {
  const Icon = iconMap[variant];
  const alertClass = variant === 'error' ? '' : ALERT_STYLES[variant];
  const iconColor = iconColorMap[variant];
  const textColor = textColorMap[variant];

  return (
    <Alert
      variant={variant === 'error' ? 'destructive' : 'default'}
      className={`${alertClass} ${className}`}
    >
      <Icon className={`${ICON_SIZES.sm} ${iconColor}`} />
      <AlertDescription className={textColor}>
        {title && <strong className="block mb-1">{title}</strong>}
        {message}
      </AlertDescription>
    </Alert>
  );
}
