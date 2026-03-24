import React from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange, description }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-current">{label}</span>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`
            relative w-12 h-7 rounded-full transition-colors duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${checked ? 'bg-red-500' : 'bg-current/10'}
          `}
        >
          <div 
            className={`
              absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
              ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>
      {description && (
        <p className={`text-xs opacity-50 leading-relaxed transition-all duration-300 ${checked ? 'text-red-500 opacity-100 font-medium' : 'text-current'}`}>
          {description}
        </p>
      )}
    </div>
  );
};