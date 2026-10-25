import React from 'react';
import {
  LayoutDashboard,
  School,
  UserCheck,
  Building2,
  Users,
  FileText,
  Sparkles,
  BookOpenCheck,
  HeartHandshake,
  CalendarCheck2,
  Award,
  BarChart3,
  ShieldCheck,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  BookOpen,
  Video,
  ClipboardList,
  FileQuestion,
  Calendar,
  Clock,
  Bell,
  FolderCheck,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface SidebarProps {
  currentMenu: string;
  onSelectMenu: (menu: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isOpen,
  onToggle,
}) => {
  const { role, logout, profile } = useAuth();

  const guruMenuItems: MenuItem[] = [
    { id: 'beranda', label: '1. Beranda Guru', icon: LayoutDashboard, badge: 'Utama' },
    { id: 'profil_sekolah', label: '2. Profil Sekolah', icon: School },
    { id: 'profil_guru', label: '3. Profil Guru', icon: UserCheck },
    { id: 'data_kelas', label: '4. Data Kelas', icon: Building2 },
    { id: 'data_siswa', label: '5. Data Siswa', icon: Users },
    { id: 'perangkat_ajar', label: '6. Perangkat Ajar', icon: FileText },
    { id: 'bahan_ajar_ai', label: '7. Bahan Ajar AI', icon: Sparkles, highlight: true },
    { id: 'jurnal_guru', label: '8. Jurnal Guru', icon: BookOpenCheck },
    { id: 'jurnal_sikap', label: '9. Jurnal Sikap', icon: HeartHandshake },
    { id: 'absensi_siswa', label: '10. Absensi Siswa', icon: CalendarCheck2 },
    { id: 'tugas_penilaian', label: '11. Tugas & Penilaian', icon: Award },
    { id: 'rekap_nilai', label: '12. Rekap Nilai', icon: BarChart3 },
    { id: 'guru_wali', label: '13. Guru Wali', icon: ShieldCheck },
    { id: 'laporan', label: '14. Laporan', icon: FileSpreadsheet },
    { id: 'master_data', label: '15. Master Data', icon: Settings },
    { id: 'panduan_setup', label: '16. Panduan Supabase', icon: HelpCircle, badge: 'Setup' },
  ];

  const siswaMenuItems: MenuItem[] = [
    { id: 'siswa_beranda', label: '1. Beranda Siswa', icon: LayoutDashboard },
    { id: 'siswa_profil', label: '2. Profil Saya', icon: User },
    { id: 'siswa_materi', label: '3. Materi PAI', icon: BookOpen },
    { id: 'siswa_video', label: '4. Video Pembelajaran', icon: Video },
    { id: 'siswa_tugas', label: '5. Tugas Saya', icon: ClipboardList },
    { id: 'siswa_kuis', label: '6. Kuis & CBT', icon: FileQuestion, highlight: true },
    { id: 'siswa_nilai', label: '7. Nilai Saya', icon: Award },
    { id: 'siswa_kehadiran', label: '8. Riwayat Kehadiran', icon: Calendar },
    { id: 'siswa_jadwal', label: '9. Jadwal Pembelajaran', icon: Clock },
    { id: 'siswa_pengumuman', label: '10. Pengumuman', icon: Bell },
    { id: 'siswa_pengumpulan', label: '11. Riwayat Pengumpulan', icon: FolderCheck },
    { id: 'siswa_pengaturan', label: '12. Pengaturan Akun', icon: Settings },
  ];

  const menuItems = role === 'guru' || role === 'admin' ? guruMenuItems : siswaMenuItems;

  return (
    <aside
      className={`fixed lg:static top-0 bottom-0 left-0 z-40 bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col shadow-xl ${
        isOpen ? 'w-64 translate-x-0' : 'w-0 lg:w-20 -translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Sidebar Header / Brand */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
              PAI
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-wide">PAI INOVATIF</span>
              <span className="block text-[10px] text-slate-400">
                {role === 'guru' ? 'Portal Administrasi Guru' : 'Portal Pembelajaran Siswa'}
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
            PAI
          </div>
        )}

        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white hidden lg:flex"
          title={isOpen ? 'Ciutkan Sidebar' : 'Lebarkan Sidebar'}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {isOpen ? (role === 'guru' ? 'Menu Guru PAI' : 'Menu Siswa SMP') : '•••'}
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectMenu(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              } ${item.highlight && !isActive ? 'text-amber-300 hover:text-amber-200' : ''}`}
              title={!isOpen ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? 'text-white'
                    : item.highlight
                    ? 'text-amber-400'
                    : 'text-slate-400 group-hover:text-amber-300'
                }`}
              />

              {isOpen && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {isOpen && item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono text-[9px] border border-amber-500/20">
                  {item.badge}
                </span>
              )}

              {isOpen && item.highlight && !item.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-semibold">
                  AI
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom User Quick Info & Signout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        {isOpen ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-white truncate">{profile?.full_name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex justify-center p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
