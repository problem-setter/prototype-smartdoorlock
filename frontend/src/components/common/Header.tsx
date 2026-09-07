import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context';
import { 
  Shield, 
  LogOut, 
  Fingerprint, 
  ChevronDown,
  X,
  Check
} from 'lucide-react';
import { UserRole } from '../../types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';

export const Header: React.FC = () => {
  const { currentUser, logout, switchRole, setSelectedRoomId } = useApp();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  if (!currentUser) return null;

  const roleStyles: Record<UserRole, string> = {
    superadmin: 'bg-purple-950/60 text-purple-300 border-purple-800/50 hover:bg-purple-900/40',
    admin: 'bg-sky-950/60 text-sky-300 border-sky-800/50 hover:bg-sky-900/40',
    user: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/40',
  };

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
    setRoleDropdownOpen(false);
  };


  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#080c14]/95 backdrop-blur-md safe-pt">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button 
              onClick={() => setSelectedRoomId(null)}
              className="flex items-center gap-2 sm:gap-3 text-left transition-opacity active:opacity-80 group shrink-0"
              aria-label="Beranda Smart Lock"
            >
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-slate-800 text-sky-400 border border-slate-700 shadow-inner">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
                    UNTAN Lock
                  </span>
                  <span className="rounded bg-sky-950/70 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono font-medium text-sky-300 border border-sky-800/40 shrink-0">
                    IoT
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono hidden xs:block truncate max-w-[150px] sm:max-w-none">
                  Ruang Server & NetSec
                </p>
              </div>
            </button>
          </div>

          {/* User Profile & Role Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Minimalist Role Switcher */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg border transition-all cursor-pointer ${roleStyles[currentUser.role]}`}
                title="Ganti Role Simulasi"
              >
                <Fingerprint className="h-3.5 w-3.5 shrink-0" />
                <span className="font-semibold capitalize tracking-wide">{currentUser.role}</span>
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
                    {/* Backdrop for mobile */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs sm:hidden"
                      onClick={() => setRoleDropdownOpen(false)}
                    />
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                      className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 bottom-20 sm:bottom-auto sm:top-full sm:mt-2 w-auto sm:w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Simulasi Ganti Role
                        </span>
                        <button 
                          onClick={() => setRoleDropdownOpen(false)}
                          className="p-1 rounded text-slate-400 hover:text-white sm:hidden"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-1 mt-1">
                        <button
                          onClick={() => handleRoleSelect('user')}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            currentUser.role === 'user' ? 'bg-emerald-950/70 text-emerald-300 font-semibold border border-emerald-800/40' : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <div className="font-medium">User Biasa</div>
                            <div className="text-[10px] text-slate-400">Log Personal & Buka FP</div>
                          </div>
                          {currentUser.role === 'user' && <Check className="h-4 w-4 text-emerald-400" />}
                        </button>

                        <button
                          onClick={() => handleRoleSelect('admin')}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            currentUser.role === 'admin' ? 'bg-sky-950/70 text-sky-300 font-semibold border border-sky-800/40' : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <div className="font-medium">Admin Ruangan</div>
                            <div className="text-[10px] text-slate-400">Kontrol Khusus Ruangan Tertentu</div>
                          </div>
                          {currentUser.role === 'admin' && <Check className="h-4 w-4 text-sky-400" />}
                        </button>

                        <button
                          onClick={() => handleRoleSelect('superadmin')}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            currentUser.role === 'superadmin' ? 'bg-purple-950/70 text-purple-300 font-semibold border border-purple-800/40' : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <div className="font-medium">Super Administrator</div>
                            <div className="text-[10px] text-slate-400">Global Access + Kelola User</div>
                          </div>
                          {currentUser.role === 'superadmin' && <Check className="h-4 w-4 text-purple-400" />}
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
                <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px] lg:max-w-[160px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px] lg:max-w-[160px]">
                  {currentUser.nipNim}
                </div>
              </div>
              <Avatar size="sm">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Tooltip content="Keluar dari akun">
                <button
                  onClick={logout}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors active:scale-90"
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
