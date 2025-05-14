import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { FormAlert } from '../FormAlert';
import { Button } from '../../ui/Button';

interface EmailStepProps {
  email: string;
  onSubmit: (email: string) => void;
  isLoading: boolean;
  error: string;
}

export default function EmailStep({ email, onSubmit, isLoading, error }: EmailStepProps) {
  const [inputEmail, setInputEmail] = useState(email);
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!inputEmail) {
      setLocalError('Por favor, ingrese su correo electrónico');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inputEmail)) {
      setLocalError('Por favor, ingrese un correo electrónico válido');
      return;
    }
    
    setLocalError('');
    onSubmit(inputEmail);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-gray-600 dark:text-gray-300">
          Ingresa tu correo electrónico para comenzar
        </p>
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Mail size={18} className="text-gray-500 dark:text-gray-400" />
        </div>
        <input
          type="email"
          className="block w-full p-3 pl-10 pr-3 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
          placeholder="correo@ejemplo.com"
          value={inputEmail}
          onChange={(e) => setInputEmail(e.target.value)}
          disabled={isLoading}
          autoFocus
        />
      </div>
      
      {(error || localError) && (
        <FormAlert type="error" message={error || localError} />
      )}
      
      <div className="mt-6">
        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full"
        >
          Continuar
        </Button>
      </div>
    </form>
  );
}