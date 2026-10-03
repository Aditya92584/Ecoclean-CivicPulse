import React from 'react';
import {
  Zap,
  Shield,
  User,
  Truck,
  LogOut,
  LogIn,
  Home as HomeIcon,
  MapPin,
} from 'lucide-react';
import { AuthUser, UserRole } from '../types/auth';

interface NavTabItem {
  id: 'home' | 'report' | 'feed' | 'map' | 'admin' | 'impact';
  label: string;
  count?: number;
  isLive?: boolean;
}

interface NavbarProps {
  activeTab: 'home' | 'report' | 'feed' | 'map' | 'admin' | 'impact';
  setActiveTab: (tab: 'home' | 'report' | 'feed' | 'map' | 'admin' | 'impact') => void;
  reportCount: number;
  myReportCount?: number;
  currentUser: AuthUser | null;
  onOpenLoginModal: (role?: UserRole) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  reportCount,
  myReportCount = 0,
  currentUser,
  onOpenLoginModal,
  onLogout,
}) => {
  // Determine which tabs to show based on user role, with 'Home' always available
  const getVisibleTabs = (): NavTabItem[] => {
    if (!currentUser) {
      // Guest: Home, Report Waste, Public Feed, Dispatch Impact
      return [
        { id: 'home', label: 'Home' },
        { id: 'report', label: 'Report Waste' },
        { id: 'feed', label: 'Public Feed', count: reportCount },
        { id: 'impact', label: 'Dispatch Impact' },
      ];
    }

    if (currentUser.role === 'citizen') {
      // Citizen: Home, Report Waste, Public Feed, Dispatch Impact
      return [
        { id: 'home', label: 'Home' },
        { id: 'report', label: 'Report Waste' },
        { id: 'feed', label: 'Public Feed', count: reportCount },
        { id: 'impact', label: 'Dispatch Impact' },
      ];
    }

    if (currentUser.role === 'admin') {
      // Admin: Home, Report Waste, Public Feed, Admin Dashboard, Dispatch Impact
      return [
        { id: 'home', label: 'Home' },
        { id: 'report', label: 'Report Waste' },
        { id: 'feed', label: 'Public Feed', count: reportCount },
        { id: 'admin', label: 'Dispatch Console', isLive: true },
        { id: 'impact', label: 'Dispatch Impact' },
      ];
    }

    if (currentUser.role === 'staff') {
      return [
        { id: 'home', label: 'Home' },
        { id: 'report', label: 'Report Waste' },
        { id: 'feed', label: 'Public Feed', count: reportCount },
        { id: 'admin', label: 'Route Dispatch', isLive: true },
        { id: 'impact', label: 'Dispatch Impact' },
      ];
    }

    return [
      { id: 'home', label: 'Home' },
      { id: 'report', label: 'Report Waste' },
      { id: 'feed', label: 'Public Feed', count: reportCount },
      { id: 'impact', label: 'Dispatch Impact' },
    ];
  };

  const visibleTabs = getVisibleTabs();

  // Helper for role badge styling
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 ring-2 ring-emerald-500/20">
            <Shield className="w-3 h-3 text-emerald-700" />
            Admin
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300 ring-2 ring-sky-500/20">
            <Truck className="w-3 h-3 text-sky-700" />
            Staff
          </span>
        );
      case 'citizen':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <User className="w-3 h-3 text-slate-500" />
            Citizen
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Wordmark & Logo linking to Home */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
            title="EcoPulse - Civic Cleanliness"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 flex items-center justify-center text-white shadow-xs transition-colors">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors leading-none">
                Eco<span className="text-emerald-600">Pulse</span>
              </span>
              <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
                CIVIC CLEANLINESS
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Including Home) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-slate-600">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`transition-colors relative py-1.5 flex items-center gap-2 cursor-pointer ${
                  isActive ? 'text-emerald-700 font-semibold' : 'hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {tab.count}
                  </span>
                )}
                {tab.isLive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Authentication & Action Button */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            /* Logged-In User State: Name, Role Badge, and Logout */
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {currentUser.department || currentUser.email}
                  </span>
                </div>

                {renderRoleBadge(currentUser.role)}
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                title="Log out from session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            /* Logged-Out State: Green "Sign In / Register" Pill Button */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenLoginModal('citizen')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00875a] hover:bg-[#00734c] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all duration-200 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-emerald-100" />
                <span>Sign In / Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
