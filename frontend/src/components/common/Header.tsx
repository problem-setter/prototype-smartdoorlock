import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/context';
import { LogOut, Layers, FileText, Cpu, UserCheck } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { cn } from '@/lib/utils';
import { getUserAccessValidity } from '@/types';

export type NavTab = 'rooms' | 'users' | 'logs' | 'hardware';

export interface HeaderProps {
  currentTab?: NavTab;
  onSelectTab?: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab: propTab, onSelectTab }) => {
  const { currentUser, users, logout, selectedRoomId, setSelectedRoomId } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Calculate pending alerts for Superadmin to show mini red dot
  const hasPendingAlerts = useMemo(() => {
    if (!currentUser || currentUser.role !== 'superadmin') return false;
    const pendingReqs = users.some((u) => u.status === 'PENDING_APPROVAL');
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const lifecycleAlerts = users.some((u) => {
      if (u.status === 'PENDING_APPROVAL' || u.status === 'REJECTED') return false;
      const validity = getUserAccessValidity(u);
      if (validity.isExpired || u.status === 'EXPIRED') return true;
      if (u.validUntil) {
        const diff = new Date(u.validUntil).getTime() - now;
        return diff > 0 && diff <= sevenDaysMs;
      }
      return false;
    });
    return pendingReqs || lifecycleAlerts;
  }, [currentUser, users]);

  if (!currentUser) return null;

  // Determine active tab from URL path if not explicitly provided
  const getActiveTab = (): NavTab => {
    if (propTab) return propTab;
    const path = location.pathname;
    if (path.startsWith('/users')) return 'users';
    if (path.startsWith('/logs')) return 'logs';
    if (path.startsWith('/hardware')) return 'hardware';
    return 'rooms';
  };

  const activeTab = getActiveTab();
  const isRoomDetail = location.pathname.startsWith('/rooms/') && location.pathname !== '/rooms';

  const handleLogoClick = () => {
    setSelectedRoomId(null);
    if (onSelectTab) {
      onSelectTab('rooms');
    } else {
      navigate('/rooms');
    }
  };

  const handleTabClick = (tab: NavTab) => {
    setSelectedRoomId(null);
    if (onSelectTab) {
      onSelectTab(tab);
    } else {
      navigate(`/${tab}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e6e6e6] bg-white/95 backdrop-blur-md safe-pt font-sans">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Desktop Navigation */}
        <div className="flex items-center gap-2 lg:gap-5 min-w-0">
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex items-center gap-2 text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4]/40 rounded-lg p-0.5 transition-transform active:scale-98 shrink-0"
            aria-label="Beranda Smart Door Lock"
          >
            <BrandLogo size="sm" />
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 shrink-0" aria-label="Navigasi Utama">
            <button
              type="button"
              onClick={() => handleTabClick('rooms')}
              className={cn(
                "flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer",
                activeTab === 'rooms' && !isRoomDetail && !selectedRoomId
                  ? "bg-[#f7f0fd] text-[#5645d4] font-semibold border border-[#ecd5fb]"
                  : "text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]"
              )}
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span>Ruangan</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('logs')}
              className={cn(
                "flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer",
                activeTab === 'logs'
                  ? "bg-[#f7f0fd] text-[#5645d4] font-semibold border border-[#ecd5fb]"
                  : "text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]"
              )}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span>Log Audit</span>
            </button>

            {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
              <button
                type="button"
                onClick={() => handleTabClick('hardware')}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer",
                  activeTab === 'hardware'
                    ? "bg-[#f7f0fd] text-[#5645d4] font-semibold border border-[#ecd5fb]"
                    : "text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]"
                )}
              >
                <Cpu className="h-3.5 w-3.5 shrink-0" />
                <span>Hardware</span>
              </button>
            )}

            {currentUser.role === 'superadmin' && (
              <button
                type="button"
                onClick={() => handleTabClick('users')}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer",
                  activeTab === 'users'
                    ? "bg-[#f7f0fd] text-[#5645d4] font-semibold border border-[#ecd5fb]"
                    : "text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]"
                )}
              >
                <div className="relative flex items-center justify-center">
                  <UserCheck className="h-3.5 w-3.5 shrink-0" />
                  {hasPendingAlerts && activeTab !== 'users' && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e03131] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e03131] ring-1.5 ring-white" />
                    </span>
                  )}
                </div>
                <span>Pengguna</span>
              </button>
            )}
          </nav>
        </div>

        {/* User Profile & Logout Action */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="flex flex-col text-right">
            <span className="text-xs font-semibold text-[#000000] leading-tight truncate max-w-[140px] sm:max-w-[200px]">
              {currentUser.name}
            </span>
            <span className="text-[10px] text-[#615d59] font-mono leading-tight">
              {currentUser.email}
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-[#615d59] hover:text-[#eb5757] hover:bg-[#fdf2f2] hover:border-[#fadad9] rounded-md border border-[#e6e6e6] transition-colors cursor-pointer"
            title="Keluar dari akun"
            aria-label="Keluar dari akun"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
