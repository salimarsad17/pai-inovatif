import React, { useState } from 'react';
import {
  Bell,
  Menu,
  ChevronLeft,
  User,
  LogOut,
  ExternalLink,
  ChevronDown,
  Info,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Announcement } from '../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  announcements?: Announcement[];
  onSelectMenu?: (menu: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  announcements = [],
  onSelectMenu,
}) => {
  const { profile, student, role, logout, schoolSettings } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#2d3a4d] border-b border-[#222c3b] text-white shadow-md select-none">
      <div className="flex items-center justify-between h-12 px-2 sm:px-4">
        {/* Left: Dapodik Logo & Title & Collapse Arrow */}
        <div className="flex items-center gap-3">
          {/* Dapodik Brand Banner */}
          <div className="flex items-center gap-2 pr-3 border-r border-slate-600/40">
            <img
              src="/dapodik-logo.png"
              alt="Dapodik"
              className="w-7 h-7 object-contain drop-shadow"
              onError={(e) => {
                // Fallback icon if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="leading-tight hidden sm:block">
              <div className="text-[13px] font-extrabold text-white tracking-wide">
                Dapodik
              </div>
              <div className="text-[10px] text-slate-300 font-normal tracking-tight">
                Satu Data Pendidikan Indonesia
              </div>
            </div>
          </div>

          {/* Sidebar Toggle Icon / Collapse Arrow */}
          <button
            onClick={onToggleSidebar}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors focus:outline-none flex items-center gap-1.5"
            title={isSidebarOpen ? 'Ciutkan Sidebar' : 'Buka Sidebar'}
          >
            <ChevronLeft
              className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${
                isSidebarOpen ? '' : 'rotate-180'
              }`}
            />
            <Menu className="w-4 h-4 text-slate-200" />
          </button>

          {/* School Name Header */}
          <div className="flex items-center gap-2 overflow-hidden">
            <h1 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
              {schoolSettings?.school_name || 'UPT SMP NEGERI 2 REBANG TANGKAS'} - 2026/2027
            </h1>
          </div>
        </div>

        {/* Right Section: Sync Status, Notifications & Profile */}
        <div className="flex items-center gap-2">


          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors relative"
              title="Pemberitahuan Sistem"
            >
              <Bell className="w-4 h-4" />
              {announcements.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#2d3a4d]" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-2xl py-2 z-50 text-slate-800 animate-in fade-in">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-blue-600" /> Pemberitahuan & Pesan
                  </h4>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                    {announcements.length || 1} Baru
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                  <div className="p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-900 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Pengisian Instrumen PAK KPK 2026/2027
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Mohon Kepala Sekolah dan Operator UPT SMP NEGERI 2 REBANG TANGKAS melengkapi instrumen PAK KPK.
                    </p>
                  </div>
                  {announcements.map((item) => (
                    <div key={item.id} className="p-3 hover:bg-slate-50">
                      <div className="font-semibold text-slate-800">{item.title}</div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{item.content}</p>
                    </div>
                  ))}
                </div>
                <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      onSelectMenu?.('pesan');
                      setShowNotifications(false);
                    }}
                    className="w-full py-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    Buka Menu Pesan &amp; Q&amp;A Kelas &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 rounded hover:bg-slate-700/60 transition-colors text-xs font-medium text-white"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-400/50 bg-slate-800 flex items-center justify-center">
                <img
                  src="/dapodik-operator-avatar.png"
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="hidden lg:inline-block font-semibold">
                {profile?.full_name || 'Sadiqul Alim'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-2xl py-2 z-50 text-slate-800 animate-in fade-in">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{profile?.full_name || 'Sadiqul Alim'}</p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                    Akun Terverifikasi
                  </span>
                </div>
                <div className="py-1 text-xs">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onSelectMenu) onSelectMenu(role === 'guru' ? 'profil_guru' : 'profil_saya');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" /> Profil Pengguna
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onSelectMenu) onSelectMenu('profil_sekolah');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-500" /> Profil Sekolah
                  </button>
                </div>
                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 text-xs font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Keluar (Logout)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
