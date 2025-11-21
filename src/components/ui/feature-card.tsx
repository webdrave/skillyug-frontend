/**
 * Feature Card Component
 * Consistent feature card display across pages
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { CARD_STYLES, ICON_SIZES } from '@/constants/design';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  variant?: 'dark' | 'light';
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className = '',
  variant = 'dark',
}: FeatureCardProps) {
  const cardClass = variant === 'dark' ? CARD_STYLES.feature : CARD_STYLES.light;
  const iconColor = variant === 'dark' ? 'text-orange-500' : 'text-blue-600';
  const textColor = variant === 'dark' ? 'text-white' : 'text-gray-900';
  const descColor = variant === 'dark' ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className={`${cardClass} ${className}`}>
      <Icon className={`${ICON_SIZES.xl} ${iconColor} mx-auto mb-4`} />
      <h3 className={`text-xl font-semibold ${textColor} mb-3`}>
        {title}
      </h3>
      <p className={descColor}>{description}</p>
    </div>
  );
}
