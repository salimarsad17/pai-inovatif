import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  BookOpen,
  Award,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { ClassItem, StudentItem, TeachingJournal, AttendanceRecord } from '../types';

export const ReportsView: React.FC = () => {
  const { schoolSettings } = useAuth();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [reportType, setReportType] = useState<
    'kehadiran' | 'jurnal' | 'siswa' | 'penilaian'
  >('kehadiran');

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [journals, setJournals] = useState<TeachingJournal[]>([]);
  const [loading, setLoading] = useState(false);

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

    async function loadReportData() {
      setLoading(true);
      try {
        const [stdList, jrnList] = await Promise.all([
          dataService.getStudents(selectedClassId),
          dataService.getJournals(selectedClassId),
        ]);
        setStudents(stdList);
        setJournals(jrnList);
      } catch (err) {
        console.warn('Report error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, [selectedClassId]);

  const handlePrint = () => {
    window.print();
  };

  const currentClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-400" />
            <span>Pusat Laporan & Rekapitulasi PAI</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Unduh dan cetak laporan kehadiran, rekap pembelajaran, dan data peserta didik resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-102"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen Laporan</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector & Class Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Type tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'kehadiran', label: 'Rekap Kehadiran' },
            { id: 'jurnal', label: 'Laporan Jurnal Mengajar' },
            { id: 'siswa', label: 'Data Induk Siswa' },
            { id: 'penilaian', label: 'Laporan Capaian Belajar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                reportType === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Class selector */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
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
      </div>

      {/* Printable Sheet Area */}
      <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200 print:p-0 print:border-none print:shadow-none">
        {/* Official School Kop Surat */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
          <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900">
            PEMERINTAH KABUPATEN WAY KANAN
          </h2>
          <h3 className="text-lg font-black uppercase text-blue-900">
            {schoolSettings?.school_name || 'UPT SMPN 2 REBANG TANGKAS'}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {schoolSettings?.school_address || 'Jl. Rebang Tangkas, Kec. Rebang Tangkas, Kab. Way Kanan, Lampung'}
          </p>
          <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-800 border-t border-slate-300 pt-2">
            LAPORAN PEMBELAJARAN PAI & BUDI PEKERTI &bull; TAHUN PELAJARAN {schoolSettings?.academic_year || '2025/2026'} ({schoolSettings?.semester || 'GANJIL'})
          </div>
        </div>

        {/* Report Metadata */}
        <div className="grid grid-cols-2 text-xs mb-4 text-slate-700">
          <div>
            <span className="font-semibold">Kelas:</span> Kelas {currentClass?.class_name || '-'}{' '}
            (Tingkat {currentClass?.grade_level || 7} SMP)
          </div>
          <div className="text-right">
            <span className="font-semibold">Tanggal Cetak:</span>{' '}
            {new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>

        {/* Content based on type */}
        {reportType === 'jurnal' ? (
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-800 mb-2">
              Rekapitulasi Jurnal Pelaksanaan Pembelajaran
            </h4>
            <table className="w-full text-left border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300 w-10">No</th>
                  <th className="p-2 border-r border-slate-300 w-28">Tanggal</th>
                  <th className="p-2 border-r border-slate-300">Materi & Tujuan</th>
                  <th className="p-2 border-r border-slate-300">Kegiatan Pembelajaran</th>
                  <th className="p-2">Refleksi / Kendala</th>
                </tr>
              </thead>
              <tbody>
                {journals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                      Belum ada data jurnal untuk kelas ini.
                    </td>
                  </tr>
                ) : (
                  journals.map((j, idx) => (
                    <tr key={j.id} className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono">
                        {new Date(j.journal_date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-semibold">{j.topic}</td>
                      <td className="p-2 border-r border-slate-200 line-clamp-2">{j.activities}</td>
                      <td className="p-2 text-slate-600">{j.reflection || j.obstacles || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-800 mb-2">
              Daftar Peserta Didik & Rekap Status
            </h4>
            <table className="w-full text-left border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300 w-10">No</th>
                  <th className="p-2 border-r border-slate-300 w-28">NIS</th>
                  <th className="p-2 border-r border-slate-300">Nama Lengkap Peserta Didik</th>
                  <th className="p-2 border-r border-slate-300 text-center w-16">L/P</th>
                  <th className="p-2 text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                      Belum ada data siswa untuk kelas ini.
                    </td>
                  </tr>
                ) : (
                  students.map((st, idx) => (
                    <tr key={st.id} className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold">
                        {st.student_number}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-medium">
                        {st.profile?.full_name || 'Tanpa Nama'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center">{st.gender || '-'}</td>
                      <td className="p-2 text-center capitalize">{st.enrollment_status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Signature Box */}
        <div className="mt-12 pt-6 grid grid-cols-2 text-xs text-center text-slate-800">
          <div>
            Mengetahui,<br />
            Kepala {schoolSettings?.school_name || 'UPT SMPN 2 Rebang Tangkas'}
            <div className="h-16" />
            <span className="font-bold underline block">
              {schoolSettings?.headmaster_name || 'H. Ahmad Fauzi, S.Ag., M.Pd.'}
            </span>
            <span className="text-[11px] text-slate-600">NIP. 19740512 200501 1 004</span>
          </div>

          <div>
            Rebang Tangkas, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
            Guru Pendidikan Agama Islam
            <div className="h-16" />
            <span className="font-bold underline block">Guru Mata Pelajaran PAI</span>
            <span className="text-[11px] text-slate-600">UPT SMPN 2 Rebang Tangkas</span>
          </div>
        </div>
      </div>
    </div>
  );
};
