import type { Habit, UserProfile, ThemeConfig, GroupStreak } from '../types';

const KEYS = {
  HABITS: 'strive_habits',
  VAULT_HABITS: 'strive_vault_habits',
  VAULT_PASSWORD: 'strive_vault_password',
  PROFILE: 'strive_profile',
  THEME: 'strive_theme',
  GROUP_STREAKS: 'strive_groups'
};

export const storage = {
  getHabits: (): Habit[] => {
    const data = localStorage.getItem(KEYS.HABITS);
    return data ? JSON.parse(data) : [];
  },
  
  saveHabits: (habits: Habit[]) => {
    localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
  },

  getVaultHabits: (): Habit[] => {
    const data = localStorage.getItem(KEYS.VAULT_HABITS);
    return data ? JSON.parse(data) : [];
  },

  saveVaultHabits: (habits: Habit[]) => {
    localStorage.setItem(KEYS.VAULT_HABITS, JSON.stringify(habits));
  },

  getVaultPassword: (): string | null => {
    return localStorage.getItem(KEYS.VAULT_PASSWORD);
  },

  saveVaultPassword: (password: string) => {
    localStorage.setItem(KEYS.VAULT_PASSWORD, password);
  },

  getProfile: (): UserProfile | null => {
    const data = localStorage.getItem(KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  },

  saveProfile: (profile: UserProfile) => {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  getTheme: (): ThemeConfig => {
    const data = localStorage.getItem(KEYS.THEME);
    return data ? JSON.parse(data) : { mode: 'dark' };
  },

  saveTheme: (theme: ThemeConfig) => {
    localStorage.setItem(KEYS.THEME, JSON.stringify(theme));
  },

  getGroupStreaks: (): GroupStreak[] => {
    const data = localStorage.getItem(KEYS.GROUP_STREAKS);
    return data ? JSON.parse(data) : [];
  },

  saveGroupStreaks: (groups: GroupStreak[]) => {
    localStorage.setItem(KEYS.GROUP_STREAKS, JSON.stringify(groups));
  }
};