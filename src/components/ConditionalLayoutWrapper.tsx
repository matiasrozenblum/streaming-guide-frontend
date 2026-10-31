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
  
  // For other pages, use normal layout with scrolling.
  //
  // `svh` and not `dvh`: on a phone `dvh` grows as the browser retracts its
  // address bar, so the page got taller at the same rate the reader scrolled
  // and the footer walked away from them — unreachable. `svh` is the window
  // with the bar showing, which never changes, so the page has one height.
  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

