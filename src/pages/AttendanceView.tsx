import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Printer,
  Users,
  Building2,
  Filter,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { ClassItem, StudentItem, AttendanceRecord, AttendanceStatus } from '../types';

export const AttendanceView: React.FC = () => {
  const { profile } = useAuth();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load classes initially
  useEffect(() => {
    async function initClasses() {
      const cls = await dataService.getClasses();
      setClasses(cls);
      if (cls.length > 0) {
        setSelectedClassId(cls[0].id);
      }
    }
    initClasses();
  }, []);

  // Load students & existing attendance for selected class and date
  useEffect(() => {
    if (!selectedClassId) return;

    async function loadAttendanceForDate() {
      setLoading(true);
      setAlertMsg(null);
      try {
        const [stdList, existingRecords] = await Promise.all([
          dataService.getStudents(selectedClassId),
          dataService.getAttendance(selectedClassId, attendanceDate),
        ]);

        setStudents(stdList);

        const newStatus: Record<string, AttendanceStatus> = {};
        const newNotes: Record<string, string> = {};

        // Default all active students to 'hadir'
        stdList.forEach((s) => {
          newStatus[s.id] = 'hadir';
          newNotes[s.id] = '';
        });

        // Overlay existing recorded attendance
        existingRecords.forEach((rec) => {
          newStatus[rec.student_id] = rec.status;
          if (rec.notes) newNotes[rec.student_id] = rec.notes;
        });

        setStatusMap(newStatus);
        setNotesMap(newNotes);
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: `Gagal memuat absensi: ${err.message}` });
      } finally {
        setLoading(false);
      }
    }

    loadAttendanceForDate();
  }, [selectedClassId, attendanceDate]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleNotesChange = (studentId: string, note: string) => {
    setNotesMap((prev) => ({ ...prev, [studentId]: note }));
  };

  const setAllStatus = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setStatusMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || students.length === 0) return;

    setSaveLoading(true);
    setAlertMsg(null);

    try {
      const batchRecords = students.map((s) => ({
        student_id: s.id,
        class_id: selectedClassId,
        attendance_date: attendanceDate,
        status: statusMap[s.id] || 'hadir',
        notes: notesMap[s.id] || undefined,
        recorded_by: profile?.id,
      }));

      await dataService.saveAttendanceBatch(batchRecords);
      setAlertMsg({
        type: 'success',
        text: `Data absensi tanggal ${attendanceDate} berhasil disimpan ke Supabase!`,
      });
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal menyimpan absensi: ${err.message}` });
    } finally {
      setSaveLoading(false);
    }
  };

  const hadirCount = Object.values(statusMap).filter((s) => s === 'hadir').length;
  const sakitCount = Object.values(statusMap).filter((s) => s === 'sakit').length;
  const izinCount = Object.values(statusMap).filter((s) => s === 'izin').length;
  const alpaCount = Object.values(statusMap).filter((s) => s === 'alpa').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <CalendarCheck2 className="w-6 h-6 text-emerald-400" />
            <span>Absensi Harian Siswa PAI</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Catat dan pantau kehadiran siswa: Hadir, Sakit, Izin, dan Alpa secara real-time ke database Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
          <button
            onClick={handleSaveAttendance}
            disabled={saveLoading || students.length === 0}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-102 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saveLoading ? 'Menyimpan...' : 'Simpan Absensi'}</span>
          </button>
        </div>
      </div>

      {/* Alert */}
      {alertMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            alertMsg.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
              : 'bg-rose-950/60 border border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Filter and Date Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Class Select */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 outline-none focus:border-amber-400 font-semibold"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Kelas {c.class_name} (Tingkat {c.grade_level})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>

        {/* Quick Set All Button */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs text-slate-400 hidden sm:inline">Set Semua:</span>
          <button
            type="button"
            onClick={() => setAllStatus('hadir')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 text-xs font-semibold"
          >
            Hadir Semua
          </button>
        </div>
      </div>

      {/* Attendance Stats Counter */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-center">
          <span className="text-[10px] text-emerald-400 font-semibold uppercase block">Hadir (H)</span>
          <span className="text-xl font-bold text-emerald-300">{hadirCount}</span>
        </div>
        <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-xl text-center">
          <span className="text-[10px] text-blue-400 font-semibold uppercase block">Sakit (S)</span>
          <span className="text-xl font-bold text-blue-300">{sakitCount}</span>
        </div>
        <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-xl text-center">
          <span className="text-[10px] text-amber-400 font-semibold uppercase block">Izin (I)</span>
          <span className="text-xl font-bold text-amber-300">{izinCount}</span>
        </div>
        <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-center">
          <span className="text-[10px] text-rose-400 font-semibold uppercase block">Alpa (A)</span>
          <span className="text-xl font-bold text-rose-300">{alpaCount}</span>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Memuat daftar absensi...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">Belum Ada Siswa di Kelas Ini</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Silakan tambahkan siswa ke kelas ini pada menu &ldquo;Data Siswa&rdquo;.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4 w-12">No</th>
                  <th className="py-3 px-4 w-28">NIS</th>
                  <th className="py-3 px-4">Nama Peserta Didik</th>
                  <th className="py-3 px-4 text-center w-56">Status Kehadiran</th>
                  <th className="py-3 px-4 w-64">Catatan Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {students.map((st, idx) => {
                  const currentStatus = statusMap[st.id] || 'hadir';
                  return (
                    <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {st.student_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {st.profile?.full_name || 'Tanpa Nama'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {(['hadir', 'sakit', 'izin', 'alpa'] as AttendanceStatus[]).map((status) => {
                            const isSelected = currentStatus === status;
                            let activeClass = '';
                            if (status === 'hadir') activeClass = 'bg-emerald-600 text-white font-bold';
                            if (status === 'sakit') activeClass = 'bg-blue-600 text-white font-bold';
                            if (status === 'izin') activeClass = 'bg-amber-600 text-slate-950 font-bold';
                            if (status === 'alpa') activeClass = 'bg-rose-600 text-white font-bold';

                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleStatusChange(st.id, status)}
                                className={`px-2.5 py-1 rounded-lg text-xs transition-all uppercase font-medium ${
                                  isSelected
                                    ? activeClass
                                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                                }`}
                              >
                                {status.charAt(0)}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Keterangan sakit/izin..."
                          value={notesMap[st.id] || ''}
                          onChange={(e) => handleNotesChange(st.id, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
