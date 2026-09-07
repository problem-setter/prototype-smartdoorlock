import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context';
import { 
  KeyRound,
  Fingerprint, 
  ArrowRight, 
  Lock, 
  Radio,
  Cpu,
  Server
} from 'lucide-react';
import { UserRole } from '../../types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/animations/fade-in';
import { LetterPullUp, GradientText } from '@/components/animations/text-animations';
import { ShimmerButton } from '@/components/animations/shimmer-button';
import { SpotlightCard } from '@/components/animations/spotlight-card';
import { PulseBeacon } from '@/components/animations/pulse-beacon';



export const LoginPage: React.FC = () => {
  const { users, login } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>('superadmin');
  const [identifier, setIdentifier] = useState('197805122003121002');
  const [password, setPassword] = useState('••••••••••••');

  const roleUserMap = {
    superadmin: users.find((u) => u.role === 'superadmin') || users[0],
    admin: users.find((u) => u.role === 'admin') || users[1],
    user: users.find((u) => u.role === 'user') || users[2],
  };

  const handleQuickRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    const targetUser = roleUserMap[role];
    if (targetUser) {
      setIdentifier(targetUser.nipNim);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = roleUserMap[selectedRole];
    if (user) {
      login(user);
    }
  };


  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-3.5 sm:p-6 lg:p-8 relative bg-ambient-glow safe-pb safe-pt">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center relative z-10 py-2 sm:py-0">
        
        {/* Left Col: System Overview & Specs */}
        <FadeIn direction="up" delay={0} className="lg:col-span-7 space-y-3.5 sm:space-y-6">
          <Badge variant="default" icon={<Radio className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sky-400" />}>
            Sistem Keamanan IoT Kampus FT UNTAN
          </Badge>

          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              <LetterPullUp text="Smart Door Lock" className="block" delay={0.1} />
              <span className="block mt-1">
                <GradientText from="from-sky-400" via="via-blue-400" to="to-purple-400">
                  & Access Control
                </GradientText>
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Platform autentikasi biometrik fingerprint AS608, sensor pintu MC-38, dan aktuator Solenoid 12V berbasis ESP32 & MQTT Protocol untuk Ruang Server & Laboratorium FT UNTAN.
            </p>
          </div>

          {/* Quick Hardware Spec Badges (Compact on mobile) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
            <SpotlightCard className="p-2.5 sm:p-3.5 space-y-0.5 sm:space-y-1" spotlightColor="rgba(56,189,248,0.08)">
              <div className="flex items-center gap-1.5 text-slate-200">
                <Fingerprint className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-400 shrink-0" />
                <span className="text-[11px] sm:text-xs font-semibold truncate">AS608</span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1 sm:line-clamp-2">Biometrik Cepat</p>
            </SpotlightCard>

            <SpotlightCard className="p-2.5 sm:p-3.5 space-y-0.5 sm:space-y-1" spotlightColor="rgba(168,85,247,0.08)">
              <div className="flex items-center gap-1.5 text-slate-200">
                <Cpu className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400 shrink-0" />
                <span className="text-[11px] sm:text-xs font-semibold truncate">ESP32</span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1 sm:line-clamp-2">MQTT QoS 1</p>
            </SpotlightCard>

            <SpotlightCard className="p-2.5 sm:p-3.5 space-y-0.5 sm:space-y-1" spotlightColor="rgba(16,185,129,0.08)">
              <div className="flex items-center gap-1.5 text-slate-200">
                <Server className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] sm:text-xs font-semibold truncate">2 Ruangan</span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1 sm:line-clamp-2">Server & NetSec</p>
            </SpotlightCard>
          </div>

          {/* Live Node Status Summary */}
          <div className="p-3 sm:p-3.5 rounded-xl modern-card flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PulseBeacon color="emerald" size="sm" />
              <div>
                <div className="text-[11px] sm:text-xs font-semibold text-white">MQTT Broker (Mosquitto)</div>
                <div className="text-[10px] text-slate-400 font-mono">10.15.44.1:1883 • Connected</div>
              </div>
            </div>
            <Badge variant="mono">QoS 1</Badge>
          </div>
        </FadeIn>

        {/* Right Col: Interactive Login Card */}
        <FadeIn direction="up" delay={0.15} className="lg:col-span-5">
          <div className="rounded-2xl bg-slate-900/90 border border-white/[0.08] p-4 sm:p-7 space-y-4 sm:space-y-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-800 text-sky-400 border border-slate-700">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Autentikasi Dashboard</h2>
                <p className="text-[11px] sm:text-xs text-slate-400">Pilih role untuk demo instan</p>
              </div>
            </div>

            {/* Quick Role Selector Buttons with LayoutId active indicator */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Pilih Role Akses Demo:
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 relative">
                {(['user', 'admin', 'superadmin'] as UserRole[]).map((role) => {
                  const isSelected = selectedRole === role;
                  const labelMap = {
                    user: { title: 'User', desc: 'Log Pribadi', color: 'text-emerald-300' },
                    admin: { title: 'Admin', desc: 'Ruangan', color: 'text-sky-300' },
                    superadmin: { title: 'Superadmin', desc: 'Global+MQTT', color: 'text-purple-300' },
                  }[role];

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleQuickRoleSelect(role)}
                      className={cn(
                        'relative p-2 sm:p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer overflow-hidden z-10',
                        isSelected
                          ? 'border-white/30 text-white shadow-lg'
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="activeRoleSelection"
                          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                          className={cn(
                            'absolute inset-0 z-[-1]',
                            role === 'user' && 'bg-emerald-950/80 border-2 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
                            role === 'admin' && 'bg-sky-950/80 border-2 border-sky-500/80 shadow-[0_0_15px_rgba(14,165,233,0.3)]',
                            role === 'superadmin' && 'bg-purple-950/80 border-2 border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                          )}
                        />
                      )}
                      <div className={cn('text-[11px] font-bold', labelMap.color)}>{labelMap.title}</div>
                      <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">{labelMap.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>


            {/* Simulated Active User Preview */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 sm:gap-3">
              <img
                src={roleUserMap[selectedRole]?.avatarUrl}
                alt="Avatar"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">
                  {roleUserMap[selectedRole]?.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {roleUserMap[selectedRole]?.roleLabel} &bull; {roleUserMap[selectedRole]?.accessibleRoomIds?.length} Ruang Akses
                </div>
              </div>
              <Badge variant="mono" className="shrink-0">
                {(() => {
                  const targetUser = roleUserMap[selectedRole];
                  const fps = targetUser?.fingerprintTemplateIds || (targetUser?.fingerprintTemplateId ? [targetUser.fingerprintTemplateId] : []);
                  return fps.length > 0 ? `${fps.length}/3 FP (#${fps.join(', #')})` : 'FP N/A';
                })()}
              </Badge>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="login-id">NIP / NIM / Identitas</Label>
                <Input
                  id="login-id"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="login-pw">PIN Keamanan / Password</Label>
                <Input
                  id="login-pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono"
                  rightIcon={<Lock className="h-3.5 w-3.5" />}
                  required
                />
              </div>

              <ShimmerButton
                type="submit"
                variant="sky"
                className="w-full py-2.5 sm:py-3 mt-1"
              >
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </ShimmerButton>
            </form>

            <div className="text-center pt-1 border-t border-slate-800">
              <p className="text-[10px] text-slate-500">
                Sistem Terautentikasi &bull; Jurusan Informatika FT UNTAN
              </p>
            </div>
          </div>
        </FadeIn>

      </div>
    </div>
  );
};
