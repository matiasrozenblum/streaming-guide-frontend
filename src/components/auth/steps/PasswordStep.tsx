import React, { useState } from 'react';
import { LockKeyhole, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { FormAlert } from '../FormAlert';
import { Button } from '../../ui/Button';

interface PasswordStepProps {
  password: string;
  confirmPassword: string;
  onSubmit: (password: string, confirmPassword: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string;
}

export default function PasswordStep({
  password,
  confirmPassword,
  onSubmit,
  onBack,
  isLoading,
  error
}: PasswordStepProps) {
  const [inputPassword, setInputPassword] = useState(password);
  const [inputConfirmPassword, setInputConfirmPassword] = useState(confirmPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calculate password strength
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return 0;
    
    let strength = 0;
    
    // Length criteria
    if (pass.length >= 8) strength += 1;
    if (pass.length >= 10) strength += 1;
    
    // Complexity criteria
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    
    return Math.min(strength, 5);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setInputPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputPassword.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (inputPassword !== inputConfirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }
    
    setLocalError('');
    onSubmit(inputPassword, inputConfirmPassword);
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 2) return 'Débil';
    if (passwordStrength <= 3) return 'Moderada';
    return 'Fuerte';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-gray-600 dark:text-gray-300">
          Crea una contraseña segura
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
          value={inputPassword}
          onChange={handlePasswordChange}
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
      
      {inputPassword && (
        <div className="space-y-1">
          <div className="flex h-1 w-full bg-gray-200 dark:bg-slate-700 rounded overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${getStrengthColor()}`} 
              style={{ width: `${(passwordStrength / 5) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 flex justify-between">
            <span>Seguridad:</span>
            <span className={`
              font-medium
              ${passwordStrength <= 2 ? 'text-red-500' : ''}
              ${passwordStrength === 3 ? 'text-yellow-500' : ''}
              ${passwordStrength >= 4 ? 'text-green-500' : ''}
            `}>
              {getStrengthText()}
            </span>
          </p>
        </div>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <LockKeyhole size={18} className="text-gray-500 dark:text-gray-400" />
        </div>
        <input
          type={showConfirmPassword ? 'text' : 'password'}
          className="block w-full p-3 pl-10 pr-10 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
          placeholder="Confirmar contraseña"
          value={inputConfirmPassword}
          onChange={(e) => setInputConfirmPassword(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
          Registrarme
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