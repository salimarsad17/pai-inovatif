import React, { useEffect, useState } from 'react';
import {
  Landmark,
  GraduationCap,
  User,
  Smile,
  Users,
  Building2,
  HelpCircle,
  Info,
  ExternalLink,
  ClipboardList,
  Sparkles,
  BookOpen,
  CalendarCheck2,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  Save,
  Calendar,
  Plus,
  Trash2,
  Bell,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { ClassItem, StudentItem, TeachingJournal, Assignment, TeachingMaterial, Announcement } from '../types';

interface ScheduleItem {
  id: string;
  no: number;
  jam: string;
  hari: string;
  kelas: string;
  ket: string;
}

const initialDefaultSchedule: ScheduleItem[] = [
  { id: '1', no: 1, jam: '07.30 - 09.00', hari: 'Senin', kelas: 'VII.A', ket: 'PAI & BP' },
  { id: '2', no: 2, jam: '09.15 - 10.45', hari: 'Senin', kelas: 'VII.B', ket: 'PAI & BP' },
  { id: '3', no: 3, jam: '07.30 - 09.00', hari: 'Selasa', kelas: 'VIII.A', ket: 'PAI & BP' },
  { id: '4', no: 4, jam: '09.15 - 10.45', hari: 'Selasa', kelas: 'VIII.B', ket: 'PAI & BP' },
  { id: '5', no: 5, jam: '07.30 - 09.00', hari: 'Rabu', kelas: 'IX.A', ket: 'PAI & BP' },
  { id: '6', no: 6, jam: '07.30 - 09.00', hari: 'Kamis', kelas: 'IX.B', ket: 'PAI & BP' },
];

interface DashboardTeacherProps {
  onSelectMenu: (menu: string) => void;
}

export const DashboardTeacher: React.FC<DashboardTeacherProps> = ({ onSelectMenu }) => {
  const { profile, schoolSettings } = useAuth();

  const [classes, setClasses] = useState<ClassItem[]>(() => dataService.getLocalClasses());
  const [students, setStudents] = useState<StudentItem[]>(() => dataService.getLocalStudents());
  const [materials, setMaterials] = useState<TeachingMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [journals, setJournals] = useState<TeachingJournal[]>(() => dataService.getLocalJournals());
  const [teacherCount, setTeacherCount] = useState<number>(() => dataService.getTeacherCount());

  // Modals state
  const [showKpkModal, setShowKpkModal] = useState(false);
  const [showDigitalisasiModal, setShowDigitalisasiModal] = useState(false);
  const [showDayaTampungModal, setShowDayaTampungModal] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [kpkSubmitted, setKpkSubmitted] = useState(false);

  // Jadwal Pelajaran State
  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pai_jadwal_pelajaran');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return initialDefaultSchedule;
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newScheduleRow, setNewScheduleRow] = useState({
    jam: '07.30 - 09.00',
    hari: 'Senin',
    kelas: 'VII.A',
    ket: 'PAI & BP',
  });

  // Pengumuman Siswa State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementImportant, setAnnouncementImportant] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cls, std, mat, ass, jrn, tCount, ann] = await Promise.all([
          dataService.getClasses(),
          dataService.getStudents(),
          dataService.getTeachingMaterials(),
          dataService.getAssignments(),
          dataService.getJournals(),
          dataService.fetchTeacherCount(),
          dataService.getAnnouncements(),
        ]);
        setClasses(cls);
        setStudents(std);
        setMaterials(mat);
        setAssignments(ass);
        setJournals(jrn);
        setTeacherCount(tCount);
        if (ann && ann.length > 0) {
          setAnnouncements(ann);
        }
      } catch (err) {
        console.warn('Dashboard data load:', err);
      }
    }
    loadData();
  }, []);

  const totalStudents = students.length > 0 ? students.length : 249;
  const totalClasses = classes.length > 0 ? classes.length : 10;

  return (
    <div className="space-y-4 text-slate-800 font-sans animate-in fade-in pb-8">
      {/* 1. TOP METRICS BANNER (5 Colorful Gradient Cards - 1:1 Dapodik Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Jumlah Ruang Kelas (Purple Gradient) */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-[#5952a2] to-[#756ec1] text-white p-3.5 shadow-md flex items-center justify-between">
          <div className="relative z-10">
            <p className="text-[11px] font-medium opacity-90 tracking-tight">Jumlah Ruang Kelas</p>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-0.5">10</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0 text-white shadow-inner">
            <Landmark className="w-6 h-6" />
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />
        </div>

        {/* Card 2: Jumlah Guru (Cyan Gradient) */}
        <div
          onClick={() => onSelectMenu('profil_guru')}
          className="relative overflow-hidden rounded-lg bg-gradient-to-r from-[#0098ca] to-[#00c9da] text-white p-3.5 shadow-md flex items-center justify-between cursor-pointer hover:brightness-105 transition-all"
          title="Klik untuk membuka Profil Pengguna"
        >
          <div className="relative z-10">
            <p className="text-[11px] font-medium opacity-90 tracking-tight">Jumlah Guru</p>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-0.5">{teacherCount}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0 text-white shadow-inner">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />
        </div>

        {/* Card 3: Jumlah Tendik (Orange Gradient) */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-[#f06824] to-[#ea4444] text-white p-3.5 shadow-md flex items-center justify-between">
          <div className="relative z-10">
            <p className="text-[11px] font-medium opacity-90 tracking-tight">Jumlah Tendik</p>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-0.5">3</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0 text-white shadow-inner">
            <User className="w-6 h-6" />
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />
        </div>

        {/* Card 4: Jumlah Peserta Didik (Emerald Green Gradient) */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-[#07a360] to-[#39ba8f] text-white p-3.5 shadow-md flex items-center justify-between">
          <div className="relative z-10">
            <p className="text-[11px] font-medium opacity-90 tracking-tight">Jumlah Peserta Didik</p>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-0.5">{totalStudents}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0 text-white shadow-inner">
            <Smile className="w-6 h-6" />
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />
        </div>

        {/* Card 5: Jumlah Rombel (Magenta Pink Gradient) */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-[#d92c7d] to-[#ef5e96] text-white p-3.5 shadow-md flex items-center justify-between col-span-2 sm:col-span-1">
          <div className="relative z-10">
            <p className="text-[11px] font-medium opacity-90 tracking-tight">Jumlah Rombel</p>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-0.5">{totalClasses}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0 text-white shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />
        </div>
      </div>

      {/* 2. MAIN SECTION (Left: School Profile + Satu Data Poster | Right: KPK Notice & Informasi Dapodik) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: School Detail Card (7 Cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <Building2 className="w-4 h-4 text-slate-600" />
                <span>UPT SMP NEGERI 2 REBANG TANGKAS</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline-block">
                NPSN: 10806721
              </span>
            </div>

            {/* Full-width Jadwal Pelajaran (Melebar Sesuai Kotak) */}
            <div className="p-4 w-full">
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs w-full">
                <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-xs sm:text-sm">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Jadwal Pelajaran & Mengajar Guru</span>
                  </div>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 border border-blue-200/80 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Atur Jadwal</span>
                  </button>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs">
                      <tr>
                        <th className="px-4 py-2.5 text-center w-12">No</th>
                        <th className="px-4 py-2.5">Jam</th>
                        <th className="px-4 py-2.5">Hari</th>
                        <th className="px-4 py-2.5">Kelas</th>
                        <th className="px-4 py-2.5">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {scheduleList.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-2.5 text-center font-medium text-slate-500">{idx + 1}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-700 font-medium whitespace-nowrap">{item.jam}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-800">{item.hari}</td>
                          <td className="px-4 py-2.5">
                            <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-2.5 py-0.5 rounded text-xs">
                              {item.kelas}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">{item.ket}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Pesan Pembelajaran PAI */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200">
            <div className="w-full py-2.5 px-4 rounded-md bg-[#198754] text-white text-center font-bold text-xs sm:text-sm tracking-wide shadow-sm flex items-center justify-center">
              <span>Belajar untuk memperbaiki ahlak, dan menjadi manusia yang baik.</span>
            </div>
          </div>
        </div>

        {/* Right: Notices & Dapodik Information (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Pengumuman ke Siswa */}
          <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4 text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>Pengumuman ke Siswa</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  {announcements.length > 0 ? `${announcements.length} Pengumuman` : 'Aktif'}
                </span>
              </div>

              <div className="space-y-2.5 text-slate-700">
                {announcements.length > 0 ? (
                  announcements.slice(0, 2).map((a) => (
                    <div key={a.id} className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-md">
                      <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                        {a.title}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-3">
                        {a.content}
                      </p>
                      <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-amber-200/50">
                        <span>Pendidik PAI</span>
                        <span>{new Date(a.published_at || a.created_at || Date.now()).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-md">
                      <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                        Penilaian Harian PAI & Budi Pekerti
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Diberitahukan kepada seluruh siswa Fase D (Kelas 7, 8, dan 9) untuk mempersiapkan diri menghadapi evaluasi materi ibadah dan akhlak terpuji.
                      </p>
                      <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-amber-200/50">
                        <span>Untuk: Seluruh Siswa</span>
                        <span>Aktif</span>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200/60 rounded-md text-[11px]">
                      <p className="font-semibold text-slate-800">Setoran Doa & Praktik Ibadah</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">
                        Batas akhir pengumpulan hafalan surat pendek dan doa harian semester ganjil.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="w-full mt-3 py-2 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kirim Pengumuman Baru</span>
            </button>
          </div>

          {/* Card 2: Portal Layanan Guru PAI & ASN */}
          <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4 text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-800 mb-2.5 pb-1 border-b border-slate-100">
                <ExternalLink className="w-4 h-4 text-emerald-600" />
                <span>Portal Layanan Guru PAI & ASN</span>
              </div>

              <div className="space-y-3 pt-1">
                {/* Siaga Pendis Kemenag */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Siaga :
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Kemenag RI
                    </span>
                  </div>
                  <a
                    href="https://siagapendis.kemenag.go.id"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-mono break-all font-semibold"
                  >
                    <span>https://siagapendis.kemenag.go.id</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Sistem Informasi & Administrasi Guru Agama Pendidikan Islam
                  </p>
                </div>

                {/* My ASN Digital BKN */}
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      My ASN :
                    </span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      BKN RI
                    </span>
                  </div>
                  <a
                    href="https://asndigital.bkn.go.id/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-mono break-all font-semibold"
                  >
                    <span>https://asndigital.bkn.go.id/</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Layanan Mandiri Kepegawaian & Data Profil ASN Digital
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* QUICK PAI ACCESS SHORTCUTS FOR TEACHER */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              Modul Administrasi & Pembelajaran PAI Terintegrasi
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Pendidik: {profile?.full_name || 'Sadiqul Alim'}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => onSelectMenu('bahan_ajar_k7')}
            className="p-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition-all"
          >
            <div className="text-xs font-bold text-slate-800">Bahan Ajar Kelas 7</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Fase D &bull; Modul & Kuis</div>
          </button>
          <button
            onClick={() => onSelectMenu('bahan_ajar_k8')}
            className="p-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition-all"
          >
            <div className="text-xs font-bold text-slate-800">Bahan Ajar Kelas 8</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Fase D &bull; Modul & Kuis</div>
          </button>
          <button
            onClick={() => onSelectMenu('bahan_ajar_k9')}
            className="p-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition-all"
          >
            <div className="text-xs font-bold text-slate-800">Bahan Ajar Kelas 9</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Fase D &bull; Modul & Kuis</div>
          </button>
          <button
            onClick={() => onSelectMenu('jurnal_guru')}
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all"
          >
            <div className="text-xs font-bold text-slate-800">Jurnal & Absensi</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Catatan Tatap Muka</div>
          </button>
        </div>
      </div>

      {/* MODAL 1: INSTRUMEN KPK (Pendidikan Anti Korupsi) */}
      {showKpkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#344258] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-bold">Instrumen Implementasi PAK KPK 2026/2027</h3>
              </div>
              <button
                onClick={() => setShowKpkModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 text-xs text-slate-700 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded text-blue-900">
                <p className="font-semibold">Pendidikan Anti Korupsi (PAK) di Satuan Pendidikan</p>
                <p className="text-[11px] mt-0.5">
                  UPT SMP NEGERI 2 REBANG TANGKAS - Kepala Sekolah: Sugi Purwanto
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  1. Apakah sekolah telah menyisipkan materi PAK ke dalam Kurikulum/Mata Pelajaran (PAI/PPKn)?
                </label>
                <select className="w-full border border-slate-300 rounded p-2 text-xs bg-white">
                  <option>Sudah terintegrasi penuh di Modul Ajar PAI & PPKn</option>
                  <option>Sedang dalam proses pengembangan</option>
                  <option>Belum terintegrasi</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  2. Bentuk Pembiasaan Nilai Integritas Siswa di Sekolah:
                </label>
                <div className="space-y-1.5 text-slate-600 pl-1">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                    <span>Kantin Kejujuran / Kotak Kejujuran</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                    <span>Penilaian Jurnal Sikap & Karakter Siswa Harian</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                    <span>Transparansi Pengelolaan Dana BOSP Sekolah</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  3. Catatan Implementasi Kepala Sekolah / Operator:
                </label>
                <textarea
                  defaultValue="Sekolah berkomitmen mengintegrasikan nilai integritas, kejujuran, dan tanggung jawab melalui pembiasaan ibadah dan pembelajaran PAI & Budi Pekerti."
                  rows={3}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowKpkModal(false)}
                className="px-3.5 py-1.5 rounded text-slate-600 hover:bg-slate-200 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setKpkSubmitted(true);
                  setShowKpkModal(false);
                }}
                className="px-4 py-1.5 rounded bg-[#198754] hover:bg-[#157347] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simpan & Kirim Instrumen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: KONFIRMASI DIGITALISASI PENDIDIKAN */}
      {showDigitalisasiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#3b4b60] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-300" />
                <h3 className="text-sm font-bold">Konfirmasi Digitalisasi Pendidikan</h3>
              </div>
              <button
                onClick={() => setShowDigitalisasiModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 text-xs text-slate-700 space-y-3">
              <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Status: Terverifikasi Digital
                </div>
                <p className="text-[11px] mt-1">
                  UPT SMP NEGERI 2 REBANG TANGKAS telah memenuhi kriteria digitalisasi pembelajaran berbasis LMS & Bahan Ajar AI.
                </p>
              </div>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Koneksi Internet Utama:</span>
                  <span className="font-bold text-slate-800">4G / Fiber Optik (Aktif)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Komputer Lab / Chromebook:</span>
                  <span className="font-bold text-slate-800">30 Unit Tersedia</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Server LMS Sekolah:</span>
                  <span className="font-bold text-slate-800">Aktif & Sinkron (Supabase)</span>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowDigitalisasiModal(false)}
                className="px-4 py-1.5 rounded bg-[#3b4b60] hover:bg-[#2d3a4c] text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INFO DAYA TAMPUNG */}
      {showDayaTampungModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#0288d1] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                <h3 className="text-sm font-bold">Info Daya Tampung & Rombel</h3>
              </div>
              <button
                onClick={() => setShowDayaTampungModal(false)}
                className="text-slate-200 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 text-xs text-slate-700 space-y-2.5">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[11px] text-slate-500">Total Daya Tampung</div>
                  <div className="text-xl font-black text-slate-800 mt-0.5">320 Siswa</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
                  <div className="text-[11px] text-emerald-700">Terisi Saat Ini</div>
                  <div className="text-xl font-black text-emerald-800 mt-0.5">{totalStudents} Siswa</div>
                </div>
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Kelas 7 (Fase D):</span>
                  <span className="font-bold text-slate-800">4 Rombel &bull; 92 Siswa</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Kelas 8 (Fase D):</span>
                  <span className="font-bold text-slate-800">3 Rombel &bull; 81 Siswa</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Kelas 9 (Fase D):</span>
                  <span className="font-bold text-slate-800">3 Rombel &bull; 76 Siswa</span>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowDayaTampungModal(false)}
                className="px-4 py-1.5 rounded bg-[#0288d1] hover:bg-[#0277bd] text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DAFTAR PERUBAHAN (Changelog versi 2027.b) */}
      {showChangelogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#f59e0b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                <h3 className="text-sm font-bold">Daftar Perubahan Aplikasi Dapodik (versi 2027.b)</h3>
              </div>
              <button
                onClick={() => setShowChangelogModal(false)}
                className="text-amber-100 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 text-xs text-slate-700 space-y-2.5 max-h-[70vh] overflow-y-auto">
              <div className="border-l-2 border-amber-500 pl-3 space-y-1">
                <p className="font-bold text-slate-800">[Pembaruan] Integrasi Bahan Ajar PAI Fase D (Kelas 7, 8, 9)</p>
                <p className="text-[11px] text-slate-600">
                  Submenu Kelas 7, 8, 9 kini terpisah dengan materi spesifik kurikulum merdeka masing-masing tingkatan.
                </p>
              </div>
              <div className="border-l-2 border-amber-500 pl-3 space-y-1">
                <p className="font-bold text-slate-800">[Pembaruan] Struktur Menu Dapodik Resmi</p>
                <p className="text-[11px] text-slate-600">
                  Navigasi menu Sekolah langsung terhubung ke profil satuan pendidikan sesuai tata letak aplikasi Dapodik.
                </p>
              </div>
              <div className="border-l-2 border-amber-500 pl-3 space-y-1">
                <p className="font-bold text-slate-800">[Perbaikan] Sinkronisasi Database Supabase 2.104 PRODUCTION</p>
                <p className="text-[11px] text-slate-600">
                  Skema RLS dan tabel profile pengguna telah diperbaiki dengan penanganan idempotensi bebas konflik.
                </p>
              </div>
              <div className="border-l-2 border-amber-500 pl-3 space-y-1">
                <p className="font-bold text-slate-800">[Pembaruan] Tampilan Tema Aplikasi Dapodik Resmi</p>
                <p className="text-[11px] text-slate-600">
                  Antarmuka visual diperbarui penuh menyerupai standar Satu Data Pendidikan Indonesia Kemendikbudristek.
                </p>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowChangelogModal(false)}
                className="px-4 py-1.5 rounded bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ATUR JADWAL PELAJARAN */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#2d3a4d] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Atur Jadwal Pelajaran</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 text-xs text-slate-700 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Form Tambah Baris */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <span className="font-bold text-slate-800 text-xs block">Tambah Baris Jadwal Pelajaran:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Hari</label>
                    <select
                      value={newScheduleRow.hari}
                      onChange={(e) => setNewScheduleRow({ ...newScheduleRow, hari: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                    >
                      {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Jam</label>
                    <input
                      type="text"
                      placeholder="07.30 - 09.00"
                      value={newScheduleRow.jam}
                      onChange={(e) => setNewScheduleRow({ ...newScheduleRow, jam: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Kelas</label>
                    <input
                      type="text"
                      placeholder="VII.A"
                      value={newScheduleRow.kelas}
                      onChange={(e) => setNewScheduleRow({ ...newScheduleRow, kelas: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Keterangan</label>
                    <input
                      type="text"
                      placeholder="PAI & BP"
                      value={newScheduleRow.ket}
                      onChange={(e) => setNewScheduleRow({ ...newScheduleRow, ket: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newScheduleRow.jam || !newScheduleRow.kelas) return;
                    const nextList = [
                      ...scheduleList,
                      {
                        id: `sch-${Date.now()}`,
                        no: scheduleList.length + 1,
                        jam: newScheduleRow.jam,
                        hari: newScheduleRow.hari,
                        kelas: newScheduleRow.kelas,
                        ket: newScheduleRow.ket || 'PAI & BP',
                      },
                    ];
                    setScheduleList(nextList);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('pai_jadwal_pelajaran', JSON.stringify(nextList));
                    }
                  }}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambahkan ke Jadwal</span>
                </button>
              </div>

              {/* Tabel Daftar Jadwal */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700 text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="px-2 py-1.5 text-center w-8">No</th>
                      <th className="px-2 py-1.5">Jam</th>
                      <th className="px-2 py-1.5">Hari</th>
                      <th className="px-2 py-1.5">Kelas</th>
                      <th className="px-2 py-1.5">Ket</th>
                      <th className="px-2 py-1.5 text-center w-12">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {scheduleList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-2 py-1.5 text-center font-medium">{idx + 1}</td>
                        <td className="px-2 py-1.5 font-mono">{item.jam}</td>
                        <td className="px-2 py-1.5">{item.hari}</td>
                        <td className="px-2 py-1.5 font-bold text-blue-700">{item.kelas}</td>
                        <td className="px-2 py-1.5">{item.ket}</td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const filtered = scheduleList.filter((s) => s.id !== item.id);
                              setScheduleList(filtered);
                              if (typeof window !== 'undefined') {
                                localStorage.setItem('pai_jadwal_pelajaran', JSON.stringify(filtered));
                              }
                            }}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setScheduleList(initialDefaultSchedule);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('pai_jadwal_pelajaran', JSON.stringify(initialDefaultSchedule));
                  }
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Reset ke Jadwal Default
              </button>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: KIRIM PENGUMUMAN SISWA */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#2d3a4d] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">Kirim Pengumuman ke Siswa</h3>
              </div>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!announcementTitle.trim() || !announcementContent.trim()) return;
                try {
                  const created = await dataService.createAnnouncement({
                    title: announcementTitle.trim(),
                    content: announcementContent.trim(),
                    is_important: announcementImportant,
                    created_by: profile?.id,
                    published_at: new Date().toISOString(),
                  });
                  setAnnouncements([created, ...announcements]);
                  setAnnouncementTitle('');
                  setAnnouncementContent('');
                  setShowAnnouncementModal(false);
                } catch (err: any) {
                  console.warn('Error saving announcement:', err);
                }
              }}
              className="p-5 text-xs text-slate-700 space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jadwal Ujian Praktik PAI"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">Isi Pengumuman</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan informasi atau instruksi pembelajaran untuk siswa..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-important"
                  checked={announcementImportant}
                  onChange={(e) => setAnnouncementImportant(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 cursor-pointer"
                />
                <label htmlFor="chk-important" className="text-xs text-slate-700 select-none cursor-pointer">
                  Tandai sebagai Pengumuman Penting (Prioritas)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-3.5 py-1.5 rounded text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Publikasikan ke Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
