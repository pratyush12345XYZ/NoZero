import React, { useState, useEffect } from 'react';
import type { Friend, GroupStreak } from '../types';
import { ICONS } from '../constants';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { CalendarModal } from '../components/CalendarModal';
import { format } from 'date-fns';
import { Flame, Medal, Hand as NudgeIcon, Trophy } from 'lucide-react';

interface FriendsProps {
  friends: Friend[];
  groups: GroupStreak[];
  onSearchUsers: (query: string) => Promise<string[]>;
  onSendRequest: (username: string) => Promise<boolean>;
  onRemoveFriend: (friendId: string) => void;
  onCreateGroup: (name: string, members: string[], endDate?: string) => void;
  onSelectGroup: (group: GroupStreak) => void;
}

export const Friends: React.FC<FriendsProps> = ({ 
    friends, 
    groups,
    onSearchUsers,
    onSendRequest,
    onRemoveFriend,
    onCreateGroup,
    onSelectGroup
}) => {
  const [activeTab, setActiveTab] = useState<'FRIENDS' | 'LEADERBOARD' | 'GROUPS'>('FRIENDS');
  
  const [search, setSearch] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]); 
  const [groupEndDate, setGroupEndDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSearch = async () => {
    if (!search) return;
    setIsSearchLoading(true);
    setSearchResults([]);
    setFeedback(null);
    const results = await onSearchUsers(search);
    setIsSearchLoading(false);
    setSearchResults(results);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 400); 
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const showToast = (message: string, type: 'success'|'error') => {
      setFeedback({ message, type });
      setTimeout(() => setFeedback(null), 3500);
  };

  const handleSendRequestAction = async (username: string) => {
      if (friends.some(f => f.username === username)) return showToast(`@${username} is already your friend`, 'error');
      if (sentRequests.includes(username)) return showToast('Friend request already sent', 'error');
      await onSendRequest(username);
      setSentRequests(prev => [...prev, username]);
      showToast(`Request sent to @${username}! 🚀`, 'success');
  };

  const handleNudge = (e: React.MouseEvent, friendName: string) => {
      e.stopPropagation();
      showToast(`You nudged ${friendName}! 👋`, 'success');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onRemoveFriend(id); 
  };

  const toggleMemberSelection = (friendId: string) => {
      if (selectedMembers.includes(friendId)) {
          setSelectedMembers(prev => prev.filter(id => id !== friendId));
      } else {
          if (selectedMembers.length >= 20) return;
          setSelectedMembers(prev => [...prev, friendId]);
      }
  };

  const handleCreateGroupSubmit = () => {
      if (!groupName) return;
      onCreateGroup(groupName, selectedMembers, groupEndDate || undefined);
      setIsCreateGroupOpen(false);
      setGroupName('');
      setSelectedMembers([]);
      setGroupEndDate('');
  };

  const sortedFriends = [...friends].sort((a, b) => (b.habits?.length || 0) - (a.habits?.length || 0));

  return (
    <div className="min-h-screen pt-24 px-6 pb-32 animate-fade-in text-inherit bg-black relative">
      
      {/* Decorative Gradient Blob */}
      <div className="absolute top-10 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-72 h-72 bg-fuchsia-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Segmented Control Tabs */}
      <div className="flex p-1.5 bg-white/5 rounded-full mb-8 backdrop-blur-xl border border-white/10 relative z-10 shadow-2xl">
          {['FRIENDS', 'LEADERBOARD', 'GROUPS'].map(t => (
             <button 
               key={t}
               onClick={() => setActiveTab(t as any)}
               className={`
                 flex-1 py-3 text-[10px] sm:text-xs font-bold tracking-widest uppercase rounded-full transition-all duration-300
                 ${activeTab === t ? 'bg-white text-black shadow-lg scale-100' : 'text-white/40 hover:text-white hover:bg-white/5'}
               `}
             >
               {t}
             </button>
          ))}
      </div>

      {feedback && (
          <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-sm font-medium backdrop-blur-xl border shadow-2xl animate-slide-up ${feedback.type === 'error' ? 'bg-red-500/20 text-red-200 border-red-500/30' : 'bg-green-500/20 text-green-200 border-green-500/30'}`}>
              {feedback.message}
          </div>
      )}

      {/* FRIENDS TAB */}
      {activeTab === 'FRIENDS' && (
          <div className="animate-slide-up relative z-10">
            <div className="flex gap-2 mb-8 relative">
                <Input 
                    placeholder="Search by username..." 
                    value={search} 
                    onChange={(e) => { setSearch(e.target.value); setSearchResults([]); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-white/5 backdrop-blur border-white/10 focus:border-indigo-500/50"
                />
                <button 
                    onClick={handleSearch} 
                    disabled={!search || isSearchLoading} 
                    className="w-[50px] shrink-0 flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-50 shadow-lg"
                >
                    {isSearchLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ICONS.Search size={22} className="text-white" />}
                </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="mb-10 flex flex-col gap-3">
                    <h3 className="text-xs opacity-40 uppercase tracking-widest ml-2 mb-1">Search Results</h3>
                    {searchResults.map(username => (
                        <div key={username} className="p-4 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between animate-fade-in backdrop-blur-sm shadow-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full border border-white/20 bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center shadow-inner">
                                    <span className="text-lg font-bold opacity-80 uppercase">{username.charAt(0)}</span>
                                </div>
                                <span className="text-sm font-semibold tracking-wide">@{username}</span>
                            </div>
                            <button 
                                onClick={() => handleSendRequestAction(username)}
                                className={`
                                    px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all
                                    ${sentRequests.includes(username) ? 'bg-white/10 text-white/40 cursor-default' : 'bg-white text-black hover:scale-105 active:scale-95 shadow-lg'}
                                `}
                            >
                                {sentRequests.includes(username) ? 'Sent' : 'Add'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Friends List */}
            <div className="flex flex-col gap-4">
                <h3 className="text-xs opacity-40 uppercase tracking-widest ml-2 mb-1">Your Friends</h3>
                {friends.length === 0 ? (
                    <div className="text-center opacity-30 py-10 border border-dashed border-white/20 rounded-3xl">
                        <p>No friends added yet.</p>
                        <p className="text-xs mt-2">Search above to find your squad!</p>
                    </div>
                ) : (
                    friends.map((friend, i) => (
                        <div 
                            key={friend.id}
                            onClick={() => setSelectedFriend(friend)}
                            className="p-4 sm:p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-between cursor-pointer group shadow-lg backdrop-blur-md hover:scale-[1.02] transition-all duration-300"
                            style={{ animationDelay: `${i * 0.05}s` }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500 blur-md opacity-40 rounded-full group-hover:opacity-70 transition-opacity" />
                                    <div className="w-12 h-12 relative rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl border border-white/20 shadow-inner">
                                        {friend.name.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{friend.name}</h3>
                                    <p className="text-[10px] sm:text-xs opacity-50 tracking-wide">@{friend.username}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => handleNudge(e, friend.name)} 
                                  className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:scale-110 active:scale-95 transition-all" 
                                  title="Send a Nudge"
                                >
                                    <NudgeIcon size={18} />
                                </button>
                                <button 
                                  onClick={(e) => handleDelete(e, friend.id)} 
                                  className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:scale-110 active:scale-95 transition-all" 
                                  title="Remove Friend"
                                >
                                    <ICONS.RemoveFriend size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>
      )}

      {/* LEADERBOARD TAB */}
      {activeTab === 'LEADERBOARD' && (
          <div className="animate-slide-up relative z-10">
              <div className="text-center mb-10">
                  <Trophy size={48} className="mx-auto text-yellow-500 mb-4 opacity-80" />
                  <h2 className="text-2xl font-light">Global Rankings</h2>
                  <p className="text-xs opacity-50 mt-2">Ranked by total active habits</p>
              </div>

              <div className="flex flex-col gap-3">
                  {sortedFriends.length === 0 ? (
                      <div className="text-center opacity-30 py-10 border border-dashed border-white/20 rounded-3xl">
                          <p>Not enough data for leaderboard.</p>
                      </div>
                  ) : (
                      sortedFriends.map((f, index) => {
                          const isTop3 = index < 3;
                          const medalColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
                          
                          return (
                              <div key={f.id} className={`flex items-center justify-between p-5 rounded-3xl border transition-all duration-500 hover:scale-[1.02] cursor-pointer ${index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30' : 'bg-white/5 border-white/5'}`}>
                                  <div className="flex items-center gap-5">
                                      <div className="w-8 flex items-center justify-center font-bold text-lg opacity-80">
                                          {isTop3 ? <Medal className={medalColors[index]} size={24} /> : <span className="opacity-40">{index + 1}</span>}
                                      </div>
                                      <div className="w-10 h-10 rounded-full border border-white/20 bg-gray-800 flex items-center justify-center font-bold shadow-inner">
                                          {f.name.charAt(0)}
                                      </div>
                                      <div>
                                          <h3 className={`font-semibold ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>{f.name}</h3>
                                          <p className="text-[10px] opacity-40 uppercase tracking-wider">{f.habits?.length || 0} Streaks</p>
                                      </div>
                                  </div>
                                  {index === 0 && <Flame className="text-orange-500 animate-pulse" size={20} />}
                              </div>
                          );
                      })
                  )}
              </div>
          </div>
      )}

      {/* GROUPS TAB */}
      {activeTab === 'GROUPS' && (
          <div className="animate-slide-up relative z-10">
              <Button onClick={() => setIsCreateGroupOpen(true)} className="w-full mb-8 flex items-center justify-center gap-3 py-4 !bg-emerald-600 hover:!bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/50">
                  <ICONS.Plus size={20} /> <span className="font-semibold tracking-wide">START GROUP STREAK</span>
              </Button>

              <div className="flex flex-col gap-5">
                  {groups.length === 0 ? (
                      <div className="text-center opacity-30 py-12 border border-dashed border-white/20 rounded-3xl">
                          <p>No active group streaks.</p>
                          <p className="text-xs mt-2">Challenge your friends and conquer together!</p>
                      </div>
                  ) : (
                      groups.map(group => (
                          <div
                            key={group.id}
                            onClick={() => onSelectGroup(group)}
                            className="p-6 rounded-[32px] bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-white/30 transition-all cursor-pointer group shadow-2xl backdrop-blur-sm relative overflow-hidden"
                          >
                             {/* Accents */}
                             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full group-hover:bg-indigo-500/20 transition-colors" />

                             <div className="flex justify-between items-start mb-6 relative z-10">
                                 <div>
                                     <h3 className="text-xl font-bold flex items-center gap-3 mb-1">
                                         {group.name}
                                         <Trophy size={16} className="text-yellow-500" />
                                     </h3>
                                     <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase tracking-widest font-semibold opacity-80">
                                         {group.members.length} Squad Members
                                     </span>
                                 </div>
                                 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors border border-white/10">
                                    <ICONS.Back className="rotate-180 opacity-60" size={16} />
                                 </div>
                             </div>
                             
                             <div className="flex -space-x-3 relative z-10">
                                 {group.members.slice(0, 5).map(m => (
                                     <div key={m.userId} className="w-10 h-10 rounded-full border-2 border-black bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-xs text-white font-bold shadow-lg transition-transform hover:-translate-y-2 hover:z-20 cursor-help" title={m.name}>
                                         {m.name.charAt(0).toUpperCase()}
                                     </div>
                                 ))}
                                 {group.members.length > 5 && (
                                     <div className="w-10 h-10 rounded-full border-2 border-black bg-indigo-900 flex items-center justify-center text-[10px] text-indigo-300 font-bold shadow-lg">
                                         +{group.members.length - 5}
                                     </div>
                                 )}
                             </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* Friend View Modal */}
      <Modal isOpen={!!selectedFriend} onClose={() => setSelectedFriend(null)} title="Player Stats">
          <div className="flex flex-col gap-6 relative overflow-hidden rounded-xl">
             <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-600/40 to-fuchsia-600/40 blur-3xl -z-10" />
             <div className="flex flex-col items-center pb-6 border-b border-white/10 mt-4">
                 <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-black bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl mb-3 shadow-2xl z-10 relative">
                        {selectedFriend?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center border border-white/10">
                        <Flame size={14} className="text-orange-500" />
                    </div>
                 </div>
                 <h3 className="text-2xl font-bold tracking-tight">{selectedFriend?.name}</h3>
                 <p className="text-xs opacity-50 tracking-widest uppercase mt-1">@{selectedFriend?.username}</p>
             </div>
             
             <div className="grid grid-cols-2 gap-4 text-center">
                 <div className="p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                    <span className="block text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">{selectedFriend?.habits?.length || 0}</span>
                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-2 block">Active Streaks</span>
                 </div>
                 <div className="p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                    <span className="block text-4xl font-bold opacity-30">--</span>
                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-2 block">Mastery Pts</span>
                 </div>
             </div>
             
             <Button onClick={() => { showToast(`Nudged ${selectedFriend?.name}!`, 'success'); setSelectedFriend(null); }} className="w-full mt-4 flex items-center justify-center gap-2 !bg-white !text-black hover:scale-[1.02]">
                <NudgeIcon size={18} /> Give a Nudge
             </Button>
          </div>
      </Modal>

      {/* Create Group Modal */}
      <Modal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} title="New Squad">
          <div className="flex flex-col gap-6">
              <Input label="Squad Name" placeholder="e.g. 75 Hard Challenge" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
              <Input label="Doomsday (End Date)" value={groupEndDate} readOnly icon={ICONS.Calendar} placeholder="Forever (No End Date)" onClick={() => setIsCalendarOpen(true)} className="cursor-pointer" />

              <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold opacity-50 uppercase tracking-widest ml-1">Draft Members ({selectedMembers.length}/20)</label>
                  <div className="max-h-60 overflow-y-auto border border-white/10 rounded-[24px] p-2 bg-black/50 shadow-inner">
                      {friends.length === 0 ? (
                          <p className="text-center text-xs opacity-40 py-8">No friends available to draft.</p>
                      ) : (
                          friends.map(friend => (
                              <div 
                                key={friend.id} 
                                onClick={() => toggleMemberSelection(friend.id)}
                                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-300 ${selectedMembers.includes(friend.id) ? 'bg-indigo-600 shadow-lg scale-[1.02]' : 'hover:bg-white/10'}`}
                              >
                                  <div className="flex items-center gap-4">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border ${selectedMembers.includes(friend.id) ? 'bg-indigo-700 border-indigo-400 text-white' : 'bg-white/10 border-white/10 text-white/80'}`}>
                                          {friend.name.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-sm font-medium">{friend.name}</span>
                                  </div>
                                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${selectedMembers.includes(friend.id) ? 'border-white bg-white text-indigo-600' : 'border-white/20'}`}>
                                      {selectedMembers.includes(friend.id) && <ICONS.Check size={14} strokeWidth={3} />}
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>

              <Button onClick={handleCreateGroupSubmit} disabled={!groupName} className="mt-2 py-4">Establish Squad</Button>
          </div>
      </Modal>

      <CalendarModal
        isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)}
        selectedDate={groupEndDate || format(new Date(), 'yyyy-MM-dd')}
        onSelectDate={(d) => { setGroupEndDate(d); setIsCalendarOpen(false); }}
        title="Squad Deadline" minDate={format(new Date(), 'yyyy-MM-dd')}
      />
    </div>
  );
};