import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  const baseStyle = "relative overflow-hidden font-semibold transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 flex items-center justify-center gap-2";
  const rounded = "rounded-[20px]";
  
  const variants = {
    // Uses .bg-inverse and .text-inverse defined in App.tsx style block
    primary: "bg-inverse text-inverse hover:-translate-y-[3px] shadow-lg shadow-current/10",
    secondary: "bg-current/10 text-current backdrop-blur-md border border-current/10 hover:bg-current/20 hover:-translate-y-[3px]",
    danger: "bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30",
    // Ghost uses text-current for theme adaptability
    ghost: "bg-transparent text-current opacity-60 hover:opacity-100 hover:bg-current/5",
  };

  const width = fullWidth ? "w-full py-4 text-lg" : "px-6 py-3 text-sm";

  return (
    <button 
      className={`${baseStyle} ${rounded} ${variants[variant]} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};