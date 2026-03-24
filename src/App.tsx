import React, { useEffect, useState } from 'react';
import { Login } from './screens/Login';
import { Onboarding } from './screens/Onboarding';
import { Hub } from './screens/Hub';
import { Tracker } from './screens/Tracker';
import { Analysis } from './screens/Analysis';
import { Friends } from './screens/Friends';
import { GroupTracker } from './screens/GroupTracker';
import { Modal } from './components/Modal';
import { CalendarModal } from './components/CalendarModal';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { Toggle } from './components/Toggle';
import { storage } from './services/storage';
import type { Habit, UserProfile, Screen, ThemeConfig, Friend, LogDetail, GroupStreak, GroupMember, Notification } from './types';
import { ICONS } from './constants';
import { format } from 'date-fns';

// Helper to replace parseISO
const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const App: React.FC = () => {
  // --- STATE ---
  const [screen, setScreen] = useState<Screen>('LOGIN');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Normal Habits
  const [habits, setHabits] = useState<Habit[]>([]);
  // Hidden (Vault) Habits
  const [vaultHabits, setVaultHabits] = useState<Habit[]>([]);
  // Group Streaks
  const [groupStreaks, setGroupStreaks] = useState<GroupStreak[]>([]);
  
  // Vault Logic
  const [isVaultMode, setIsVaultMode] = useState(false);
  const [vaultPassword, setVaultPassword] = useState<string | null>(null);
  const [isVaultPasswordModalOpen, setIsVaultPasswordModalOpen] = useState(false);
  const [vaultPasswordInput, setVaultPasswordInput] = useState('');
  const [vaultPasswordMode, setVaultPasswordMode] = useState<'ENTER' | 'CREATE' | 'CHANGE'>('ENTER');
  const [pinLength, setPinLength] = useState<4 | 6>(4);
  const [oldPasswordInput, setOldPasswordInput] = useState('');

  const [activeHabitId, setActiveHabitId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeConfig>({ mode: 'dark' });
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  // Deletion Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [habitToDeleteId, setHabitToDeleteId] = useState<string | null>(null);

  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Extension
  const [isExtensionPromptOpen, setIsExtensionPromptOpen] = useState(false);
  const [habitToExtendId, setHabitToExtendId] = useState<string | null>(null);

  // Calendar
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<'START' | 'END' | 'EXTEND' | null>(null);

  // Form
  const [formName, setFormName] = useState('');
  const [formStart, setFormStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formEnd, setFormEnd] = useState('');
  const [formHardcore, setFormHardcore] = useState(false);

  // --- EFFECTS ---
  useEffect(() => {
    const savedProfile = storage.getProfile();
    const savedHabits = storage.getHabits();
    const savedVaultHabits = storage.getVaultHabits();
    const savedTheme = storage.getTheme();
    const savedVaultPass = storage.getVaultPassword();
    const savedGroups = storage.getGroupStreaks();

    setHabits(savedHabits);
    setVaultHabits(savedVaultHabits);
    setGroupStreaks(savedGroups);
    setTheme(savedTheme);
    setVaultPassword(savedVaultPass);

    if (savedProfile?.isOnboarded) {
      setProfile(savedProfile);
      setScreen('HUB');
    } else {
      setScreen('LOGIN');
    }
  }, []);

  useEffect(() => {
    storage.saveHabits(habits);
  }, [habits]);

  useEffect(() => {
    storage.saveVaultHabits(vaultHabits);
  }, [vaultHabits]);

  useEffect(() => {
    storage.saveGroupStreaks(groupStreaks);
  }, [groupStreaks]);

  useEffect(() => {
    if (profile) storage.saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    storage.saveTheme(theme);
    if (theme.mode === 'light') {
      document.documentElement.classList.add('light-mode'); 
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  // --- DATABASE SYNC EFFECT ---
  useEffect(() => {
    // Only sync if user is logged in (has email/phone set)
    if (!profile?.email) return;

    const syncToDb = async () => {
       const appData = {
          habits,
          vaultHabits,
          groupStreaks,
          profile,
          theme,
          vaultPassword
       };

       const { supabase } = await import('./services/db');
       const { error } = await supabase
          .from('users')
          .update({ app_data: appData })
          .eq('phone_number', profile.email);
          
       if (error) {
          console.error("Failed to sync to database:", error);
       }
    };

    // Debounce sync by 1 second to prevent massive write bursts
    const timer = setTimeout(syncToDb, 1000);
    return () => clearTimeout(timer);
  }, [habits, vaultHabits, groupStreaks, profile, theme, vaultPassword]);

  // --- HANDLERS ---
  const handleLogin = (phone: string, username?: string, appData?: any) => {
      // If we downloaded data from Supabase, restore it!
      if (appData && Object.keys(appData).length > 0) {
          if (appData.habits) setHabits(appData.habits);
          if (appData.vaultHabits) setVaultHabits(appData.vaultHabits);
          if (appData.groupStreaks) setGroupStreaks(appData.groupStreaks);
          if (appData.profile) setProfile(appData.profile);
          if (appData.theme) setTheme(appData.theme);
          if (appData.vaultPassword) setVaultPassword(appData.vaultPassword);
          
          if (appData.profile?.isOnboarded) {
             setScreen('HUB');
             return;
          }
      }

      setProfile(prev => prev ? { ...prev, username: username || '', name: username || '', email: phone } : { 
          name: username || '', 
          username: username || '', 
          dob: '', 
          isOnboarded: false, 
          email: phone, // Storing phone in email field for compatibility
          friends: [], 
          notifications: [] 
      });
      setScreen('ONBOARDING');
  };

  const handleLogout = () => {
      setProfile(null);
      setScreen('LOGIN');
      setIsSettingsOpen(false);
  };

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile({ ...newProfile, notifications: [] });
    setScreen('HUB');
  };

  // CRUD
  const openCreateModal = () => {
    setModalMode('CREATE');
    setEditingHabitId(null);
    setFormName('');
    setFormStart(format(new Date(), 'yyyy-MM-dd'));
    setFormEnd('');
    setFormHardcore(false);
    setIsModalOpen(true);
  };

  const openEditModal = (habit: Habit) => {
    setModalMode('EDIT');
    setEditingHabitId(habit.id);
    setFormName(habit.name);
    setFormStart(habit.startDate);
    setFormEnd(habit.endDate || '');
    setFormHardcore(habit.isHardcore || false);
    setIsModalOpen(true);
  };

  const handleSaveHabit = () => {
    if (!formName) return;

    const newHabitObj: Habit = {
      id: Date.now().toString(),
      name: formName,
      startDate: formStart,
      endDate: formEnd || undefined,
      isHardcore: formHardcore,
      logs: {},
      createdAt: Date.now()
    };

    const updateList = (prevList: Habit[]) => {
      if (modalMode === 'CREATE') {
        return [newHabitObj, ...prevList];
      } else {
        return prevList.map(h => h.id === editingHabitId ? {
          ...h,
          name: formName,
          startDate: h.startDate, // Strict lock
          endDate: formEnd || undefined,
          isHardcore: formHardcore // Allow toggling hardcore later? Prompt doesn't forbid it.
        } : h);
      }
    };

    if (isVaultMode) {
      setVaultHabits(updateList);
    } else {
      setHabits(updateList);
    }

    setIsModalOpen(false);
  };

  const initiateDelete = (id: string) => {
    setHabitToDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (habitToDeleteId) {
      if (isVaultMode) {
        setVaultHabits(prev => prev.filter(h => h.id !== habitToDeleteId));
      } else {
        setHabits(prev => prev.filter(h => h.id !== habitToDeleteId));
      }
      setHabitToDeleteId(null);
      setIsDeleteModalOpen(false);
      // If we are in tracker view of the deleted habit, go back
      if (activeHabitId === habitToDeleteId) {
         setScreen('HUB');
         setActiveHabitId(null);
      }
    }
  };

  const handleRestartHabit = (id: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const updater = (prev: Habit[]) => prev.map(h => {
        if (h.id !== id) return h;
        return {
            ...h,
            startDate: today,
            endDate: undefined, // Reset end date on restart
            logs: {} // Clear logs
        };
    });

    if (isVaultMode) setVaultHabits(updater);
    else setHabits(updater);
  };

  const handleToggleLog = (id: string, date: string) => {
    const updater = (prev: Habit[]) => prev.map(h => {
      if (h.id !== id) return h;
      
      const currentLog = h.logs[date];
      const isCompleted = typeof currentLog === 'boolean' ? currentLog : currentLog?.completed;
      
      const newLogs = { ...h.logs };
      
      if (isCompleted) {
          delete newLogs[date];
      } else {
          // Add Timestamp when completing
          newLogs[date] = {
              completed: true,
              timestamp: Date.now()
          };
      }
      return { ...h, logs: newLogs };
    });

    if (isVaultMode) setVaultHabits(updater);
    else setHabits(updater);
  };

  const handleUpdateHabitDirectly = (id: string, updates: Partial<Habit>) => {
    const updater = (prev: Habit[]) => prev.map(h => h.id === id ? { ...h, ...updates } : h);
    if (isVaultMode) setVaultHabits(updater);
    else setHabits(updater);
  };

  // Extension
  const handleRequestExtend = (id: string) => {
    setHabitToExtendId(id);
    setIsExtensionPromptOpen(true);
  };

  const confirmExtension = () => {
    setIsExtensionPromptOpen(false);
    setCalendarTarget('EXTEND');
    setIsCalendarOpen(true);
  };

  // Friends & Groups
  
  // Open Search: Allows finding any username the user types in
  const handleSearchUsers = async (query: string): Promise<string[]> => {
      const lowerQuery = query.toLowerCase().trim();
      if (lowerQuery.length < 2) return [];

      const { supabase } = await import('./services/db');
      const { data, error } = await supabase
         .from('users')
         .select('username')
         .ilike('username', `%${lowerQuery}%`)
         .limit(5);

      if (error || !data) {
         console.error("Search error:", error);
         return [];
      }

      // Return usernames, excluding the current user
      return data.map(u => u.username).filter(u => u !== profile?.username);
  };

  const handleSendFriendRequest = async (username: string) => {
      const { supabase } = await import('./services/db');
      
      // Fetch their real data from Supabase!
      const { data, error } = await supabase
          .from('users')
          .select('app_data')
          .eq('username', username)
          .single();

      if (error || !data) return false;

      const realHabits = data.app_data?.habits || [];

      const newFriend: Friend = {
          id: Date.now().toString(),
          username: username,
          name: username.charAt(0).toUpperCase() + username.slice(1),
          habits: realHabits
      };

      setProfile(prev => prev ? {
          ...prev,
          friends: [...prev.friends, newFriend]
      } : prev);

      return true;
  };

  const handleAcceptFriendRequest = (notificationId: string, fromUser: string) => {
      if (!profile) return;
      
      // Add friend
      const newFriend: Friend = {
          id: Date.now().toString(),
          username: fromUser,
          name: fromUser.charAt(0).toUpperCase() + fromUser.slice(1),
          habits: [
              { id: 'f1', name: 'Meditation', startDate: '2023-01-01', logs: {'2023-01-01': true}, createdAt: 0 },
              { id: 'f2', name: 'Running', startDate: '2023-01-01', logs: {'2023-01-01': true}, createdAt: 0, isHardcore: true }
          ]
      };

      setProfile({
          ...profile,
          friends: [...profile.friends, newFriend],
          notifications: profile.notifications.filter(n => n.id !== notificationId)
      });
  };

  const handleDeclineFriendRequest = (notificationId: string) => {
      if (!profile) return;
      setProfile({
          ...profile,
          notifications: profile.notifications.filter(n => n.id !== notificationId)
      });
  };

  const handleRemoveFriend = (friendId: string) => {
      setProfile(prev => prev ? { ...prev, friends: prev.friends.filter(f => f.id !== friendId) } : null);
  };

  const handleCreateGroup = (name: string, friendIds: string[], endDate?: string) => {
      if (!profile) return;
      
      const adminMember: GroupMember = {
          userId: profile.username, 
          username: profile.username,
          name: profile.name,
          logs: {}
      };

      const friendMembers = friendIds.map(fid => {
          const friend = profile.friends.find(f => f.id === fid);
          if (!friend) return null;
          return {
              userId: friend.username,
              username: friend.username,
              name: friend.name,
              logs: {}
          } as GroupMember;
      }).filter((m): m is GroupMember => m !== null);

      const newGroup: GroupStreak = {
          id: Date.now().toString(),
          name,
          adminId: profile.username,
          startDate: format(new Date(), 'yyyy-MM-dd'),
          endDate,
          members: [adminMember, ...friendMembers],
          createdAt: Date.now()
      };

      setGroupStreaks(prev => [newGroup, ...prev]);
  };

  const handleUpdateGroup = (groupId: string, updates: Partial<GroupStreak>) => {
      setGroupStreaks(prev => prev.map(g => g.id === groupId ? { ...g, ...updates } : g));
  };

  const handleDeleteGroup = (groupId: string) => {
      setGroupStreaks(prev => prev.filter(g => g.id !== groupId));
      if (activeGroupId === groupId) {
          setScreen('FRIENDS');
          setActiveGroupId(null);
      }
  };

  const handleGroupToggleLog = (groupId: string, date: string) => {
      if (!profile) return;
      setGroupStreaks(prev => prev.map(g => {
          if (g.id !== groupId) return g;

          const updatedMembers = g.members.map(m => {
              if (m.username !== profile.username) return m;

              const currentLog = m.logs[date];
              const newLogs = { ...m.logs };
              if (currentLog?.completed) {
                  delete newLogs[date];
              } else {
                  newLogs[date] = { completed: true, timestamp: Date.now() };
              }
              return { ...m, logs: newLogs };
          });
          return { ...g, members: updatedMembers };
      }));
  };

  const handleRemoveGroupMember = (groupId: string, userId: string) => {
      setGroupStreaks(prev => prev.map(g => {
          if (g.id !== groupId) return g;
          return {
              ...g,
              members: g.members.filter(m => m.userId !== userId) // userId here matches username in mock
          };
      }));
  };


  // Calendar
  const openCalendar = (target: 'START' | 'END') => {
    if (target === 'START' && modalMode === 'EDIT') return; 
    setCalendarTarget(target);
    setIsCalendarOpen(true);
  };

  const handleDateSelect = (date: string) => {
    if (calendarTarget === 'START') setFormStart(date);
    if (calendarTarget === 'END') setFormEnd(date);
    if (calendarTarget === 'EXTEND' && habitToExtendId) {
       handleUpdateHabitDirectly(habitToExtendId, { endDate: date });
       setHabitToExtendId(null);
    }
    setIsCalendarOpen(false);
  };

  // Vault Logic
  const openVault = () => {
    if (!vaultPassword) {
      setVaultPasswordMode('CREATE');
      setVaultPasswordInput('');
      setPinLength(4);
      setIsVaultPasswordModalOpen(true);
    } else {
      setVaultPasswordMode('ENTER');
      setVaultPasswordInput('');
      setIsVaultPasswordModalOpen(true);
    }
  };

  const handlePinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const val = e.target.value.replace(/\D/g, '');
    setVaultPasswordInput(val);
  };

  const handleOldPinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setOldPasswordInput(val);
  };

  const handleVaultSubmit = () => {
    if (vaultPasswordMode === 'CREATE') {
       if (vaultPasswordInput.length !== pinLength) {
         alert(`Please enter a ${pinLength}-digit PIN`);
         return;
       }
       storage.saveVaultPassword(vaultPasswordInput);
       setVaultPassword(vaultPasswordInput);
       setIsVaultMode(true);
       setIsVaultPasswordModalOpen(false);
       setIsSettingsOpen(false);
    } else if (vaultPasswordMode === 'ENTER') {
       if (vaultPasswordInput === vaultPassword) {
         setIsVaultMode(true);
         setIsVaultPasswordModalOpen(false);
         setIsSettingsOpen(false);
       } else {
         alert("Incorrect PIN");
       }
    } else if (vaultPasswordMode === 'CHANGE') {
       if (oldPasswordInput === vaultPassword) {
         if (vaultPasswordInput.length < 4) { // Basic check for change
            alert("New PIN too short");
            return;
         }
         storage.saveVaultPassword(vaultPasswordInput);
         setVaultPassword(vaultPasswordInput);
         alert("PIN Updated");
         setIsVaultPasswordModalOpen(false);
         setOldPasswordInput('');
         setVaultPasswordInput('');
       } else {
         alert("Old PIN incorrect");
       }
    }
  };

  // Render Data
  const currentHabits = isVaultMode ? vaultHabits : habits;
  const activeHabit = currentHabits.find(h => h.id === activeHabitId);
  const activeGroup = groupStreaks.find(g => g.id === activeGroupId);
  const isStartDateLocked = modalMode === 'EDIT';

  return (
    <div className={`
      min-h-screen flex justify-center transition-colors duration-500
      ${theme.mode === 'light' ? 'bg-gray-300' : 'bg-black'} 
    `}>
      <div className={`
        w-full max-w-[440px] shadow-2xl min-h-screen relative overflow-hidden transition-colors duration-500
        ${theme.mode === 'light' ? 'bg-[#f0f2f5] text-black' : 'bg-black text-white'}
      `}>
        
        <style>{`
          :root {
            --bg-card: ${theme.mode === 'light' ? '#ffffff' : '#0a0a0a'};
            --bg-card-rgb: ${theme.mode === 'light' ? '255, 255, 255' : '10, 10, 10'};
            --text-card: ${theme.mode === 'light' ? '#000000' : '#ffffff'};
            --border-card: ${theme.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'};
            --bg-inverse: ${theme.mode === 'light' ? '#000000' : '#ffffff'};
            --text-inverse: ${theme.mode === 'light' ? '#ffffff' : '#000000'};
          }
          .text-inverse { color: var(--text-inverse); }
          .bg-inverse { background-color: var(--bg-inverse); }
        `}</style>

        {isVaultMode && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 z-50 pointer-events-none" />
        )}

        {screen === 'LOGIN' && (
            <Login onLogin={handleLogin} />
        )}

        {screen === 'ONBOARDING' && (
          <Onboarding 
            email={profile?.email} 
            initialName={profile?.name} 
            onComplete={handleOnboardingComplete} 
          />
        )}

        {screen === 'HUB' && (
          <>
            <Hub 
              habits={currentHabits}
              profileName={profile?.name}
              isVaultMode={isVaultMode}
              notifications={profile?.notifications || []}
              onExitVault={() => setIsVaultMode(false)}
              onSelectHabit={(id) => { setActiveHabitId(id); setScreen('TRACKER'); }}
              onCreateHabit={openCreateModal}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onDeleteHabit={initiateDelete}
              onEditHabit={openEditModal}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
            />
            {/* Bottom Nav for Analysis / Friends (Only visible on HUB) */}
            <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-center pb-6 pt-10 bg-gradient-to-t from-black/80 to-transparent pointer-events-none max-w-[440px] mx-auto">
                <div className="pointer-events-auto bg-black/80 backdrop-blur-xl border border-white/10 rounded-full p-2 flex gap-4 text-white">
                    <button onClick={() => setScreen('HUB')} className="p-2 rounded-full bg-white/10 text-white flex items-center justify-center">
                        <ICONS.Home size={20} />
                    </button>
                    <button onClick={() => setScreen('ANALYSIS')} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center">
                        <ICONS.Analysis size={20} />
                    </button>
                    <button onClick={() => setScreen('FRIENDS')} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center">
                        <ICONS.Friends size={20} />
                    </button>
                </div>
            </div>
          </>
        )}

        {screen === 'ANALYSIS' && profile && (
            <>
                <Analysis habits={habits} username={profile.username} />
                <div className="fixed bottom-8 left-0 right-0 z-20 flex justify-center pointer-events-none max-w-[440px] mx-auto">
                    <Button variant="secondary" onClick={() => setScreen('HUB')} className="pointer-events-auto shadow-2xl rounded-full px-6">Back to Hub</Button>
                </div>
            </>
        )}

        {screen === 'FRIENDS' && profile && (
            <>
                <Friends 
                    friends={profile.friends} 
                    groups={groupStreaks}
                    onSearchUsers={handleSearchUsers}
                    onSendRequest={handleSendFriendRequest}
                    onRemoveFriend={handleRemoveFriend}
                    onCreateGroup={handleCreateGroup}
                    onSelectGroup={(g) => { setActiveGroupId(g.id); setScreen('GROUP_TRACKER'); }}
                />
                <div className="fixed bottom-8 left-0 right-0 z-20 flex justify-center pointer-events-none max-w-[440px] mx-auto">
                    <Button variant="secondary" onClick={() => setScreen('HUB')} className="pointer-events-auto shadow-2xl rounded-full px-6">Back to Hub</Button>
                </div>
            </>
        )}

        {screen === 'TRACKER' && activeHabit && (
          <Tracker 
            habit={activeHabit}
            onBack={() => setScreen('HUB')}
            onToggleLog={handleToggleLog}
            onRequestExtend={handleRequestExtend}
            onRestart={handleRestartHabit}
            onDelete={initiateDelete}
          />
        )}

        {screen === 'GROUP_TRACKER' && activeGroup && profile && (
            <GroupTracker 
                group={activeGroup}
                currentUserUsername={profile.username}
                onBack={() => setScreen('FRIENDS')}
                onToggleLog={handleGroupToggleLog}
                onUpdateGroup={handleUpdateGroup}
                onDeleteGroup={handleDeleteGroup}
                onRemoveMember={handleRemoveGroupMember}
            />
        )}

        {/* Universal Create/Edit Modal */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title={modalMode === 'CREATE' ? "New Streak" : "Edit Streak"}
        >
          <div className="flex flex-col gap-6">
            <Input 
              label="Streak Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Morning Run"
              autoFocus
            />
            
            <Input 
               label="Start Date"
               value={formStart ? format(parseLocalDate(formStart), 'MMM d, yyyy') : ''}
               readOnly
               icon={ICONS.Calendar}
               onClick={() => openCalendar('START')}
               className={isStartDateLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
               disabled={isStartDateLocked}
             />

            <Input 
              label="End Date (Optional)"
              value={formEnd ? format(parseLocalDate(formEnd), 'MMM d, yyyy') : ''}
              readOnly
              placeholder="No End Date"
              icon={ICONS.Calendar}
              onClick={() => openCalendar('END')}
              className="cursor-pointer"
            />
            
            <div className="py-2 border-t border-current/10">
              <Toggle 
                label="Hardcore Mode" 
                checked={formHardcore} 
                onChange={setFormHardcore}
                description="Miss a day, lose the streak. No excuses."
              />
            </div>

            <Button onClick={handleSaveHabit} disabled={!formName}>
              {modalMode === 'CREATE' ? 'Start Tracking' : 'Save Changes'}
            </Button>
          </div>
        </Modal>

        {/* Settings Modal */}
        <Modal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          title="Settings"
        >
          <div className="flex flex-col gap-6 pt-2">
             <div className="flex flex-col items-center pb-6 border-b border-current border-opacity-10">
                <div className="w-16 h-16 rounded-full bg-current opacity-10 flex items-center justify-center mb-4 text-inherit">
                  <span className="text-2xl font-bold opacity-100">{profile?.name.charAt(0)}</span>
                </div>
                <h3 className="text-xl font-medium">{profile?.name}</h3>
                <p className="text-sm opacity-50">@{profile?.username}</p>
             </div>

             <div className="flex justify-between items-center px-2">
                <span className="font-medium">Appearance</span>
                <button 
                  onClick={() => setTheme(prev => ({ mode: prev.mode === 'dark' ? 'light' : 'dark' }))}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-current/5 border border-current/10 hover:bg-current/10 transition-colors"
                >
                  {theme.mode === 'dark' ? <ICONS.Moon size={16} /> : <ICONS.Sun size={16} />}
                  <span className="text-sm capitalize">{theme.mode} Mode</span>
                </button>
             </div>

             <div className="flex justify-between items-center px-2">
                <span className="font-medium">Hidden Vault</span>
                {isVaultMode ? (
                    <span className="text-sm opacity-50 italic">Already inside hidden vault</span>
                ) : (
                    <button 
                    onClick={openVault}
                    className="px-4 py-2 text-sm rounded-full bg-current/5 border border-current/10 hover:bg-current/10"
                    >
                    Access
                    </button>
                )}
             </div>

             {vaultPassword && (
                <div className="px-2">
                    <button 
                        onClick={() => { setVaultPasswordMode('CHANGE'); setVaultPasswordInput(''); setOldPasswordInput(''); setIsVaultPasswordModalOpen(true); }}
                        className="text-xs text-current opacity-40 hover:opacity-100 underline"
                    >
                        Change Vault PIN
                    </button>
                </div>
             )}

             {/* Footer Actions */}
             <div className="pt-4 border-t border-current/10 flex flex-col gap-2">
                <button 
                    onClick={() => { setIsSettingsOpen(false); setIsNotificationsOpen(true); }}
                    className="w-full py-3 flex items-center justify-center gap-2 text-current opacity-60 hover:opacity-100 hover:bg-current/5 rounded-xl transition-colors"
                >
                    <div className="relative">
                        <ICONS.Bell size={18} />
                        {profile?.notifications && profile.notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                    </div>
                    <span className="font-medium">Notifications</span>
                </button>

                <button 
                    onClick={() => setIsAboutOpen(true)}
                    className="w-full py-3 flex items-center justify-center gap-2 text-current opacity-60 hover:opacity-100 hover:bg-current/5 rounded-xl transition-colors"
                >
                    <ICONS.Info size={18} />
                    <span className="font-medium">About Us</span>
                </button>

                <button 
                    onClick={handleLogout}
                    className="w-full py-3 flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                    <ICONS.LogOut size={18} />
                    <span className="font-medium">Log Out</span>
                </button>
             </div>

             <div className="text-center mt-2">
                <p className="text-[10px] opacity-30 uppercase tracking-widest">Version 2.1.0</p>
             </div>
          </div>
        </Modal>

        {/* Notifications Modal - Moved from Hub.tsx */}
        <Modal
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            title="Notifications"
        >
            <div className="flex flex-col gap-2 min-h-[200px] max-h-[400px] overflow-y-auto">
                {(!profile?.notifications || profile.notifications.length === 0) ? (
                    <div className="flex flex-col items-center justify-center flex-1 opacity-40 py-8">
                        <ICONS.Bell size={32} className="mb-2 opacity-50" />
                        <p className="text-sm">No new notifications</p>
                    </div>
                ) : (
                    profile.notifications.map(notif => (
                        <div key={notif.id} className="p-4 bg-current/5 rounded-xl border border-current/10 animate-slide-up">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                    {notif.fromUser.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">@{notif.fromUser}</p>
                                    <p className="text-[10px] opacity-60">wants to add you as a friend</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="primary" 
                                    className="flex-1 py-2 text-xs h-8" 
                                    onClick={() => handleAcceptFriendRequest(notif.id, notif.fromUser)}
                                >
                                    Accept
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    className="flex-1 py-2 text-xs h-8"
                                    onClick={() => handleDeclineFriendRequest(notif.id)}
                                >
                                    Decline
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Modal>

        {/* About Us Modal */}
        <Modal
           isOpen={isAboutOpen}
           onClose={() => setIsAboutOpen(false)}
           title="About Us"
        >
           <div className="flex flex-col gap-6 text-center py-4">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full mx-auto flex items-center justify-center shadow-xl">
                  <span className="text-3xl font-bold text-white">P</span>
              </div>
              
              <div className="space-y-2">
                  <h3 className="text-xl font-medium">NoZero</h3>
                  <p className="text-sm opacity-70 leading-relaxed">
                      This application was completely developed by <span className="font-bold text-current">Pratyush</span>.
                  </p>
              </div>

              <div className="pt-6 border-t border-current/10 flex flex-col gap-2">
                  <p className="text-xs font-medium text-pink-500 animate-pulse">With love from Pratyush</p>
                  <p className="text-[10px] opacity-30 uppercase tracking-widest mt-2">
                      © {new Date().getFullYear()} NoZero. All rights reserved.
                  </p>
              </div>
           </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
           isOpen={isDeleteModalOpen}
           onClose={() => setIsDeleteModalOpen(false)}
           title="Warning"
        >
           <div className="flex flex-col gap-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                 <p className="text-sm text-red-400 leading-relaxed text-center">
                    Your streak will be <b>permanently deleted</b> and all progress will be lost. This action cannot be undone.
                 </p>
              </div>
              <div className="flex gap-3 mt-4">
                 <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                 <Button variant="danger" fullWidth onClick={confirmDelete}>Delete Streak</Button>
              </div>
           </div>
        </Modal>

        {/* Vault Password Modal */}
        <Modal
            isOpen={isVaultPasswordModalOpen}
            onClose={() => setIsVaultPasswordModalOpen(false)}
            title={
                vaultPasswordMode === 'CREATE' ? 'Set Vault PIN' : 
                vaultPasswordMode === 'CHANGE' ? 'Change PIN' : 
                'Enter PIN'
            }
        >
            <div className="flex flex-col gap-4">
                {vaultPasswordMode === 'CREATE' && (
                    <div className="flex justify-center gap-4 mb-2">
                        <button 
                           onClick={() => setPinLength(4)}
                           className={`px-4 py-2 rounded-full text-sm transition-all ${pinLength === 4 ? 'bg-inverse text-inverse' : 'bg-current/5 opacity-50'}`}
                        >
                            4-Digit PIN
                        </button>
                        <button 
                           onClick={() => setPinLength(6)}
                           className={`px-4 py-2 rounded-full text-sm transition-all ${pinLength === 6 ? 'bg-inverse text-inverse' : 'bg-current/5 opacity-50'}`}
                        >
                            6-Digit PIN
                        </button>
                    </div>
                )}

                {vaultPasswordMode === 'CHANGE' && (
                    <Input 
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Old PIN"
                        value={oldPasswordInput}
                        onChange={handleOldPinInput}
                    />
                )}
                <Input 
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={
                        vaultPasswordMode === 'CHANGE' ? "New PIN" : 
                        vaultPasswordMode === 'CREATE' ? `Enter ${pinLength}-digit PIN` : 
                        "Enter PIN"
                    }
                    value={vaultPasswordInput}
                    onChange={handlePinInput}
                    autoFocus
                    maxLength={vaultPasswordMode === 'CREATE' ? pinLength : undefined}
                />
                <Button fullWidth onClick={handleVaultSubmit}>
                    {vaultPasswordMode === 'CREATE' ? 'Create Vault' : 'Unlock'}
                </Button>
            </div>
        </Modal>

        {/* Extension Prompt Modal */}
        <Modal
           isOpen={isExtensionPromptOpen}
           onClose={() => setIsExtensionPromptOpen(false)}
           title="Extend Streak?"
        >
           <div className="flex flex-col gap-4">
              <p className="text-sm opacity-70 leading-relaxed text-current">
                 You have reached the end of your scheduled timeline. Would you like to extend the end date for this streak?
              </p>
              <div className="flex gap-3 mt-4">
                 <Button variant="ghost" onClick={() => setIsExtensionPromptOpen(false)}>No</Button>
                 <Button fullWidth onClick={confirmExtension}>Yes, Extend</Button>
              </div>
           </div>
        </Modal>

        {/* Global Calendar Modal */}
        <CalendarModal 
           isOpen={isCalendarOpen}
           onClose={() => setIsCalendarOpen(false)}
           selectedDate={
             calendarTarget === 'START' ? formStart : 
             calendarTarget === 'END' ? formEnd : 
             calendarTarget === 'EXTEND' && habitToExtendId ? (currentHabits.find(h => h.id === habitToExtendId)?.endDate || format(new Date(), 'yyyy-MM-dd')) :
             format(new Date(), 'yyyy-MM-dd')
           }
           onSelectDate={handleDateSelect}
           title={
              calendarTarget === 'START' ? 'Select Start Date' :
              calendarTarget === 'END' ? 'Select End Date' :
              'Extend Streak To'
           }
           minDate={calendarTarget === 'END' || calendarTarget === 'EXTEND' ? formStart : undefined}
        />

      </div>
    </div>
  );
};

export default App;