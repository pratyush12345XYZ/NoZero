import React, { useMemo, useState, useEffect } from 'react';
import type { Habit, LogDetail } from '../types';
import { ICONS } from '../constants';

interface AnalysisProps {
  habits: Habit[];
  username: string;
}

// Background images collection (Gym/Fitness Aesthetic)
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80", // Weights
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80", // Muscle
  "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80", // Gym Bar
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80", // Pushups
  "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&q=80", // Dumbbells
  "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80"  // Gym dark
];

export const Analysis: React.FC<AnalysisProps> = ({ habits, username }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Select random background on mount
  const bgImage = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
    return BACKGROUND_IMAGES[randomIndex];
  }, []);

  // Preload image for smooth transition
  useEffect(() => {
    const img = new Image();
    img.src = bgImage;
    img.onload = () => {
        setImageLoaded(true);
    };
  }, [bgImage]);

  // Stats Logic
  const activeStreaks = habits.length;
  
  let totalCompletions = 0;
  let totalActiveDays = 0; // Rough estimate of denominator
  
  habits.forEach(h => {
     // Completed
     const completions = Object.values(h.logs).filter(v => {
         const val = v as boolean | LogDetail;
         return typeof val === 'boolean' ? val : val.completed;
     }).length;
     totalCompletions += completions;

     // Duration (Start to Today)
     const start = new Date(h.startDate);
     const now = new Date();
     const diff = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 3600 * 24)));
     totalActiveDays += diff;
  });

  const completionRate = totalActiveDays > 0 ? Math.round((totalCompletions / totalActiveDays) * 100) : 0;
  
  // Find longest current streak among all habits
  let longestStreak = 0;
  habits.forEach(h => {
      const completions = Object.values(h.logs).filter(v => {
          const val = v as boolean | LogDetail;
          return typeof val === 'boolean' ? val : val.completed;
      }).length;
      if (completions > longestStreak) longestStreak = completions;
  });

  return (
    <div className="min-h-screen pt-24 px-6 pb-24 animate-fade-in text-inherit relative overflow-hidden">
      
      {/* Background Image Layer */}
      <div 
        className={`absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${imageLoaded ? 'opacity-15' : 'opacity-0'}`}
        style={{ 
            backgroundImage: `url(${bgImage})`,
            filter: 'grayscale(100%)' // Optional: makes it blend better with themes
        }}
      />
      {/* Gradient Overlay for readability at top/bottom */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[var(--bg-card)] via-transparent to-[var(--bg-card)] opacity-80 pointer-events-none" />

      {/* Content Layer */}
      <div className="relative z-10">
        <div className="mb-8">
            <h2 className="text-3xl font-light mb-1">Analysis</h2>
            <p className="opacity-50 text-sm">@{username}</p>
        </div>

        <div className="grid gap-4">
            {/* Main Card */}
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/10 border border-current/10 rounded-[32px] p-8 flex flex-col items-center justify-center animate-slide-up backdrop-blur-sm">
                <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="50%" cy="50%" r="60" fill="transparent" stroke="currentColor" strokeOpacity="0.1" strokeWidth="12" />
                        <circle cx="50%" cy="50%" r="60" fill="transparent" stroke="currentColor" strokeWidth="12" strokeDasharray={2 * Math.PI * 60} strokeDashoffset={2 * Math.PI * 60 * (1 - completionRate / 100)} strokeLinecap="round" className="text-purple-400" />
                    </svg>
                    <span className="absolute text-3xl font-bold">{completionRate}%</span>
                </div>
                <p className="text-sm opacity-60 uppercase tracking-widest">Global Completion Rate</p>
            </div>

            <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="bg-current/5 border border-current/10 rounded-[28px] p-6 flex flex-col items-center backdrop-blur-sm">
                    <span className="text-4xl font-semibold mb-2">{totalCompletions}</span>
                    <span className="text-[10px] opacity-50 uppercase tracking-widest text-center">Total Check-ins</span>
                </div>
                <div className="bg-current/5 border border-current/10 rounded-[28px] p-6 flex flex-col items-center backdrop-blur-sm">
                    <span className="text-4xl font-semibold mb-2">{longestStreak}</span>
                    <span className="text-[10px] opacity-50 uppercase tracking-widest text-center">Longest Streak</span>
                </div>
            </div>

            <div className="bg-current/5 border border-current/10 rounded-[28px] p-6 animate-slide-up backdrop-blur-sm" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-full bg-current/10">
                        <ICONS.Check size={20} />
                    </div>
                    <div>
                        <h3 className="font-medium">Active Habits</h3>
                        <p className="text-xs opacity-50">Currently tracking</p>
                    </div>
                    <span className="ml-auto text-2xl font-bold">{activeStreaks}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};