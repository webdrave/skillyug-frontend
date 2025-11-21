/**
 * Page Container Component
 * Provides consistent page layouts across the platform
 */

import React from 'react';
import { BACKGROUNDS, SPACING } from '@/constants/design';
import Navbar from '@/components/Navbar';

interface PageContainerProps {
  children: React.ReactNode;
  theme?: 'dark' | 'light' | 'lightCentered';
  includeNavbar?: boolean;
  maxWidth?: 'full' | 'content' | 'form' | 'narrow';
  className?: string;
}

export function PageContainer({
  children,
  theme = 'dark',
  includeNavbar = false,
  maxWidth = 'full',
  className = '',
}: PageContainerProps) {
  const backgroundClass = BACKGROUNDS[theme];
  const maxWidthClass = SPACING.containerMaxWidth[maxWidth];

  if (theme === 'lightCentered') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${backgroundClass} py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
        {includeNavbar && <Navbar />}
        {children}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${backgroundClass} ${className}`}>
      {includeNavbar && <Navbar />}
      <div className={SPACING.sectionPadding}>
        <div className={maxWidthClass}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function DarkPageContainer({ children, includeNavbar = true, maxWidth = 'full' }: Omit<PageContainerProps, 'theme'>) {
  return (
    <PageContainer theme="dark" includeNavbar={includeNavbar} maxWidth={maxWidth}>
      {children}
    </PageContainer>
  );
}

export function LightPageContainer({ children, includeNavbar = false, maxWidth = 'form' }: Omit<PageContainerProps, 'theme'>) {
  return (
    <PageContainer theme="light" includeNavbar={includeNavbar} maxWidth={maxWidth}>
      {children}
    </PageContainer>
  );
}
