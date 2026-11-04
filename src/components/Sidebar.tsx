import React, { useState, useEffect } from 'react';
import {
  Monitor,
  MessageSquare,
  Building2,
  Smile,
  Users,
  ListOrdered,
  Sparkles,
  CalendarCheck2,
  UserCheck,
  Settings,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  LogOut,
  School,
  FileText,
  HeartHandshake,
  BookOpenCheck,
  Award,
  BarChart3,
  BookOpen,
  Video,
  Play,
  ClipboardList,
  FileQuestion,
  Calendar,
  Clock,
  Bell,
  FolderCheck,
  User,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentMenu: string;
  onSelectMenu: (menu: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isOpen,
  onToggle,
}) => {
  const { role, logout, profile } = useAuth();

  // State to track expanded submenus
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    sarpras: false,
    peserta_didik: false,
    rombel: false,
    nilai: false,
    bahan_ajar: true,
    jurnal_absensi: false,
  });

  // Automatically expand parent if any child is active
  useEffect(() => {
    if (['bahan_ajar_k7', 'bahan_ajar_k8', 'bahan_ajar_k9'].includes(currentMenu)) {
      setOpenSubmenus((prev) => ({ ...prev, sarpras: true }));
    }
    if (['data_siswa'].includes(currentMenu)) {
      setOpenSubmenus((prev) => ({ ...prev, peserta_didik: true }));
    }
    if (['data_kelas'].includes(currentMenu)) {
      setOpenSubmenus((prev) => ({ ...prev, rombel: true }));
    }
    if (['rekap_nilai', 'tugas_penilaian'].includes(currentMenu)) {
      setOpenSubmenus((prev) => ({ ...prev, nilai: true }));
    }
    if (['jurnal_guru', 'jurnal_sikap', 'absensi_siswa'].includes(currentMenu)) {
      setOpenSubmenus((prev) => ({ ...prev, jurnal_absensi: true }));
    }
  }, [currentMenu]);

  const toggleSubmenu = (menuKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenSubmenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const isTeacher = role === 'guru' || role === 'admin';

  return (
    <aside
      className={`fixed lg:static top-0 bottom-0 left-0 z-40 bg-[#1e2837] border-r border-[#151c27] text-slate-200 transition-all duration-300 ease-in-out flex flex-col shadow-2xl select-none ${
        isOpen ? 'w-64 translate-x-0' : 'w-0 lg:w-0 -translate-x-full lg:translate-x-0 overflow-hidden'
      }`}
    >
      {/* Top Operator Profile Box (Authentic Dapodik styling) */}
      <div className="p-3.5 border-b border-[#293548] bg-[#1a2331]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-400/60 shadow-md flex-shrink-0 bg-slate-800">
            <img
              src="/dapodik-operator-avatar.png"
              alt="Operator Avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-white truncate leading-tight">
              {profile?.full_name || 'Sadiqul Alim'}
            </h3>
            <p className="text-[11px] text-amber-300 font-medium truncate mt-0.5">
              Guru PAI
            </p>
            <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <span>●</span> Akun Terverifikasi
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Items (Authentic Dapodik List) */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#263244]/40 text-xs py-1">
        {isTeacher ? (
          <>
            {/* Beranda */}
            <button
              onClick={() => onSelectMenu('beranda')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                currentMenu === 'beranda'
                  ? 'bg-[#151c27] text-white font-bold border-l-4 border-amber-500'
                  : 'hover:bg-[#151c27]/70 text-slate-300'
              }`}
            >
              <Monitor className="w-4 h-4 text-slate-400" />
              <span>Beranda</span>
            </button>

            {/* Profil Pengguna */}
            <button
              onClick={() => onSelectMenu('profil_guru')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                currentMenu === 'profil_guru'
                  ? 'bg-[#151c27] text-white font-bold border-l-4 border-amber-500'
                  : 'hover:bg-[#151c27]/70 text-slate-300'
              }`}
            >
              <UserCheck className="w-4 h-4 text-slate-400" />
              <span>Profil Pengguna</span>
            </button>

            {/* Pesan (NEW 4) */}
            <button
              onClick={() => onSelectMenu('pesan')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                currentMenu === 'pesan'
                  ? 'bg-[#151c27] text-white font-bold border-l-4 border-amber-500'
                  : 'hover:bg-[#151c27]/70 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <span>Pesan</span>
              </div>
              <span className="bg-[#e53948] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-tighter">
                NEW 4
              </span>
            </button>

            {/* Sekolah */}
            <button
              onClick={() => onSelectMenu('profil_sekolah')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                currentMenu === 'profil_sekolah'
                  ? 'bg-[#151c27] text-white font-bold border-l-4 border-amber-500'
                  : 'hover:bg-[#151c27]/70 text-slate-300'
              }`}
            >
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Sekolah</span>
            </button>

            {/* Perangkat Ajar */}
            <button
              onClick={() => onSelectMenu('perangkat_ajar')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                currentMenu === 'perangkat_ajar'
                  ? 'bg-[#151c27] text-white font-bold border-l-4 border-amber-500'
                  : 'hover:bg-[#151c27]/70 text-slate-300'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Perangkat Ajar</span>
            </button>

            {/* Buku Pelajaran */}
            <div>
              <button
                onClick={() => toggleSubmenu('sarpras')}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#151c27]/70 text-slate-300 transition-colors ${
                  ['bahan_ajar_k7', 'bahan_ajar_k8', 'bahan_ajar_k9'].includes(currentMenu)
                    ? 'text-white font-semibold'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>Buku Pelajaran</span>
                </div>
                {openSubmenus.sarpras ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
              {openSubmenus.sarpras && (
                <div className="bg-[#17202c] py-1 pl-10 pr-3 space-y-1">
                  <button
                    onClick={() => onSelectMenu('bahan_ajar_k7')}
                    className={`w-full text-left py-1.5 text-[11px] truncate block transition-colors ${
                      currentMenu === 'bahan_ajar_k7' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Kelas 7
                  </button>
                  <button
                    onClick={() => onSelectMenu('bahan_ajar_k8')}
                    className={`w-full text-left py-1.5 text-[11px] truncate block transition-colors ${
                      currentMenu === 'bahan_ajar_k8' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Kelas 8
                  </button>
                  <button
                    onClick={() => onSelectMenu('bahan_ajar_k9')}
                    className={`w-full text-left py-1.5 text-[11px] truncate block transition-colors ${
                      currentMenu === 'bahan_ajar_k9' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Kelas 9
                  </button>
                </div>
              )}
            </div>

            {/* Peserta Didik */}
            <div>
              <button
                onClick={() => {
                  toggleSubmenu('peserta_didik');
                  onSelectMenu('data_siswa');
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#151c27]/70 text-slate-300 transition-colors ${
                  currentMenu === 'data_siswa' ? 'text-white font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Smile className="w-4 h-4 text-slate-400" />
                  <span>Peserta Didik</span>
                </div>
                {openSubmenus.peserta_didik ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
              {openSubmenus.peserta_didik && (
                <div className="bg-[#17202c] py-1 pl-10 pr-3 space-y-1">
                  <button
                    onClick={() => onSelectMenu('data_siswa')}
                    className={`w-full text-left py-1.5 text-[11px] truncate block ${
                      currentMenu === 'data_siswa' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Data 249 Siswa Aktif
                  </button>
                </div>
              )}
            </div>

            {/* Rombongan Belajar */}
            <div>
              <button
                onClick={() => {
                  toggleSubmenu('rombel');
                  onSelectMenu('data_kelas');
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#151c27]/70 text-slate-300 transition-colors ${
                  currentMenu === 'data_kelas' ? 'text-white font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Rombongan Belajar</span>
                </div>
                {openSubmenus.rombel ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
              {openSubmenus.rombel && (
                <div className="bg-[#17202c] py-1 pl-10 pr-3 space-y-1">
                  <button
                    onClick={() => onSelectMenu('data_kelas')}
                    className={`w-full text-left py-1.5 text-[11px] truncate block ${
                      currentMenu === 'data_kelas' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Data 10 Rombel (Kls 7, 8, 9)
                  </button>
                </div>
              )}
            </div>

            {/* Nilai */}
            <div>
              <button
                onClick={() => {
                  toggleSubmenu('nilai');
                  onSelectMenu('rekap_nilai');
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#151c27]/70 text-slate-300 transition-colors ${
                  ['rekap_nilai', 'tugas_penilaian'].includes(currentMenu) ? 'text-white font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <ListOrdered className="w-4 h-4 text-slate-400" />
                  <span>Nilai</span>
                </div>
                {openSubmenus.nilai ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
              {openSubmenus.nilai && (
                <div className="bg-[#17202c] py-1 pl-10 pr-3 space-y-1">
                  <button
                    onClick={() => onSelectMenu('rekap_nilai')}
                    className={`w-full text-left py-1.5 text-[11px] truncate block ${
                      currentMenu === 'rekap_nilai' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Rekap Nilai Rapor PAI
                  </button>
                  <button
                    onClick={() => onSelectMenu('tugas_penilaian')}
                    className={`w-full text-left py-1.5 text-[11px] truncate block ${
                      currentMenu === 'tugas_penilaian' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tugas & Penilaian Formatif
                  </button>
                </div>
              )}
            </div>

            {/* Media Ajar (Video Pembelajaran, Game Edukasi, LMS & Modul) */}
            <button
              onClick={() => onSelectMenu('bahan_ajar_ai')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                currentMenu === 'bahan_ajar_ai'
                  ? 'bg-[#151c27] text-white font-bold border-l-4 border-amber-500'
                  : 'hover:bg-[#151c27]/70 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Play className="w-4 h-4 text-cyan-400 fill-cyan-400/30" />
                <span>Media Ajar</span>
              </div>
              <span className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] px-1.5 py-0.2 rounded font-bold">
                Interaktif
              </span>
            </button>

            {/* Jurnal & Absensi */}
            <div>
              <button
                onClick={() => toggleSubmenu('jurnal_absensi')}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#151c27]/70 text-slate-300 transition-colors ${
                  ['jurnal_guru', 'jurnal_sikap', 'absensi_siswa'].includes(currentMenu)
                    ? 'text-white font-semibold'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarCheck2 className="w-4 h-4 text-slate-400" />
                  <span>Jurnal & Absensi</span>
                </div>
                {openSubmenus.jurnal_absensi ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
              {openSubmenus.jurnal_absensi && (
                <div className="bg-[#17202c] py-1 pl-10 pr-3 space-y-1">
                  <button
                    onClick={() => onSelectMenu('jurnal_guru')}
                    className={`w-full text-left py-1.5 text-[11px] truncate block ${
                      currentMenu === 'jurnal_guru' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Jurnal Mengajar Guru
                  </button>
                  <button
                    onClick={() => onSelectMenu('jurnal_sikap')}
                    className={`w-full text-left py-1.5 text-[11px] truncate block ${
                      currentMenu === 'jurnal_sikap' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Jurnal Penilaian Sikap
                  </button>
                  <button
                    onClick={() => onSelectMenu('absensi_siswa')}
                    className={`w-full text-left py-1.5 text-[11px] truncate block ${
                      currentMenu === 'absensi_siswa' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Absensi Siswa Per Pertemuan
                  </button>
                </div>
              )}
            </div>

            {/* Pengaturan */}
            <button
              onClick={() => onSelectMenu('master_data')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#151c27]/70 transition-colors ${
                currentMenu === 'master_data' ? 'bg-[#151c27] text-white font-bold' : 'text-slate-300'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Pengaturan</span>
            </button>

            {/* Tentang */}
            <button
              onClick={() => onSelectMenu('panduan_setup')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#151c27]/70 text-slate-300 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Tentang</span>
            </button>
          </>
        ) : (
          /* Student Menus */
          <>
            <button
              onClick={() => onSelectMenu('siswa_beranda')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#151c27]/70 text-slate-300"
            >
              <Monitor className="w-4 h-4 text-slate-400" />
              <span>Beranda Siswa</span>
            </button>
            <button
              onClick={() => onSelectMenu('siswa_profil')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#151c27]/70 text-slate-300"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Profil Saya</span>
            </button>
            <button
              onClick={() => onSelectMenu('siswa_materi')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#151c27]/70 text-slate-300"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Materi PAI</span>
            </button>
            <button
              onClick={() => onSelectMenu('siswa_video')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#151c27]/70 text-slate-300"
            >
              <Video className="w-4 h-4 text-slate-400" />
              <span>Video Pembelajaran</span>
            </button>
            <button
              onClick={() => onSelectMenu('siswa_tugas')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#151c27]/70 text-slate-300"
            >
              <ClipboardList className="w-4 h-4 text-slate-400" />
              <span>Tugas Saya</span>
            </button>
            <button
              onClick={() => onSelectMenu('siswa_kuis')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#151c27]/70 text-slate-300"
            >
              <FileQuestion className="w-4 h-4 text-slate-400" />
              <span>Kuis & CBT</span>
            </button>
            <button
              onClick={() => onSelectMenu('siswa_nilai')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#151c27]/70 text-slate-300"
            >
              <Award className="w-4 h-4 text-slate-400" />
              <span>Nilai Saya</span>
            </button>
            <button
              onClick={() => onSelectMenu('siswa_kehadiran')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#151c27]/70 text-slate-300"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Riwayat Kehadiran</span>
            </button>
            <button
              onClick={() => onSelectMenu('siswa_pesan')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                currentMenu === 'siswa_pesan'
                  ? 'bg-[#151c27] text-white font-bold border-l-4 border-amber-500'
                  : 'hover:bg-[#151c27]/70 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Pesan & Tanya Jawab</span>
              </div>
              <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-tighter">
                Q&A
              </span>
            </button>
          </>
        )}
      </div>

      {/* Red Keluar Button at the bottom (Authentic Dapodik bottom) */}
      <div className="p-0 border-t border-[#151c27]">
        <button
          onClick={logout}
          className="w-full bg-[#e53948] hover:bg-[#d42d3d] active:bg-[#c22030] text-white font-bold py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-xs tracking-wide shadow-md"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
};
