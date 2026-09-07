import React, { useState, useTransition, useCallback } from 'react';
import { useApp } from '@/context';
import { Header } from './components/common/Header';
import { BottomNavigation } from './components/common/BottomNavigation';
import { RoomList } from './components/rooms/RoomList';
import { LoginPage } from './components/auth/LoginPage';
import { RoomDetailView } from './components/rooms/RoomDetailView';
import { UserManagementView } from './components/users/UserManagementView';
import { Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PulseBeacon } from '@/components/animations/pulse-beacon';

export function MainLayout() {
  const { currentUser, selectedRoomId, setSelectedRoomId } = useApp();
  const [currentTabState, setCurrentTabState] = useState<'rooms' | 'users'>('rooms');
  const [, startTransition] = useTransition();

  const handleSelectRoom = useCallback((id: string | null) => {
    startTransition(() => {
      setSelectedRoomId(id);
    });
  }, [setSelectedRoomId]);

  const handleSetTab = useCallback((tab: 'rooms' | 'users') => {
    startTransition(() => {
      setCurrentTabState(tab);
    });
  }, []);

  if (!currentUser) {
    return <LoginPage />;
  }

  // Derive tab safely: non-superadmin is strictly bounded to rooms tab
  const activeTab = currentUser.role === 'superadmin' ? currentTabState : 'rooms';

  return (
    <div className="min-h-[100dvh] bg-ambient-glow text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-200 relative pb-24 sm:pb-20">
      {/* Top Main Navigation Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
        <AnimatePresence initial={false}>
          {selectedRoomId ? (
            <motion.div
              key={`room-${selectedRoomId}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <RoomDetailView
                roomId={selectedRoomId}
                onBack={() => handleSelectRoom(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`tab-${activeTab}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {activeTab === 'rooms' && (
                <RoomList onSelectRoom={handleSelectRoom} />
              )}
              {activeTab === 'users' && currentUser.role === 'superadmin' && (
                <UserManagementView />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Floating App Navigation */}
      <BottomNavigation
        currentTab={activeTab}
        setCurrentTab={handleSetTab}
      />

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#06090f]/90 backdrop-blur-md py-4 text-xs text-slate-500 text-center relative z-10 mt-auto mb-16 sm:mb-0 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Shield className="h-4 w-4 text-sky-400 shrink-0" />
            <span className="font-semibold text-slate-300 text-[11px] sm:text-xs">
              YOU-LOCK™ <span className="font-mono font-normal text-slate-500">// VaultOS Enterprise Physical Enclave &bull; FT UNTAN</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] font-mono text-slate-400">
            <PulseBeacon color="emerald" size="sm" label="ESP32-WROOM-32" />
            <span>&bull;</span>
            <span>AS608 Optical Bio</span>
            <span>&bull;</span>
            <span className="text-sky-400">QoS 1 Protected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return <MainLayout />;
}
