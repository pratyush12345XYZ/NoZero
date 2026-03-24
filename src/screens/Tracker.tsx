import React, { useState, useMemo } from 'react';
import type { Habit, LogDetail } from '../types';
import { ICONS } from '../constants';
import { addDays, format, isAfter, isBefore, isSameDay } from 'date-fns';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

// Helper to parse YYYY-MM-DD
const parseDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Helper for start of day
const getStartOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper for Monday start
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? 6 : day - 1);
  d.setDate(d.getDate() - diff);
  return d;
};

interface TrackerProps {
  habit: Habit;
  onBack: () => void;
  onToggleLog: (habitId: string, date: string) => void;
  onRequestExtend: (habitId: string) => void;
  onRestart: (habitId: string) => void;
  onDelete: (habitId: string) => void;
}

export const Tracker: React.FC<TrackerProps> = ({ habit, onBack, onToggleLog, onRequestExtend, onRestart, onDelete }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Hardcore Check
  const isHardcoreBroken = useMemo(() => {
    if (!habit.isHardcore) return false;
    
    const start = getStartOfDay(parseDate(habit.startDate));
    const yesterday = addDays(getStartOfDay(new Date()), -1);
    
    // Iterate from start date to yesterday
    let current = start;
    while (isBefore(current, yesterday) || isSameDay(current, yesterday)) {
      const dateStr = format(current, 'yyyy-MM-dd');
      const log = habit.logs[dateStr];
      const isDone = typeof log === 'boolean' ? log : log?.completed;
      if (!isDone) {
        return true; // Found a gap
      }
      current = addDays(current, 1);
    }
    return false;
  }, [habit]);

  const calendarDays = useMemo(() => {
    const startDate = parseDate(habit.startDate);
    
    if (weekOffset === 0) {
      return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    } else {
      const endOfWeek0 = addDays(startDate, 6);
      const firstStandardMonday = getStartOfWeek(addDays(endOfWeek0, 1));
      const currentWeekStart = addDays(firstStandardMonday, (weekOffset - 1) * 7);
      return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
    }
  }, [habit.startDate, weekOffset]);

  // Statistics Calculation
  const startDateObj = getStartOfDay(parseDate(habit.startDate));
  const todayObj = getStartOfDay(new Date());
  
  // Completed Days (Only count logs on or after start date)
  const completedLogs = Object.entries(habit.logs).filter(([dateStr, val]) => {
      // Filter out invalid/old logs
      const logDate = getStartOfDay(parseDate(dateStr));
      if (isBefore(logDate, startDateObj)) return false;

      const v = val as boolean | LogDetail;
      if (typeof v === 'boolean') return v;
      return v.completed;
  });
  const completedCount = completedLogs.length;

  // Determine the cutoff date for missing days.
  // If there are logs in the future (relative to today), we extend the cutoff to the last logged date
  // to ensure gaps in that future timeline are counted as missed.
  // Otherwise, we stop at yesterday.
  let cutoff = addDays(todayObj, -1);
  const lastLogDate = completedLogs.reduce((max, [dateStr]) => {
      const d = getStartOfDay(parseDate(dateStr));
      return isAfter(d, max) ? d : max;
  }, cutoff);

  if (isAfter(lastLogDate, todayObj)) {
      cutoff = lastLogDate;
  }

  // Missed Days Calculation
  let missedCount = 0;
  let iterDate = startDateObj;
  
  // Safety: Only run loop if start date is valid and in range
  if (isValidDate(iterDate) && (isBefore(iterDate, cutoff) || isSameDay(iterDate, cutoff))) {
    while (isBefore(iterDate, cutoff) || isSameDay(iterDate, cutoff)) {
        const dStr = format(iterDate, 'yyyy-MM-dd');
        const log = habit.logs[dStr];
        const isDone = typeof log === 'boolean' ? log : log?.completed;
        if (!isDone) missedCount++;
        iterDate = addDays(iterDate, 1);
    }
  }

  // Progress Ring
  const totalDays = habit.endDate 
    ? (parseDate(habit.endDate).getTime() - parseDate(habit.startDate).getTime()) / (1000 * 3600 * 24) + 1
    : 0;
  const progressPercent = totalDays > 0 ? Math.min(100, (completedCount / totalDays) * 100) : 0;
  const circumference = 2 * Math.PI * 50; // Radius 50

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const endDate = habit.endDate ? parseDate(habit.endDate) : null;
    
    if (endDate && isAfter(date, endDate)) {
        onRequestExtend(habit.id);
        return;
    }
    onToggleLog(habit.id, dateStr);
  };

  const getLogTime = (log: boolean | LogDetail | undefined) => {
      if (!log || typeof log === 'boolean') return null;
      if (!log.completed) return null;
      return format(new Date(log.timestamp), 'h:mm a');
  };

  if (isHardcoreBroken) {
    return (
      <div className="min-h-screen text-inherit animate-fade-in flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-6 animate-slide-up">
          <ICONS.Close size={40} />
        </div>
        <h2 className="text-3xl font-bold mb-2 animate-slide-up text-current">Streak Broken</h2>
        <p className="opacity-60 mb-8 max-w-xs animate-slide-up">
          You missed a day in Hardcore Mode. This streak cannot continue.
        </p>
        
        <div className="w-full max-w-xs flex flex-col gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Button onClick={() => onRestart(habit.id)} fullWidth>
            Restart from Today
          </Button>
          <Button variant="danger" onClick={() => onDelete(habit.id)} fullWidth>
            Delete Streak
          </Button>
          <Button variant="ghost" onClick={onBack} fullWidth>
            Back to Hub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-inherit animate-fade-in pb-10">
      {/* Sticky Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-20 flex justify-between items-center p-6 backdrop-blur-xl max-w-[440px] mx-auto border-b border-current/5"
        style={{ backgroundColor: 'rgba(var(--bg-card-rgb), 0.8)' }}
      >
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-current/10 transition-colors text-current">
          <ICONS.Back className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-semibold text-lg text-current">{habit.name}</span>
          {habit.isHardcore && <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest">Hardcore</span>}
        </div>
        
        {/* Progress/History Button */}
        <button 
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 -mr-2 rounded-full hover:bg-current/10 transition-colors text-current"
        >
            <div className="flex flex-col gap-0.5 items-end">
                <span className="block w-4 h-0.5 bg-current rounded-full"></span>
                <span className="block w-3 h-0.5 bg-current rounded-full"></span>
                <span className="block w-2 h-0.5 bg-current rounded-full"></span>
            </div>
        </button>
      </header>

      <div className="pt-28 px-6">
        
        {/* Progress Ring */}
        {habit.endDate && (
          <div className="flex justify-center mb-10 animate-slide-up">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%" cy="50%" r="50"
                  fill="transparent"
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  strokeWidth="8"
                />
                <circle
                  cx="50%" cy="50%" r="50"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progressPercent / 100) * circumference}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-light">{Math.round(progressPercent)}%</span>
                <span className="text-[10px] opacity-50 uppercase tracking-widest">Complete</span>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Nav */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setWeekOffset(prev => prev - 1)}
            disabled={weekOffset === 0}
            className="p-2 rounded-full hover:bg-current/10 disabled:opacity-30 transition-colors text-current"
          >
            <ICONS.Back className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium opacity-60 uppercase tracking-widest">
            {weekOffset === 0 ? 'Start Week' : `Week ${weekOffset}`}
          </span>
          <button 
             onClick={() => setWeekOffset(prev => prev + 1)}
             className="p-2 rounded-full hover:bg-current/10 transition-colors rotate-180 text-current"
          >
            <ICONS.Back className="w-5 h-5" />
          </button>
        </div>

        {/* Days Grid */}
        <div className="flex flex-col gap-3">
          {calendarDays.map((date, index) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const log = habit.logs[dateStr];
            const isCompleted = typeof log === 'boolean' ? log : log?.completed;
            const logTime = getLogTime(log);
            const isAfterEnd = habit.endDate && isAfter(date, parseDate(habit.endDate));
            
            return (
              <div 
                key={dateStr}
                onClick={() => handleDayClick(date)}
                className={`
                  relative flex items-center justify-between p-4 rounded-[24px] border
                  transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  animate-slide-up cursor-pointer
                  ${isAfterEnd ? 'opacity-40 border-dashed border-current' : 'border-current/10 hover:bg-current/5'}
                  ${isCompleted 
                    ? 'bg-inverse text-inverse shadow-lg border-transparent' 
                    : ''}
                `}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col">
                  <span className={`text-xs uppercase tracking-widest mb-1 ${isCompleted ? 'opacity-60' : 'opacity-40'}`}>
                    {format(date, 'EEEE')}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl font-medium`}>{format(date, 'MMM d')}</span>
                    {logTime && (
                         <span className={`text-[10px] opacity-50 font-mono`}>{logTime}</span>
                    )}
                  </div>
                </div>

                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300
                  ${isCompleted 
                     ? 'border-transparent bg-current/20 text-current' 
                     : 'border-current border-opacity-20 text-transparent'}
                `}>
                  <ICONS.Check size={14} strokeWidth={4} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Modal */}
      <Modal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        title="Streak Progress"
      >
          <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-current/5 rounded-2xl flex flex-col items-center">
                      <span className="text-3xl font-light">{completedCount}</span>
                      <span className="text-[10px] uppercase opacity-50 tracking-widest mt-1">Completed</span>
                  </div>
                  <div className={`p-4 bg-current/5 rounded-2xl flex flex-col items-center ${habit.isHardcore ? 'opacity-30' : ''}`}>
                      <span className="text-3xl font-light">{habit.isHardcore ? '0' : missedCount}</span>
                      <span className="text-[10px] uppercase opacity-50 tracking-widest mt-1">Missed</span>
                  </div>
              </div>

              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                  <h3 className="text-sm opacity-50 uppercase tracking-widest mb-2">Log History</h3>
                  {completedLogs.sort((a,b) => b[0].localeCompare(a[0])).map(([date, val]) => {
                      const v = val as boolean | LogDetail;
                      const logData = typeof v === 'boolean' ? { completed: v, timestamp: 0 } : v;
                      return (
                          <div key={date} className="flex justify-between items-center p-3 bg-current/5 rounded-xl text-sm">
                              <span>{format(parseDate(date), 'MMM d, yyyy')}</span>
                              {logData.timestamp > 0 ? (
                                  <span className="opacity-50 font-mono text-xs">{format(new Date(logData.timestamp), 'h:mm a')}</span>
                              ) : (
                                  <span className="opacity-30 text-xs">Manual</span>
                              )}
                          </div>
                      )
                  })}
                  {completedLogs.length === 0 && (
                      <p className="text-center opacity-30 text-sm py-4">No progress yet.</p>
                  )}
              </div>
          </div>
      </Modal>
    </div>
  );
};

function isValidDate(d: Date) {
  return d instanceof Date && !isNaN(d.getTime());
}