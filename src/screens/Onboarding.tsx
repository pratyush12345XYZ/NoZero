import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { CalendarModal } from '../components/CalendarModal';
import { ICONS } from '../constants';
import { format } from 'date-fns';

interface OnboardingProps {
  email?: string;
  initialName?: string;
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ email, initialName, onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(initialName || '');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && dob) setStep(2);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(val);
    setUsernameError('');
    
    // Production: In a real app, debounced API call to check availability would go here.
    // For local-first, we assume all valid usernames are available.
    if (val.length > 0 && val.length < 3) {
        setUsernameError('Username too short');
    }
  };

  const generateSuggestion = () => {
    if (name) {
        const base = name.toLowerCase().replace(/\s/g, '');
        const random = Math.floor(Math.random() * 1000);
        setUsername(`${base}_${random}`);
        setUsernameError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError || !username) return;

    onComplete({ 
        name, 
        username, 
        dob, 
        email, 
        isOnboarded: true, 
        friends: [],
        notifications: []
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center animate-fade-in">
      <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h1 className="text-4xl font-light tracking-tighter mb-2 text-inherit">
            {step === 1 ? 'Profile Setup' : 'Identity'}
        </h1>
        <p className="opacity-40 tracking-widest text-xs uppercase">
            {step === 1 ? 'Tell us about yourself' : 'Choose your unique handle'}
        </p>
      </div>

      {step === 1 ? (
          <form 
            onSubmit={handleNext} 
            className="w-full max-w-xs flex flex-col gap-6 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            <Input 
              label="Display Name" 
              placeholder="e.g. Nemo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            
            <Input 
              label="Date of Birth" 
              value={dob ? format(new Date(dob), 'MMM d, yyyy') : ''}
              placeholder="Select Date"
              readOnly
              icon={ICONS.Calendar}
              onClick={() => setIsCalendarOpen(true)}
            />

            <div className="pt-4">
              <Button type="submit" fullWidth disabled={!name || !dob}>
                Next
              </Button>
            </div>
          </form>
      ) : (
          <form 
            onSubmit={handleSubmit} 
            className="w-full max-w-xs flex flex-col gap-6 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="relative">
                <Input 
                label="Username" 
                placeholder="@username"
                value={username}
                onChange={handleUsernameChange}
                autoFocus
                className={usernameError ? 'border-red-500 text-red-500' : ''}
                />
                {usernameError && (
                    <span className="absolute -bottom-5 left-0 text-[10px] text-red-500">{usernameError}</span>
                )}
                 {!username && name && (
                    <button 
                        type="button" 
                        onClick={generateSuggestion}
                        className="absolute -bottom-6 right-0 text-[10px] opacity-50 underline hover:opacity-100"
                    >
                        Generate suggestion
                    </button>
                )}
            </div>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="submit" fullWidth disabled={!username || !!usernameError}>
                Complete
              </Button>
            </div>
          </form>
      )}

      <CalendarModal 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={dob}
        onSelectDate={(date) => { setDob(date); setIsCalendarOpen(false); }}
        title="Date of Birth"
      />
    </div>
  );
};