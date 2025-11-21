/**
 * Consistent Button Component
 * Provides standardized button styles across the platform
 */

import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { BUTTON_STYLES } from '@/constants/design';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'navAction';

interface BaseButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

interface LinkButtonProps extends BaseButtonProps {
  href: string;
  onClick?: never;
  type?: never;
}

interface ActionButtonProps extends BaseButtonProps {
  href?: never;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

type ConsistentButtonProps = LinkButtonProps | ActionButtonProps;

export function ConsistentButton({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  icon,
  href,
  onClick,
  type = 'button',
}: ConsistentButtonProps) {
  const buttonClass = `${BUTTON_STYLES[variant]} ${className} inline-flex items-center justify-center`;
  const isDisabled = disabled || loading;

  const content = (
    <>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${buttonClass} ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
        aria-disabled={isDisabled}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${buttonClass} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {content}
    </button>
  );
}
