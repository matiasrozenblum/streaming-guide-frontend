import React, { useState } from 'react';
import { LockKeyhole, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { FormAlert } from '../FormAlert';
import { Button } from '../../ui/Button';

interface ExistingUserStepProps {
  email: string;
  onSubmit: (password: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string;
}

export default function ExistingUserStep({
  email,
  onSubmit,
  onBack,
  isLoading,
  error
}: ExistingUserStepProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setLocalError('Por favor, ingrese su contraseña');
      return;
    }
    
    setLocalError('');
    onSubmit(password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-gray-600 dark:text-gray-300">
          Bienvenido de nuevo
          <br />
          <span className="font-medium text-gray-900 dark:text-white">
            {email}
          </span>
        </p>
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <LockKeyhole size={18} className="text-gray-500 dark:text-gray-400" />
        </div>
        <input
          type={showPassword ? 'text' : 'password'}
          className="block w-full p-3 pl-10 pr-10 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoFocus
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>
      
      {(error || localError) && (
        <FormAlert type="error" message={error || localError} />
      )}
      
      <div className="flex flex-col space-y-3 mt-6">
        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full"
        >
          Iniciar sesión
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