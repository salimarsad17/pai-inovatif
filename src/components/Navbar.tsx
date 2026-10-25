import React, { useState } from 'react';
import {
  Bell,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Sparkles,
  BookOpen,
  School,
  ExternalLink,
  ChevronDown,
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
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Ticker / Running Text "Guru Kreatif, Siswa Aktif" */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 font-semibold text-xs py-1 px-4 overflow-hidden shadow-inner flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-slate-950 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
            Motto
          </span>
          <div className="overflow-hidden whitespace-nowrap">
            <span className="inline-block animate-pulse tracking-wide font-medium">
              ✨ &ldquo;Guru Kreatif, Siswa Aktif&rdquo; &bull; {schoolSettings?.school_name || 'UPT SMPN 2 Rebang Tangkas'} &bull; Tahun Ajaran {schoolSettings?.academic_year || '2025/2026'} ({schoolSettings?.semester || 'Ganjil'})
            </span>
          </div>
        </div>
        <span className="text-[11px] hidden sm:inline-block opacity-90 font-mono">
          PAI INOVATIF v1.0
        </span>
      </div>

      {/* Main Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Hamburger & School Logo / Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors focus:outline-none"
            title="Buka/Tutup Menu"
          >
            {isSidebarOpen ? <Menu className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-amber-500 flex items-center justify-center shadow-lg border border-amber-400/30 text-white font-bold">
              <BookOpen className="w-5 h-5 text-amber-200" />
            </div>
            <div className="leading-tight">
              <div className="font-extrabold text-base tracking-wide flex items-center gap-1.5">
                <span className="text-white">PAI</span>
                <span className="text-amber-400">INOVATIF</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[190px] sm:max-w-none">
                UPT SMPN 2 Rebang Tangkas
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari materi, tugas, siswa, jurnal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-400 transition-all outline-none"
            />
          </div>
        </div>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 relative transition-colors"
              title="Pengumuman & Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {announcements.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-slate-900 animate-ping" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-400" /> Pengumuman Sekolah
                  </h4>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                    {announcements.length} Baru
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-700/60">
                  {announcements.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Belum ada pengumuman baru saat ini.
                    </div>
                  ) : (
                    announcements.map((item) => (
                      <div key={item.id} className="p-3 hover:bg-slate-700/50 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          {item.is_important && (
                            <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">
                              Penting
                            </span>
                          )}
                          <h5 className="text-xs font-semibold text-white truncate">{item.title}</h5>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Badge & Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md">
                {profile?.full_name?.charAt(0).toUpperCase() || 'P'}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                  {profile?.full_name || 'Pengguna'}
                </div>
                <div className="text-[10px] text-amber-400 capitalize font-medium">
                  {role === 'guru' ? 'Guru PAI' : `Siswa (${student?.class?.class_name || 'SMP'})`}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-700">
                  <p className="text-xs font-bold text-white truncate">{profile?.full_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">@{profile?.username}</p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold uppercase">
                    {role}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onSelectMenu) onSelectMenu(role === 'guru' ? 'profil_guru' : 'profil_saya');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" /> Profil Saya
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onSelectMenu) onSelectMenu('profil_sekolah');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <School className="w-3.5 h-3.5 text-slate-400" /> Profil Sekolah
                  </button>
                </div>

                <div className="border-t border-slate-700 pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
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
