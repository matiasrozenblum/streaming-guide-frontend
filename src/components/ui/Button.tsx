import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700';
      case 'outline':
        return 'bg-transparent border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200';
      case 'ghost':
        return 'bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-3 py-2';
      case 'md':
        return 'text-sm px-4 py-2.5';
      case 'lg':
        return 'text-base px-6 py-3';
    }
  };

  return (
    <button
      className={`
        relative inline-flex items-center justify-center rounded-lg font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-800 focus:ring-offset-2 dark:focus:ring-offset-slate-800
        disabled:opacity-50 disabled:pointer-events-none
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <Loader2 className="animate-spin mr-2" size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
      )}
      {children}
    </button>
  );
}