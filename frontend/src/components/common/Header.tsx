import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context';
import { 
  Shield, 
  LogOut, 
  Fingerprint, 
  ChevronDown,
  X,
  Check,
  Sparkles,
  User,
  ShieldAlert,
  KeyRound
} from 'lucide-react';
import { UserRole } from '../../types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';
import { PulseBeacon } from '@/components/animations/pulse-beacon';
import { BrandLogo } from './BrandLogo';
import { Radio } from 'lucide-react';


export const Header: React.FC = () => {
  const { currentUser, logout, switchRole, setSelectedRoomId } = useApp();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  if (!currentUser) return null;

  const roleStyles: Record<UserRole, { badge: string; text: string; glow: string }> = {
    superadmin: {
      badge: 'bg-purple-950/80 text-purple-300 border-purple-500/40 hover:bg-purple-900/60 shadow-[0_0_14px_rgba(168,85,247,0.25)]',
      text: 'text-purple-300',
      glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]',
    },
    admin: {
      badge: 'bg-sky-950/80 text-sky-300 border-sky-500/40 hover:bg-sky-900/60 shadow-[0_0_14px_rgba(14,165,233,0.25)]',
      text: 'text-sky-300',
      glow: 'shadow-[0_0_12px_rgba(14,165,233,0.3)]',
    },
    user: {
      badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60 shadow-[0_0_14px_rgba(16,185,129,0.25)]',
      text: 'text-emerald-300',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    },
  };

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
    setRoleDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#050811]/90 backdrop-blur-2xl safe-pt shadow-lg shadow-black/40">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button 
              onClick={() => setSelectedRoomId(null)}
              className="flex items-center gap-2 sm:gap-3 text-left transition-all active:scale-95 group shrink-0 cursor-pointer outline-none"
              aria-label="Beranda YOU-LOCK"
            >
              <BrandLogo size="md" />
            </button>
          </div>

          {/* Telemetry Pill & User Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Live System Heartbeat Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950/90 border border-white/[0.08] text-[10px] font-mono text-slate-400">
              <PulseBeacon color="emerald" size="sm" />
              <span className="text-slate-300 font-semibold">QoS 1 MESH</span>
              <span className="text-slate-600">|</span>
              <span className="text-sky-400 flex items-center gap-1">
                <Radio className="h-3 w-3" />
                12ms ACK
              </span>
            </div>

            {/* Role Switcher Pill */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                aria-haspopup="menu"
                aria-expanded={roleDropdownOpen}
                aria-label="Ganti Role Simulasi"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl border backdrop-blur-md transition-all cursor-pointer ${roleStyles[currentUser.role].badge}`}
                title="Ganti Role Simulasi"
              >
                <Fingerprint className="h-3.5 w-3.5 shrink-0" />
                <span className="capitalize tracking-wide font-mono">{currentUser.role}</span>
                <motion.div
                  animate={{ rotate: roleDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-3 w-3 opacity-70 shrink-0" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {roleDropdownOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs sm:hidden"
                      onClick={() => setRoleDropdownOpen(false)}
                    />
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                      className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 bottom-24 sm:bottom-auto sm:top-full sm:mt-2 w-auto sm:w-80 rounded-2xl bg-[#0a0f1c]/95 border border-white/[0.12] shadow-2xl shadow-black/90 p-2.5 z-50 overflow-hidden backdrop-blur-2xl"
                    >
                      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08]">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 font-mono">
                          <Sparkles className="h-3 w-3 text-sky-400" />
                          Simulasi Hak Akses
                        </span>
                        <button 
                          onClick={() => setRoleDropdownOpen(false)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white sm:hidden cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-1.5 mt-2">
                        <button
                          onClick={() => handleRoleSelect('user')}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                            currentUser.role === 'user' 
                              ? 'bg-emerald-950/80 text-emerald-200 font-semibold border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]' 
                              : 'text-slate-300 hover:bg-slate-850/80'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mt-0.5 shrink-0">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-emerald-300">Pengguna Biasa (User)</div>
                              <div className="text-[10px] text-slate-400 leading-snug mt-0.5">Akses sidik jari AS608 & log personal</div>
                            </div>
                          </div>
                          {currentUser.role === 'user' && <Check className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />}
                        </button>

                        <button
                          onClick={() => handleRoleSelect('admin')}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                            currentUser.role === 'admin' 
                              ? 'bg-sky-950/80 text-sky-200 font-semibold border border-sky-500/50 shadow-[0_0_12px_rgba(14,165,233,0.25)]' 
                              : 'text-slate-300 hover:bg-slate-850/80'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 mt-0.5 shrink-0">
                              <KeyRound className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-sky-300">Admin Ruangan (Lab Admin)</div>
                              <div className="text-[10px] text-slate-400 leading-snug mt-0.5">Remote Solenoid 12V & silence buzzer</div>
                            </div>
                          </div>
                          {currentUser.role === 'admin' && <Check className="h-4 w-4 text-sky-400 shrink-0 ml-2" />}
                        </button>

                        <button
                          onClick={() => handleRoleSelect('superadmin')}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                            currentUser.role === 'superadmin' 
                              ? 'bg-purple-950/80 text-purple-200 font-semibold border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.25)]' 
                              : 'text-slate-300 hover:bg-slate-850/80'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 mt-0.5 shrink-0">
                              <ShieldAlert className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-purple-300">Super Administrator</div>
                              <div className="text-[10px] text-slate-400 leading-snug mt-0.5">Kelola pengguna & pendaftaran AS608</div>
                            </div>
                          </div>
                          {currentUser.role === 'superadmin' && <Check className="h-4 w-4 text-purple-400 shrink-0 ml-2" />}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>


            {/* User Avatar & Logout */}
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-white/10">
              <div className="hidden md:block text-right">
                <div className="text-xs font-bold text-slate-200 truncate max-w-[120px] lg:max-w-[160px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px] lg:max-w-[160px]">
                  {currentUser.nipNim}
                </div>
              </div>
              <Avatar size="sm" className="border-white/20 ring-2 ring-sky-500/20">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Tooltip content="Keluar dari akun">
                <button
                  onClick={logout}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                  title="Keluar"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
