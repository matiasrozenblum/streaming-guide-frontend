import React, { useState } from 'react';
import { User, ArrowLeft } from 'lucide-react';
import { FormAlert } from '../FormAlert';
import { Button } from '../../ui/Button';

interface ProfileStepProps {
  firstName: string;
  lastName: string;
  onSubmit: (firstName: string, lastName: string) => void;
  onBack: () => void;
  error: string;
}

export default function ProfileStep({
  firstName,
  lastName,
  onSubmit,
  onBack,
  error
}: ProfileStepProps) {
  const [inputFirstName, setInputFirstName] = useState(firstName);
  const [inputLastName, setInputLastName] = useState(lastName);
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputFirstName.trim()) {
      setLocalError('Por favor, ingrese su nombre');
      return;
    }
    
    if (!inputLastName.trim()) {
      setLocalError('Por favor, ingrese su apellido');
      return;
    }
    
    setLocalError('');
    onSubmit(inputFirstName.trim(), inputLastName.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-gray-600 dark:text-gray-300">
          Cuéntanos un poco sobre ti
        </p>
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <User size={18} className="text-gray-500 dark:text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full p-3 pl-10 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
          placeholder="Nombre"
          value={inputFirstName}
          onChange={(e) => setInputFirstName(e.target.value)}
          autoFocus
        />
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <User size={18} className="text-gray-500 dark:text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full p-3 pl-10 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
          placeholder="Apellido"
          value={inputLastName}
          onChange={(e) => setInputLastName(e.target.value)}
        />
      </div>
      
      {(error || localError) && (
        <FormAlert type="error" message={error || localError} />
      )}
      
      <div className="flex flex-col space-y-3 mt-6">
        <Button
          type="submit"
          className="w-full"
        >
          Continuar
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="w-full"
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver
        </Button>
      </div>
    </form>
  );
}