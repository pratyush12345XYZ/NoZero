import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { format, addMonths, endOfMonth, endOfWeek, addDays, isSameMonth, isToday, isValid } from 'date-fns';
import { Modal } from './Modal';
import { Input } from './Input';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  title?: string;
  minDate?: string;
}

// Helpers
const getStartOfMonth = (date: Date) => {
  const d = new Date(date);
  d.setDate(1);
  return d;
};

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Adjust to Sunday
  d.setDate(diff);
  return d;
};

export const CalendarModal: React.FC<CalendarModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onSelectDate,
  title = "Select Date",
  minDate
}) => {
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      const d = selectedDate ? new Date(selectedDate) : new Date();
      setCurrentMonth(d);
      setManualInput('');
    }
  }, [isOpen, selectedDate]);

  // Handle Manual Typing (DD/MM/YYYY)
  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualInput(val);
    
    // Attempt parse manually
    if (val.length === 10) {
      const parts = val.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        
        const parsedDate = new Date(year, month, day);

        if (isValid(parsedDate) && parsedDate.getDate() === day && parsedDate.getMonth() === month && parsedDate.getFullYear() === year) {
           const dateStr = format(parsedDate, 'yyyy-MM-dd');
           // Validate minDate if exists
           if (minDate && dateStr < minDate) return;
           
           setCurrentMonth(parsedDate);
           onSelectDate(dateStr);
        }
      }
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6 px-2">
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ICONS.Back className="w-5 h-5" />
        </button>
        <span className="text-lg font-medium tracking-wide">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-full hover:bg-white/10 transition-colors rotate-180">
          <ICONS.Back className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = "EEEE";
    const days = [];
    let startDate = getStartOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-[10px] uppercase tracking-widest opacity-40 mb-2">
          {format(addDays(startDate, i), dateFormat).substring(0, 3)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = getStartOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = getStartOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const dateStr = format(day, 'yyyy-MM-dd');
        
        const isSelected = selectedDate === dateStr;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isDisabled = minDate ? dateStr < minDate : false;

        days.push(
          <div
            key={day.toString()}
            onClick={() => !isDisabled && onSelectDate(dateStr)}
            className={`
              relative h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-300
              ${!isCurrentMonth ? "opacity-20" : ""}
              ${isDisabled ? "opacity-10 cursor-not-allowed" : "cursor-pointer hover:bg-white/10"}
              ${isSelected 
                ? "bg-white text-black dark:bg-white dark:text-black light:bg-black light:text-white shadow-lg scale-110" 
                : ""}
            `}
            style={isSelected ? { backgroundColor: 'var(--text-card)', color: 'var(--bg-card)' } : {}}
          >
            <span>{formattedDate}</span>
            {isToday(day) && !isSelected && (
              <div className="absolute bottom-1 w-1 h-1 rounded-full bg-current opacity-50"></div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-y-2">
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <Input 
          placeholder="DD/MM/YYYY" 
          value={manualInput} 
          onChange={handleManualChange}
          className="text-center tracking-widest"
        />
        <div className="select-none pt-2">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>
      </div>
    </Modal>
  );
};