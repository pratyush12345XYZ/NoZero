export type Screen = 'LOGIN' | 'ONBOARDING' | 'HUB' | 'TRACKER' | 'ANALYSIS' | 'FRIENDS' | 'FRIEND_VIEW' | 'GROUP_TRACKER';

export interface Notification {
  id: string;
  type: 'FRIEND_REQUEST';
  fromUser: string; // username
  timestamp: number;
}

export interface Friend {
  id: string;
  username: string;
  name: string;
  habits: Habit[]; // In a real app, this would be fetched asynchronously
}

export interface UserProfile {
  name: string;
  username: string;
  dob: string; // YYYY-MM-DD
  isOnboarded: boolean;
  email?: string;
  friends: Friend[];
  notifications: Notification[];
}

export interface LogDetail {
  completed: boolean;
  timestamp: number; // Unix timestamp
}

export interface Habit {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  isHardcore?: boolean;
  // Supports legacy boolean or new object format
  logs: Record<string, boolean | LogDetail>; 
  createdAt: number;
}

export interface GroupMember {
  userId: string;
  username: string;
  name: string;
  logs: Record<string, LogDetail>;
}

export interface GroupStreak {
  id: string;
  name: string;
  adminId: string; // userId (username in this mock)
  startDate: string;
  endDate?: string;
  members: GroupMember[];
  createdAt: number;
}

export interface ThemeConfig {
  mode: 'dark' | 'light';
}