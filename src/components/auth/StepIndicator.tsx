import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

interface StepIndicatorProps {
  currentStep: string;
  isUserExisting: boolean;
}

export default function StepIndicator({ currentStep, isUserExisting }: StepIndicatorProps) {
  const steps = isUserExisting 
    ? [
        { id: 'email', icon: MailOutlineIcon, label: 'Correo' },
        { id: 'existing-user', icon: VpnKeyIcon, label: 'Acceso' }
      ]
    : [
        { id: 'email', icon: MailOutlineIcon, label: 'Correo' },
        { id: 'code', icon: VpnKeyIcon, label: 'Verificar' },
        { id: 'profile', icon: PersonOutlineIcon, label: 'Perfil' },
        { id: 'password', icon: LockOutlinedIcon, label: 'Contraseña' }
      ];

  return (
    <div className="flex justify-between mb-6 px-2">
      {steps.map((step, index) => {
        // Determine if this step is active, completed, or upcoming
        const stepIndex = steps.findIndex(s => s.id === currentStep);
        const isCompleted = index < stepIndex;
        const isActive = step.id === currentStep;
        const isUpcoming = index > stepIndex;
        
        // Get the appropriate icon component
        const IconComponent = step.icon;
        
        return (
          <div 
            key={step.id} 
            className="flex flex-col items-center space-y-2"
          >
            {/* Step icon with appropriate styling */}
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
              ${isActive ? 'border-blue-500 bg-blue-50 dark:bg-slate-700 text-blue-500' : ''}
              ${isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-500' : ''}
              ${isUpcoming ? 'border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500' : ''}
            `}>
              {isCompleted ? (
                <CheckCircleIcon fontSize="small" className="text-green-500" />
              ) : (
                <IconComponent fontSize="small" />
              )}
            </div>
            
            {/* Step label */}
            <span className={`
              text-xs font-medium transition-colors
              ${isActive ? 'text-blue-500' : ''}
              ${isCompleted ? 'text-green-500' : ''}
              ${isUpcoming ? 'text-gray-400 dark:text-slate-500' : ''}
            `}>
              {step.label}
            </span>

            {/* Connector line, except for the last step */}
            {index < steps.length - 1 && (
              <div className="absolute left-0 right-0 h-0.5 top-5 -z-10 transform translate-y-0">
                <div 
                  className={`h-0.5 transition-all duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'
                  }`} 
                  style={{
                    width: `calc(100% - ${steps.length * 2}rem)`,
                    marginLeft: '2rem',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}