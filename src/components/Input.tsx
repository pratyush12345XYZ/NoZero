import React from 'react';
import type { LucideIcon } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  onIconClick?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  className = '',
  icon: Icon,
  onIconClick,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-2 w-full relative group">
      {label && <label className="text-sm font-light text-current opacity-60 ml-1">{label}</label>}
      <div className="relative">
        <input
          className={`
            w-full bg-white/5 border border-white/10 rounded-[18px] px-5 py-4 
            text-inherit placeholder-current placeholder-opacity-20 outline-none 
            focus:border-current focus:border-opacity-40 focus:bg-white/10 
            transition-all duration-300 backdrop-blur-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            ${props.readOnly ? 'cursor-pointer hover:bg-white/10' : ''}
            ${className}
          `}
          {...props}
        />
        {Icon && (
          <button
            type="button"
            onClick={onIconClick}
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
            disabled={props.disabled}
          >
            <Icon size={20} />
          </button>
        )}
      </div>
    </div>
  );
};