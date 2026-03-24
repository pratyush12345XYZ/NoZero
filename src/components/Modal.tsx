import React, { useEffect, useState } from 'react';
import { ICONS } from '../constants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setShow(true);
    else setTimeout(() => setShow(false), 300); // Wait for exit animation
  }, [isOpen]);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className={`
        relative w-full max-w-sm border 
        rounded-[32px] p-6 shadow-2xl overflow-hidden
        transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
        /* Fix for Issue #2: Dynamic background color based on theme context (handled via CSS variables or utility classes) */
        bg-[#0a0a0a] border-white/10 text-white
        dark:bg-[#0a0a0a] dark:border-white/10 dark:text-white
        /* We use a specific class targeting the root theme class if available, but since we are inside a portal or root, we need to ensure contrast */
        ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-20 scale-95'}
      `}
      style={{
         // Inline style override to ensure it matches the current theme active in App.tsx
         backgroundColor: 'var(--bg-card, #0a0a0a)',
         color: 'var(--text-card, #ffffff)',
         borderColor: 'var(--border-card, rgba(255,255,255,0.1))'
      }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 opacity-60 hover:opacity-100 transition-all"
          >
            <ICONS.Close size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};