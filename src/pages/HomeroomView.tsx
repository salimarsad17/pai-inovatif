import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  CalendarCheck2,
  HeartHandshake,
  Building2,
  CheckCircle2,
  Phone,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { ClassItem, StudentItem, AttitudeRecord } from '../types';

export const HomeroomView: React.FC = () => {
  const { profile } = useAuth();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [attitudeRecords, setAttitudeRecords] = useState<AttitudeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const cls = await dataService.getClasses();
      setClasses(cls);
      if (cls.length > 0) setSelectedClassId(cls[0].id);
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;

    async function loadData() {
      setLoading(true);
      try {
        const [stdList, attList] = await Promise.all([
          dataService.getStudents(selectedClassId),
          dataService.getAttitudeRecords(undefined, selectedClassId),
        ]);
        setStudents(stdList);
        setAttitudeRecords(attList);
      } catch (err) {
        console.warn('Homeroom error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedClassId]);

  const activeClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <span>Portal Pembina / Guru Wali Kelas</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pantau perkembangan akhlak, rekap kehadiran, dan bimbingan konseling kelas binaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 outline-none focus:border-amber-400 font-semibold"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Kelas Binaan: {c.class_name} (Tingkat {c.grade_level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Class Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Siswa Binaan</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{students.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Rombel {activeClass?.class_name}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Catatan Pembinaan Sikap</span>
            <HeartHandshake className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{attitudeRecords.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Perilaku teramati</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Tahun Pelajaran</span>
            <CalendarCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{activeClass?.academic_year || '2025/2026'}</div>
          <span className="text-[11px] text-emerald-400 mt-1 block">Semester Aktif</span>
        </div>
      </div>

      {/* Students list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Daftar Siswa Binaan Kelas {activeClass?.class_name}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Memuat siswa binaan...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">L/P</th>
                  <th className="py-3 px-4">Kontak Siswa</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {students.map((st, i) => (
                  <tr key={st.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-500 font-mono">{i + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{st.student_number}</td>
                    <td className="py-3 px-4 font-semibold text-white">{st.profile?.full_name}</td>
                    <td className="py-3 px-4">{st.gender || '-'}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {st.profile?.phone || 'Belum ada'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {st.enrollment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
