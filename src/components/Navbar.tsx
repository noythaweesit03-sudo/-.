import React from 'react';
import { User } from '../types';
import { LogOut, UserCheck } from 'lucide-react';

interface NavbarProps {
  currentTab: 'cheques' | 'dashboard' | 'logs' | 'settings';
  onSelectTab: (tab: 'cheques' | 'dashboard' | 'logs' | 'settings') => void;
  currentUser: User;
  onLogout: () => void;
  onSwitchUser?: (username: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
}) => {
  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark / Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
            ฿
          </div>
          <button
            onClick={() => onSelectTab('cheques')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-base font-semibold tracking-tight text-white group-hover:text-emerald-400 transition-colors whitespace-nowrap">
              ระบบจัดทำและพิมพ์เช็ค
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (single-line, clean text tabs) */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onSelectTab('cheques')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'cheques'
                ? 'bg-slate-800 text-emerald-400 shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            ออกเช็ค
          </button>
          
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-slate-800 text-emerald-400 shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            สรุปเสนอผู้บริหาร
          </button>

          <button
            onClick={() => onSelectTab('logs')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'logs'
                ? 'bg-slate-800 text-emerald-400 shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            ประวัติการออกเช็ค
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-slate-800 text-emerald-400 shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            ตั้งค่าระบบ
          </button>
        </nav>

        {/* Zone 3: Account info & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end text-xs leading-tight">
            <span className="font-medium text-slate-200 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              {currentUser.fullName}
            </span>
            <span className="text-slate-400">
              {currentUser.role === 'ADMIN' ? 'ผู้ดูแลระบบ (ADMIN)' : 'เจ้าหน้าที่ (USER)'} · {currentUser.username}
            </span>
          </div>

          <button
            onClick={onLogout}
            title="ออกจากระบบ"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-red-900/40 border border-slate-700/60 hover:border-red-700/50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>

      </div>
    </header>
  );
};
