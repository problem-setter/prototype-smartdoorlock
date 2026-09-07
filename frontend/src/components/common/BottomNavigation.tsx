import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context';
import { 
  Layers, 
  UserCheck, 
  DoorClosed
} from 'lucide-react';

interface BottomNavigationProps {
  currentTab: 'rooms' | 'users';
  setCurrentTab: (tab: 'rooms' | 'users') => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  setCurrentTab,
}) => {
  const { currentUser, selectedRoomId, setSelectedRoomId, rooms } = useApp();

  if (!currentUser) return null;

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 p-2 sm:p-3 pointer-events-none safe-pb">
      <div className="mx-auto max-w-md w-full pointer-events-auto px-2 sm:px-0">
        <div className="rounded-2xl bg-[#080c14]/90 border border-white/10 shadow-2xl backdrop-blur-xl p-1.5 flex items-center justify-around gap-1 relative">
          
          {/* 1. Tab: Daftar Ruangan */}
          <button
            onClick={() => {
              setSelectedRoomId(null);
              setCurrentTab('rooms');
            }}
            className={`relative flex-1 py-2 sm:py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-medium transition-colors touch-manipulation z-10 ${
              currentTab === 'rooms' && !selectedRoomId
                ? 'text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {currentTab === 'rooms' && !selectedRoomId && (
              <motion.div
                layoutId="activeBottomNavPill"
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className="absolute inset-0 bg-slate-800/90 border border-white/10 rounded-xl shadow-inner z-[-1]"
              />
            )}
            <Layers className="h-4 w-4 shrink-0 transition-transform active:scale-90" />
            <span className="truncate">Ruangan</span>
          </button>

          {/* 2. Active Room Indicator (If Inside a Room) */}
          {selectedRoomId && (
            <button
              onClick={() => {
                setCurrentTab('rooms');
              }}
              className="relative flex-1 py-2 sm:py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-semibold text-sky-300 touch-manipulation z-10"
            >
              <motion.div
                layoutId="activeBottomNavPill"
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className="absolute inset-0 bg-sky-950/90 border border-sky-500/50 rounded-xl shadow-sm z-[-1]"
              />
              <DoorClosed className="h-4 w-4 text-sky-400 shrink-0" />
              <span className="truncate max-w-[90px] sm:max-w-[120px]">{selectedRoom?.code || 'Detail'}</span>
            </button>
          )}

          {/* 3. Tab: Kelola Pengguna (Superadmin Only) */}
          {currentUser.role === 'superadmin' && (
            <button
              onClick={() => {
                setSelectedRoomId(null);
                setCurrentTab('users');
              }}
              className={`relative flex-1 py-2 sm:py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-medium transition-colors touch-manipulation z-10 ${
                currentTab === 'users' && !selectedRoomId
                  ? 'text-purple-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {currentTab === 'users' && !selectedRoomId && (
                <motion.div
                  layoutId="activeBottomNavPill"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  className="absolute inset-0 bg-purple-950/90 border border-purple-500/50 rounded-xl shadow-inner z-[-1]"
                />
              )}
              <UserCheck className="h-4 w-4 shrink-0 transition-transform active:scale-90" />
              <span className="truncate">Pengguna</span>
            </button>
          )}

        </div>
      </div>
    </nav>
  );
};




