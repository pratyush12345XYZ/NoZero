import React, { useState } from 'react';
import type { Habit, LogDetail, Notification } from '../types';
import { ICONS } from '../constants';
import { Button } from '../components/Button';

interface HubProps {
  habits: Habit[];
  profileName?: string;
  isVaultMode: boolean;
  notifications: Notification[];
  onExitVault: () => void;
  onSelectHabit: (habitId: string) => void;
  onCreateHabit: () => void;
  onOpenSettings: () => void;
  onDeleteHabit: (habitId: string) => void;
  onEditHabit: (habit: Habit, fieldToFocus?: 'name' | 'endDate') => void;
  onOpenNotifications: () => void;
}

export const Hub: React.FC<HubProps> = ({ 
  habits, 
  profileName,
  isVaultMode,
  notifications,
  onExitVault,
  onSelectHabit, 
  onCreateHabit, 
  onOpenSettings,
  onDeleteHabit,
  onEditHabit,
  onOpenNotifications
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  return (
    <div className="relative min-h-screen pb-40 px-6 pt-24 animate-fade-in text-inherit">
      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-20 flex justify-between items-center p-6 backdrop-blur-xl max-w-[440px] mx-auto border-b border-current/5 transition-all duration-300"
        style={{ backgroundColor: 'rgba(var(--bg-card-rgb), 0.8)' }}
      >
        <div className="flex flex-col items-start">
          <h2 className="text-2xl font-semibold text-current">Hello, {profileName || 'NoZero'}</h2>
          
          {isVaultMode ? (
             <div className="flex items-center gap-3 mt-1">
               <span className="text-[10px] text-red-400 font-bold tracking-widest uppercase bg-red-500/10 px-2 py-0.5 rounded">Vault Active</span>
               <button 
                 onClick={onExitVault} 
                 className="text-[10px] text-current opacity-60 hover:opacity-100 underline decoration-current/30 hover:decoration-current transition-all"
               >
                 Exit Vault
               </button>
             </div>
          ) : (
             <p className="text-current opacity-40 text-xs tracking-wider uppercase mt-1">Active Streaks</p>
          )}
        </div>
        
        <button 
          onClick={onOpenSettings}
          className="p-3 bg-current/5 rounded-full hover:bg-current/10 transition-colors text-current"
        >
          <ICONS.Settings className="w-5 h-5" />
        </button>
      </header>

      {/* List */}
      <div className="flex flex-col gap-4 mt-4">
        {habits.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <p>No active streaks.</p>
            <p className="text-sm">Start striving today.</p>
          </div>
        ) : (
          habits.map((habit, index) => {
            const completedCount = Object.values(habit.logs).filter(v => {
                 if (typeof v === 'boolean') return v;
                 return (v as LogDetail).completed;
            }).length;
            const isActive = activeMenu === habit.id;
            
            return (
              <div 
                key={habit.id}
                onClick={() => onSelectHabit(habit.id)}
                className={`
                  group relative bg-current/5 border border-current/10 rounded-[28px] p-6 
                  hover:bg-current/10 transition-all duration-300 active:scale-[0.98] cursor-pointer 
                  animate-slide-up backdrop-blur-md
                  /* Fix for overlap issue: Raise z-index if menu is active */
                  ${isActive ? 'z-30' : 'z-0'}
                `}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-medium text-current mb-1 flex items-center gap-2">
                      {habit.name}
                      {habit.isHardcore && (
                        <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Hardcore</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-light text-current">{completedCount}</span>
                      <span className="text-xs text-current opacity-40 uppercase tracking-widest mt-2">Days</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => toggleMenu(e, habit.id)}
                    className="p-2 -mr-2 rounded-full hover:bg-current/10 text-current opacity-40 hover:opacity-100 transition-colors"
                  >
                    <ICONS.Menu size={18} />
                  </button>
                </div>

                {/* Context Menu */}
                {isActive && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }} />
                    <div 
                      className="absolute right-4 top-14 z-40 border border-current/10 rounded-xl shadow-2xl overflow-hidden min-w-[160px] animate-fade-in"
                      style={{ backgroundColor: 'var(--bg-card)' }}
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEditHabit(habit, 'name'); setActiveMenu(null); }}
                        className="w-full text-left px-4 py-3 text-sm text-current hover:bg-current/5 flex items-center gap-2"
                      >
                        <ICONS.Edit size={14} /> Rename
                      </button>
                      <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            onEditHabit(habit, 'endDate');
                            setActiveMenu(null); 
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-current hover:bg-current/5 flex items-center gap-2"
                      >
                        <ICONS.Calendar size={14} /> End Date
                      </button>
                      <div className="h-px bg-current/10 mx-2" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteHabit(habit.id); setActiveMenu(null); }}
                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                      >
                        <ICONS.Delete size={14} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-36 left-0 right-0 flex justify-center z-20 pointer-events-none">
         <div className="pointer-events-auto shadow-2xl rounded-full">
            <Button onClick={onCreateHabit} className="rounded-full px-8 py-4 flex items-center gap-3">
              <ICONS.Plus size={20} />
              <span className="tracking-wide">New Streak</span>
            </Button>
         </div>
      </div>

      {/* Notifications Bell - Conditional Rendering */}
      {notifications.length > 0 && (
        <button 
          onClick={onOpenNotifications}
          className="fixed bottom-8 left-8 z-30 p-3 rounded-full bg-current/5 border border-current/10 text-current hover:bg-current/10 transition-colors shadow-xl active:scale-95 animate-fade-in"
        >
            <div className="relative">
                <ICONS.Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            </div>
        </button>
      )}

    </div>
  );
};