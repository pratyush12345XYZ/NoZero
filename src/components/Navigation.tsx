import React from 'react';
import { ICONS } from '../constants';
import type { Screen } from '../types';

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentScreen, onNavigate }) => {
  const isHomeActive = currentScreen === 'HUB';
  const isAnalysisActive = currentScreen === 'ANALYSIS';
  const isProfileActive = currentScreen === 'FRIENDS';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pb-6 pt-10 bg-gradient-to-t from-black/80 to-transparent pointer-events-none max-w-[440px] mx-auto">
      <div className="pointer-events-auto bg-black/80 backdrop-blur-xl border border-white/10 rounded-full p-2 flex gap-4 text-white">
        <button
          type="button"
          onClick={() => onNavigate('HUB')}
          title="Home"
          className={`p-2 rounded-full flex items-center justify-center transition-colors ${
            isHomeActive
              ? 'bg-white/10 text-white'
              : 'hover:bg-white/10 text-white/50 hover:text-white'
          }`}
        >
          <ICONS.Home size={20} />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('ANALYSIS')}
          title="Analytics"
          className={`p-2 rounded-full flex items-center justify-center transition-colors ${
            isAnalysisActive
              ? 'bg-white/10 text-white'
              : 'hover:bg-white/10 text-white/50 hover:text-white'
          }`}
        >
          <ICONS.Analysis size={20} />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('FRIENDS')}
          title="Profile"
          className={`p-2 rounded-full flex items-center justify-center transition-colors ${
            isProfileActive
              ? 'bg-white/10 text-white'
              : 'hover:bg-white/10 text-white/50 hover:text-white'
          }`}
        >
          <ICONS.Friends size={20} />
        </button>
      </div>
    </div>
  );
};
