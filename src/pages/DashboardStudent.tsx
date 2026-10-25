import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  ClipboardList,
  FileQuestion,
  Award,
  CalendarCheck2,
  Clock,
  Sparkles,
  School,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Video,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { TeachingMaterial, Assignment, Quiz, AttendanceRecord, Announcement } from '../types';

interface DashboardStudentProps {
  onSelectMenu: (menu: string) => void;
}

export const DashboardStudent: React.FC<DashboardStudentProps> = ({ onSelectMenu }) => {
  const { profile, student, schoolSettings } = useAuth();

  const [materials, setMaterials] = useState<TeachingMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudentData() {
      if (!student) {
        setLoading(false);
        return;
      }
      try {
        const classId = student.class_id || undefined;
        const gradeLevel = student.class?.grade_level;

        const [mat, ass, qz, att, ann] = await Promise.all([
          dataService.getTeachingMaterials(gradeLevel, classId, true),
          dataService.getAssignments(classId, true),
          dataService.getQuizzes(classId, true),
          dataService.getStudentAttendanceHistory(student.id),
          dataService.getAnnouncements(classId),
        ]);

        setMaterials(mat);
        setAssignments(ass);
        setQuizzes(qz);
        setAttendance(att);
        setAnnouncements(ann);
      } catch (err) {
        console.warn('Student dashboard load:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStudentData();
  }, [student]);

  const hadirCount = attendance.filter((a) => a.status === 'hadir').length;
  const totalDays = attendance.length;
  const attendanceRate = totalDays > 0 ? Math.round((hadirCount / totalDays) * 100) : 100;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Student Greeting Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-amber-500/30 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold mb-3">
              <School className="w-3.5 h-3.5" />
              <span>{schoolSettings?.school_name || 'UPT SMPN 2 Rebang Tangkas'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Assalamu&apos;alaikum, {profile?.full_name || 'Siswa PAI'}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Semoga hari ini penuh berkah dan semangat menuntut ilmu agama Islam. Terus berprestasi dan berakhlakul karimah.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
              <div className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200">
                NIS: <span className="font-mono font-bold text-amber-400">{student?.student_number || '-'}</span>
              </div>
              <div className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200">
                Kelas: <span className="font-bold text-blue-400">{student?.class?.class_name || 'Belum ditugaskan'}</span>
              </div>
              <div className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200">
                Semester: <span className="font-medium text-emerald-400">{schoolSettings?.semester || 'Ganjil'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => onSelectMenu('siswa_tugas')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-102"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Lihat Tugas ({assignments.length})</span>
            </button>
            <button
              onClick={() => onSelectMenu('siswa_materi')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-102"
            >
              <BookOpen className="w-4 h-4" />
              <span>Buka Materi PAI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards Stat */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Materi Pembelajaran</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{materials.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Tersedia untuk kelasmu</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tugas Aktif</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{assignments.length}</div>
          <span className="text-[11px] text-amber-400 mt-1 block">Perlu dikerjakan</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Kuis & CBT</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <FileQuestion className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{quizzes.length}</div>
          <span className="text-[11px] text-purple-400 mt-1 block">Ujian terjadwal</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Kehadiran Saya</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{attendanceRate}%</div>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            {hadirCount} dari {totalDays} pertemuan
          </span>
        </div>
      </div>

      {/* 2-Columns: Tugas Menunggu & Pengumuman */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignments Pending */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-400" /> Tugas PAI Menunggu
            </h3>
            <button
              onClick={() => onSelectMenu('siswa_tugas')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1"
            >
              <span>Semua Tugas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-slate-300 font-medium">Alhamdulillah, belum ada tugas baru!</p>
              <p className="text-[11px] text-slate-500 mt-1">Gunakan waktu untuk membaca materi dan muraja&apos;ah.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {assignments.slice(0, 4).map((ass) => (
                <div
                  key={ass.id}
                  className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">{ass.title}</h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Batas: {new Date(ass.due_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectMenu('siswa_tugas')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Kerjakan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" /> Pengumuman Pembelajaran
            </h3>
            <button
              onClick={() => onSelectMenu('siswa_pengumuman')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1"
            >
              <span>Selengkapnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {announcements.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
              <p className="text-xs text-slate-400">Belum ada pengumuman untuk kelasmu saat ini.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {announcements.slice(0, 3).map((ann) => (
                <div
                  key={ann.id}
                  className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {ann.is_important && (
                      <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded">
                        Penting
                      </span>
                    )}
                    <h4 className="text-xs font-bold text-white">{ann.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
