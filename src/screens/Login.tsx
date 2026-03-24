import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { supabase } from '../services/db';

interface LoginProps {
  onLogin: (phone: string, username?: string, appData?: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    if (!username || !phone) {
      setError("Please fill all fields");
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      if (tab === 'signin') {
        const { data, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('phone_number', phone)
          .single();

        if (dbError || !data) {
           setError("Phone number not found. Please sign up.");
           setIsLoading(false);
           return;
        }

        if (data.username !== username) {
           setError("Username does not match this phone number.");
           setIsLoading(false);
           return;
        }

        onLogin(phone, username, data?.app_data);

      } else {
        // Sign up
        const { data: existingPhone } = await supabase
          .from('users')
          .select('*')
          .eq('phone_number', phone)
          .maybeSingle();

        if (existingPhone) {
           setError("Phone number already registered. Please sign in or use another number to sign up.");
           setIsLoading(false);
           return;
        }

        const { data: existingUsername } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .maybeSingle();

        if (existingUsername) {
           setError("Username is already taken. Please choose another one.");
           setIsLoading(false);
           return;
        }

        const { error: insertError } = await supabase
          .from('users')
          .insert([{ phone_number: phone, username: username }]);

        if (insertError) {
           setError("Error creating account. Try again.");
           setIsLoading(false);
           return;
        }

        onLogin(phone, username, {});
      }
    } catch (e: any) {
      setError(e.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center animate-fade-in relative overflow-hidden bg-black text-white">
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="mb-12 z-10 animate-slide-up">
        <h1 className="text-6xl font-light tracking-tighter mb-4">NoZero.</h1>
        <p className="opacity-40 tracking-[0.2em] text-xs uppercase">Precision Habit Tracking</p>
      </div>

      <div className="w-full max-w-xs z-10 p-6 rounded-[30px] bg-white/5 border border-white/10 backdrop-blur-md">
        <div className="flex gap-2 mb-6 p-1 bg-black/50 rounded-full">
          <button 
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${tab === 'signin' ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}
            onClick={() => { setTab('signin'); setError(''); }}
          >
            Sign In
          </button>
          <button 
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${tab === 'signup' ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}
            onClick={() => { setTab('signup'); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        <div className="flex flex-col gap-4 text-left">
           <Input 
             label="Username" 
             placeholder="e.g. johndoe" 
             value={username}
             onChange={(e) => setUsername(e.target.value)}
           />
           <Input 
             label="Phone Number" 
             placeholder="e.g. +1234567890" 
             value={phone}
             onChange={(e) => setPhone(e.target.value)}
           />

           {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}

           <Button onClick={handleAuth} disabled={isLoading} className="mt-4">
             {isLoading ? 'Connecting...' : (tab === 'signin' ? 'Sign In' : 'Create Account')}
           </Button>
        </div>
      </div>
    </div>
  );
};