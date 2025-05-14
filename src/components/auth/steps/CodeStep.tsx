import React, { useState, useEffect } from 'react';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { FormAlert } from '../FormAlert';
import { Button } from '../../ui/Button';

interface CodeStepProps {
  email: string;
  code: string;
  onSubmit: (code: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string;
}

export default function CodeStep({ 
  email, 
  code, 
  onSubmit, 
  onBack, 
  isLoading, 
  error 
}: CodeStepProps) {
  const [inputCode, setInputCode] = useState(code);
  const [localError, setLocalError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  // Countdown timer for resend code
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputCode) {
      setLocalError('Por favor, ingrese el código de verificación');
      return;
    }
    
    if (inputCode.length < 6) {
      setLocalError('El código debe tener al menos 6 caracteres');
      return;
    }
    
    setLocalError('');
    onSubmit(inputCode);
  };
  
  const handleResendCode = () => {
    // Logic to resend code would go here
    setCanResend(false);
    setCountdown(30);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-gray-600 dark:text-gray-300">
          Hemos enviado un código de verificación a
          <br />
          <span className="font-medium text-gray-900 dark:text-white">
            {email}
          </span>
        </p>
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <KeyRound size={18} className="text-gray-500 dark:text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full p-3 pl-10 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
          placeholder="Ingrese el código de 6 dígitos"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          disabled={isLoading}
          autoFocus
          maxLength={6}
        />
      </div>
      
      {(error || localError) && (
        <FormAlert type="error" message={error || localError} />
      )}
      
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleResendCode}
          disabled={!canResend}
          className={`text-sm ${
            canResend
              ? 'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
              : 'text-gray-400 cursor-default'
          }`}
        >
          {canResend
            ? 'Reenviar código'
            : `Reenviar código en ${countdown}s`}
        </button>
      </div>
      
      <div className="flex flex-col space-y-3 mt-6">
        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full"
        >
          Verificar
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="w-full"
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver
        </Button>
      </div>
    </form>
  );
}