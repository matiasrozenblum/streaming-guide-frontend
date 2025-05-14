import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import StepIndicator from './StepIndicator';
import EmailStep from './steps/EmailStep';
import CodeStep from './steps/CodeStep';
import ProfileStep from './steps/ProfileStep';
import PasswordStep from './steps/PasswordStep';
import ExistingUserStep from './steps/ExistingUserStep';
import { AuthService } from '@/services/auth';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'email' | 'code' | 'profile' | 'password' | 'existing-user';

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUserExisting, setIsUserExisting] = useState(false);

  // Reset form state when modal is opened/closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('email');
        setEmail('');
        setCode('');
        setFirstName('');
        setLastName('');
        setPassword('');
        setConfirmPassword('');
        setError('');
        setIsLoading(false);
        setIsUserExisting(false);
      }, 300); // Wait for close animation
    }
  }, [open]);

  const handleEmailSubmit = async (submittedEmail: string) => {
    setEmail(submittedEmail);
    setIsLoading(true);
    setError('');
    
    try {
      // Check if user exists before sending code
      const { exists } = await AuthService.checkUserExists(submittedEmail);
      setIsUserExisting(exists);
      
      if (exists) {
        setStep('existing-user');
      } else {
        await AuthService.sendCode(submittedEmail);
        setStep('code');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error procesando su correo electrónico');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (submittedCode: string) => {
    setCode(submittedCode);
    setIsLoading(true);
    setError('');
    
    try {
      const { isNew } = await AuthService.verifyCode(email, submittedCode);
      if (isNew) {
        setStep('profile');
      } else {
        onClose();
        window.location.reload();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Código incorrecto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = (first: string, last: string) => {
    setFirstName(first);
    setLastName(last);
    setStep('password');
  };

  const handlePasswordSubmit = async (pass: string, confirm: string) => {
    setPassword(pass);
    setConfirmPassword(confirm);
    setIsLoading(true);
    setError('');
    
    try {
      await AuthService.register({ firstName, lastName, password: pass });
      onClose();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al completar el registro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExistingUserLogin = async (pass: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      await AuthService.login(email, pass);
      onClose();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Credenciales incorrectas');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate progress percentage
  const getProgress = () => {
    const steps = ['email', 'code', 'profile', 'password'];
    const existingUserSteps = ['email', 'existing-user'];
    const stepsList = isUserExisting ? existingUserSteps : steps;
    const currentIndex = stepsList.indexOf(step as string);
    
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / stepsList.length) * 100;
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div 
            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-5 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {step === 'email' && 'Acceder / Registrarse'}
                {step === 'code' && 'Verificar Correo'}
                {step === 'profile' && 'Completa tu Perfil'}
                {step === 'password' && 'Crea tu Contraseña'}
                {step === 'existing-user' && 'Iniciar Sesión'}
              </h2>
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 bg-gray-200 dark:bg-slate-700">
              <div 
                className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-500 ease-out"
                style={{ width: `${getProgress()}%` }}
              />
            </div>

            {/* Steps indicator */}
            <div className="px-6 pt-5">
              <StepIndicator 
                currentStep={step} 
                isUserExisting={isUserExisting} 
              />
            </div>

            {/* Form content */}
            <div className="p-6">
              {step === 'email' && (
                <EmailStep 
                  email={email}
                  onSubmit={handleEmailSubmit}
                  isLoading={isLoading}
                  error={error}
                />
              )}
              
              {step === 'code' && (
                <CodeStep 
                  email={email}
                  code={code}
                  onSubmit={handleCodeSubmit}
                  onBack={() => setStep('email')}
                  isLoading={isLoading}
                  error={error}
                />
              )}
              
              {step === 'profile' && (
                <ProfileStep 
                  firstName={firstName}
                  lastName={lastName}
                  onSubmit={handleProfileSubmit}
                  onBack={() => setStep('code')}
                  error={error}
                />
              )}
              
              {step === 'password' && (
                <PasswordStep 
                  password={password}
                  confirmPassword={confirmPassword}
                  onSubmit={handlePasswordSubmit}
                  onBack={() => setStep('profile')}
                  isLoading={isLoading}
                  error={error}
                />
              )}
              
              {step === 'existing-user' && (
                <ExistingUserStep 
                  email={email}
                  onSubmit={handleExistingUserLogin}
                  onBack={() => setStep('email')}
                  isLoading={isLoading}
                  error={error}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}