'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  // Hide footer on home page - it will be shown inside the grid scrollable area
  const isHomePage = pathname === '/';
  
  if (isHomePage) {
    return null;
  }
  
  return <Footer />;
}

