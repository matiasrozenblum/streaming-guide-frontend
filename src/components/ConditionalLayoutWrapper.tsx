'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface ConditionalLayoutWrapperProps {
  children: ReactNode;
}

export default function ConditionalLayoutWrapper({ children }: ConditionalLayoutWrapperProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  // Only apply fixed height and overflow hidden on home page
  // Other pages (like backoffice) need normal scrolling
  if (isHomePage) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    );
  }
  
  // For other pages, use normal layout with scrolling
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

