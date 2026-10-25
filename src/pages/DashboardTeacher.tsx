import React, { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  BookOpen,
  ClipboardList,
  CheckCircle2,
  BookOpenCheck,
  Sparkles,
  CalendarCheck2,
  TrendingUp,
  Plus,
  ArrowUpRight,
  School,
  Clock,
  Award,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { ClassItem, StudentItem, TeachingJournal, Assignment, TeachingMaterial } from '../types';

interface DashboardTeacherProps {
  onSelectMenu: (menu: string) => void;
}

export const DashboardTeacher: React.FC<DashboardTeacherProps> = ({ onSelectMenu }) => {
  const { profile, schoolSettings } = useAuth();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [materials, setMaterials] = useState<TeachingMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [journals, setJournals] = useState<TeachingJournal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cls, std, mat, ass, jrn] = await Promise.all([
          dataService.getClasses(),
          dataService.getStudents(),
          dataService.getTeachingMaterials(),
          dataService.getAssignments(),
          dataService.getJournals(),
        ]);
        setClasses(cls);
        setStudents(std);
        setMaterials(mat);
        setAssignments(ass);
        setJournals(jrn);
      } catch (err) {
        console.warn('Dashboard data load:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalStudents = students.length;
  const totalClasses = classes.length;
  const totalMaterials = materials.length;
  const activeAssignments = assignments.filter((a) => a.publication_status === 'published').length;
  const totalJournals = journals.length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 border border-blue-800/50 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-amber-300 text-xs font-semibold mb-3">
              <School className="w-3.5 h-3.5" />
              <span>{schoolSettings?.school_name || 'UPT SMPN 2 Rebang Tangkas'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Assalamu&apos;alaikum, {profile?.full_name || 'Guru PAI'}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Selamat datang di Dashboard Administrasi & Pembelajaran PAI INOVATIF. Kelola bahan ajar, pantau kehadiran, nilai tugas, dan rancang modul ajar berbasis AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onSelectMenu('bahan_ajar_ai')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-102"
            >
              <Sparkles className="w-4 h-4" />
              <span>Buat Materi AI</span>
            </button>
            <button
              onClick={() => onSelectMenu('absensi_siswa')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-102"
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Absensi Siswa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Siswa */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Jumlah Siswa</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{totalStudents}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Terdaftar aktif</span>
        </div>

        {/* Kelas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Jumlah Kelas</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{totalClasses}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Kelas 7, 8, 9</span>
        </div>

        {/* Bahan Ajar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Bahan Ajar</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{totalMaterials}</div>
          <span className="text-[11px] text-emerald-400 mt-1 block">Materi & Video</span>
        </div>

        {/* Tugas Aktif */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tugas Aktif</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{activeAssignments}</div>
          <span className="text-[11px] text-amber-400 mt-1 block">Perlu dikerjakan</span>
        </div>

        {/* Jurnal Guru */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-700 transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Jurnal Mengajar</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <BookOpenCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{totalJournals}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Catatan pertemuan</span>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" /> Pintasan Cepat Administrasi Guru
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onSelectMenu('data_siswa')}
            className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div className="font-semibold text-xs text-white">Kelola Data Siswa</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tambah & generate akun login</div>
          </button>

          <button
            onClick={() => onSelectMenu('perangkat_ajar')}
            className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="font-semibold text-xs text-white">Perangkat Ajar</div>
            <div className="text-[11px] text-slate-400 mt-0.5">CP, TP, ATP, Modul Ajar</div>
          </button>

          <button
            onClick={() => onSelectMenu('jurnal_guru')}
            className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <BookOpenCheck className="w-4 h-4" />
            </div>
            <div className="font-semibold text-xs text-white">Tulis Jurnal Guru</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Catat refleksi kegiatan harian</div>
          </button>

          <button
            onClick={() => onSelectMenu('rekap_nilai')}
            className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/50 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
            <div className="font-semibold text-xs text-white">Rekapitulasi Nilai</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Formatif, sumatif & cetak</div>
          </button>
        </div>
      </div>

      {/* 2-Column: Kelas Binaan & Jurnal Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" /> Ringkasan Kelas & Siswa
            </h3>
            <button
              onClick={() => onSelectMenu('data_kelas')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              <span>Kelola Kelas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {classes.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
              <p className="text-xs text-slate-400 mb-3">Belum ada kelas yang ditambahkan.</p>
              <button
                onClick={() => onSelectMenu('data_kelas')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Kelas Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {classes.slice(0, 5).map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                      {cls.grade_level}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{cls.class_name}</h4>
                      <p className="text-[11px] text-slate-400">Tingkat {cls.grade_level} SMP &bull; TP {cls.academic_year}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-400">{cls.students_count || 0}</span>
                    <span className="text-[11px] text-slate-400 ml-1">Siswa</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Journals */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpenCheck className="w-4 h-4 text-emerald-400" /> Jurnal Pembelajaran Terakhir
            </h3>
            <button
              onClick={() => onSelectMenu('jurnal_guru')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              <span>Buka Jurnal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {journals.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
              <p className="text-xs text-slate-400 mb-3">Belum ada jurnal mengajar yang diinput.</p>
              <button
                onClick={() => onSelectMenu('jurnal_guru')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tulis Jurnal Hari Ini
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {journals.slice(0, 4).map((jrn) => (
                <div
                  key={jrn.id}
                  className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white truncate max-w-[220px]">
                      {jrn.topic}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(jrn.journal_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-1">{jrn.activities}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
