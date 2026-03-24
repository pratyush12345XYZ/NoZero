import React, { useMemo, useState } from 'react';
import type { GroupStreak, LogDetail } from '../types';
import { ICONS } from '../constants';
import { Button } from '../components/Button';
import { format } from 'date-fns';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { CalendarModal } from '../components/CalendarModal';

interface GroupTrackerProps {
  group: GroupStreak;
  currentUserUsername: string;
  onBack: () => void;
  onToggleLog: (groupId: string, date: string) => void;
  onUpdateGroup: (groupId: string, updates: Partial<GroupStreak>) => void;
  onDeleteGroup: (groupId: string) => void;
  onRemoveMember: (groupId: string, userId: string) => void;
}

export const GroupTracker: React.FC<GroupTrackerProps> = ({
  group,
  currentUserUsername,
  onBack,
  onToggleLog,
  onUpdateGroup,
  onDeleteGroup,
  onRemoveMember
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [editEndDate, setEditEndDate] = useState(group.endDate || '');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const isAdmin = group.adminId === currentUserUsername;
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Stats Calculation
  const memberStats = useMemo(() => {
    return group.members.map(member => {
        const completions = Object.values(member.logs).filter((l: LogDetail) => l.completed).length;
        // Check if done today
        const doneToday = !!member.logs[todayStr]?.completed;
        return {
            ...member,
            completions,
            doneToday
        };
    }).sort((a, b) => b.completions - a.completions);
  }, [group, todayStr]);

  const topPlayers = memberStats.slice(0, 3);
  const maxScore = topPlayers[0]?.completions || 1; // Avoid divide by zero

  const currentUserStat = memberStats.find(m => m.username === currentUserUsername);

  const handleSaveSettings = () => {
    onUpdateGroup(group.id, {
        name: editName,
        endDate: editEndDate
    });
    setIsSettingsOpen(false);
  };

  const handleAdminDelete = () => {
      if (window.confirm("Delete this group streak? This cannot be undone.")) {
          onDeleteGroup(group.id);
      }
  };

  const handleKick = (userId: string) => {
      if (window.confirm("Remove this member?")) {
          onRemoveMember(group.id, userId);
      }
  }

  return (
    <div className="min-h-screen text-inherit animate-fade-in pb-10 flex flex-col">
       {/* Header */}
       <header 
        className="fixed top-0 left-0 right-0 z-20 flex justify-between items-center p-6 backdrop-blur-xl max-w-[440px] mx-auto border-b border-current/5"
        style={{ backgroundColor: 'rgba(var(--bg-card-rgb), 0.8)' }}
      >
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-current/10 transition-colors text-current">
          <ICONS.Back className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-semibold text-lg text-current">{group.name}</span>
          <span className="text-[10px] opacity-50 uppercase tracking-widest">{group.members.length} Members</span>
        </div>
        
        {isAdmin ? (
            <button 
                onClick={() => {
                    setEditName(group.name);
                    setEditEndDate(group.endDate || '');
                    setIsSettingsOpen(true);
                }}
                className="p-2 -mr-2 rounded-full hover:bg-current/10 transition-colors text-current"
            >
                <ICONS.Settings className="w-5 h-5" />
            </button>
        ) : <div className="w-9" />}
      </header>

      <div className="pt-28 px-6 flex-1 flex flex-col">
        
        {/* Today's Action */}
        <div className="mb-8 flex flex-col items-center animate-slide-up">
            <button
                onClick={() => onToggleLog(group.id, todayStr)}
                className={`
                    w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl
                    ${currentUserStat?.doneToday 
                        ? 'bg-inverse text-inverse scale-100' 
                        : 'bg-current/5 border border-current/10 hover:bg-current/10 text-current opacity-60 hover:opacity-100 hover:scale-105'}
                `}
            >
                {currentUserStat?.doneToday ? (
                    <ICONS.Check size={40} strokeWidth={3} />
                ) : (
                    <span className="text-xs font-bold uppercase tracking-widest">Check In</span>
                )}
            </button>
            <p className="mt-4 text-sm opacity-50 uppercase tracking-widest">
                {currentUserStat?.doneToday ? 'Completed Today' : 'Tap to Complete'}
            </p>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-sm opacity-50 uppercase tracking-widest mb-4">Members</h3>
            <div className="flex flex-col gap-3">
                {memberStats.map((member) => (
                    <div key={member.userId} className="p-4 bg-current/5 rounded-2xl flex items-center justify-between border border-current/5">
                        <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                 {member.name.charAt(0)}
                             </div>
                             <div className="flex flex-col">
                                 <div className="flex items-center gap-2">
                                     <span className="font-medium text-sm">{member.name}</span>
                                     {member.username === group.adminId && <ICONS.Crown size={12} className="text-yellow-500" />}
                                 </div>
                                 <span className="text-[10px] opacity-40">@{member.username}</span>
                             </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-lg">{member.completions}</span>
                            {isAdmin && member.username !== currentUserUsername && (
                                <button onClick={() => handleKick(member.userId)} className="text-red-500 opacity-50 hover:opacity-100">
                                    <ICONS.Close size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Top 3 Bar Graph */}
        <div className="mt-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
             <h3 className="text-sm opacity-50 uppercase tracking-widest mb-6 text-center flex items-center justify-center gap-2">
                 <ICONS.Trophy size={14} /> Leaderboard
             </h3>
             <div className="flex justify-center items-end h-40 gap-4 sm:gap-8 pb-4 border-b border-current/10">
                 {/* 2nd Place */}
                 {topPlayers[1] && (
                     <div className="flex flex-col items-center gap-2 w-16 group">
                         <span className="text-xs font-bold">{topPlayers[1].completions}</span>
                         <div 
                            className="w-full bg-current/10 rounded-t-xl transition-all duration-1000 group-hover:bg-current/20 relative overflow-hidden"
                            style={{ height: `${(topPlayers[1].completions / maxScore) * 80}px`, minHeight: '20px' }}
                         >
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-current/20" />
                         </div>
                         <div className="text-center">
                            <div className="w-6 h-6 mx-auto rounded-full bg-gray-400 text-white text-[10px] flex items-center justify-center font-bold mb-1">2</div>
                            <span className="text-[10px] opacity-60 truncate w-16 block">{topPlayers[1].name}</span>
                         </div>
                     </div>
                 )}

                 {/* 1st Place */}
                 {topPlayers[0] && (
                     <div className="flex flex-col items-center gap-2 w-16 group">
                         <ICONS.Crown size={20} className="text-yellow-500 mb-1 animate-bounce" />
                         <span className="text-sm font-bold">{topPlayers[0].completions}</span>
                         <div 
                            className="w-full bg-gradient-to-t from-yellow-500/20 to-yellow-500/50 rounded-t-xl transition-all duration-1000 group-hover:from-yellow-500/30 group-hover:to-yellow-500/60 relative overflow-hidden"
                            style={{ height: `${(topPlayers[0].completions / maxScore) * 120}px`, minHeight: '40px' }}
                         >
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500/50" />
                         </div>
                         <div className="text-center">
                            <div className="w-8 h-8 mx-auto rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center font-bold mb-1 shadow-lg shadow-yellow-500/20">1</div>
                            <span className="text-[10px] font-bold truncate w-16 block">{topPlayers[0].name}</span>
                         </div>
                     </div>
                 )}

                 {/* 3rd Place */}
                 {topPlayers[2] && (
                     <div className="flex flex-col items-center gap-2 w-16 group">
                         <span className="text-xs font-bold">{topPlayers[2].completions}</span>
                         <div 
                            className="w-full bg-current/10 rounded-t-xl transition-all duration-1000 group-hover:bg-current/20 relative overflow-hidden"
                            style={{ height: `${(topPlayers[2].completions / maxScore) * 60}px`, minHeight: '15px' }}
                         >
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-current/20" />
                         </div>
                         <div className="text-center">
                            <div className="w-6 h-6 mx-auto rounded-full bg-orange-700 text-white text-[10px] flex items-center justify-center font-bold mb-1">3</div>
                            <span className="text-[10px] opacity-60 truncate w-16 block">{topPlayers[2].name}</span>
                         </div>
                     </div>
                 )}
             </div>
        </div>

      </div>

      {/* Admin Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Group Settings"
      >
          <div className="flex flex-col gap-6">
              {isAdmin ? (
                  <>
                    <Input 
                        label="Group Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                    />
                    <Input 
                        label="End Date"
                        value={editEndDate}
                        readOnly
                        icon={ICONS.Calendar}
                        onClick={() => setIsCalendarOpen(true)}
                        placeholder="Optional"
                    />
                    <div className="flex flex-col gap-3 pt-4">
                        <Button onClick={handleSaveSettings}>Save Changes</Button>
                        <Button variant="danger" onClick={handleAdminDelete}>Delete Group</Button>
                    </div>
                  </>
              ) : (
                  <div className="text-center py-6 opacity-60">
                      <p>Only the admin can edit group settings.</p>
                  </div>
              )}
          </div>
      </Modal>

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={editEndDate}
        onSelectDate={(d) => { setEditEndDate(d); setIsCalendarOpen(false); }}
        title="End Date"
        minDate={todayStr}
      />
    </div>
  );
};