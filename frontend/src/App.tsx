import React, { useState } from 'react';
import { useApp } from '@/context';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/common/Header';
import { BottomNavigation } from './components/common/BottomNavigation';
import { RoomList } from './components/rooms/RoomList';
import { RoomDetailView } from './components/rooms/RoomDetailView';
import { UserManagementView } from './components/users/UserManagementView';
import { Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PulseBeacon } from '@/components/animations/pulse-beacon';

export function MainLayout() {
  const { currentUser, selectedRoomId, setSelectedRoomId } = useApp();
  const [currentTabState, setCurrentTabState] = useState<'rooms' | 'users'>('rooms');

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
        <AnimatePresence mode="wait">
          {selectedRoomId ? (
            <motion.div
              key={`room-${selectedRoomId}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <RoomDetailView
                roomId={selectedRoomId}
                onBack={() => setSelectedRoomId(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`tab-${activeTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'rooms' && (
                <RoomList onSelectRoom={(id) => setSelectedRoomId(id)} />
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
        setCurrentTab={setCurrentTabState}
      />


      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#06090f]/90 backdrop-blur-md py-4 text-xs text-slate-500 text-center relative z-10 mt-auto mb-16 sm:mb-0 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Shield className="h-4 w-4 text-sky-400 shrink-0" />
            <span className="font-medium text-slate-300 text-[11px] sm:text-xs">
              Smart Door Lock System &bull; FT UNTAN
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] font-mono text-slate-400">
            <PulseBeacon color="emerald" size="sm" label="ESP32-WROOM-32" />
            <span>&bull;</span>
            <span>AS608 Sensor</span>
            <span>&bull;</span>
            <span>MQTT QoS 1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return <MainLayout />;
}





