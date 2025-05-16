import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface FormAlertProps {
  type: 'error' | 'success' | 'info';
  message: string;
}

export function FormAlert({ type, message }: FormAlertProps) {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle size={18} className="text-red-500 dark:text-red-400" />;
      case 'success':
        return <CheckCircle size={18} className="text-green-500 dark:text-green-400" />;
      case 'info':
        return <Info size={18} className="text-blue-500 dark:text-blue-400" />;
    }
  };
  
  const getContainerClasses = () => {
    const baseClasses = "p-3 rounded-lg flex items-start gap-2";
    
    switch (type) {
      case 'error':
        return `${baseClasses} bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200`;
      case 'success':
        return `${baseClasses} bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200`;
      case 'info':
        return `${baseClasses} bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200`;
    }
  };
  
  return (
    <div className={getContainerClasses()} role="alert">
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="text-sm">{message}</div>
    </div>
  );
}