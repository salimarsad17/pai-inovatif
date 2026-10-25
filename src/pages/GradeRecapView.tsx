import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Building2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { ClassItem, StudentItem, GradeRecord } from '../types';

export const GradeRecapView: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Bobot Penilaian Guru (Dapat Diatur Bebas)
  const [weightTugas, setWeightTugas] = useState<number>(25);
  const [weightKuis, setWeightKuis] = useState<number>(20);
  const [weightPraktik, setWeightPraktik] = useState<number>(25);
  const [weightFormatif, setWeightFormatif] = useState<number>(15);
  const [weightSumatif, setWeightSumatif] = useState<number>(15);

  const [showWeightConfig, setShowWeightConfig] = useState(false);

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

    async function loadClassGrades() {
      setLoading(true);
      try {
        const [stdList, grades] = await Promise.all([
          dataService.getStudents(selectedClassId),
          dataService.getGradeRecords(selectedClassId),
        ]);
        setStudents(stdList);
        setGradeRecords(grades);
      } catch (err: any) {
        console.warn('Error loading grade recap:', err);
      } finally {
        setLoading(false);
      }
    }
    loadClassGrades();
  }, [selectedClassId]);

  // Compute average per category per student
  const studentRecap = students.map((std) => {
    const stdGrades = gradeRecords.filter((g) => g.student_id === std.id);

    const getAvg = (cat: string) => {
      const items = stdGrades.filter((g) => g.category === cat);
      if (items.length === 0) return 0;
      const sum = items.reduce((acc, curr) => acc + Number(curr.score), 0);
      return Math.round((sum / items.length) * 10) / 10;
    };

    const avgTugas = getAvg('tugas');
    const avgKuis = getAvg('kuis');
    const avgPraktik = getAvg('praktik');
    const avgFormatif = getAvg('formatif');
    const avgSumatif = getAvg('sumatif');

    const totalWeight =
      weightTugas + weightKuis + weightPraktik + weightFormatif + weightSumatif || 100;

    const finalScore = Math.round(
      ((avgTugas * weightTugas +
        avgKuis * weightKuis +
        avgPraktik * weightPraktik +
        avgFormatif * weightFormatif +
        avgSumatif * weightSumatif) /
        totalWeight) *
        10
    ) / 10;

    let predicate = 'C';
    if (finalScore >= 90) predicate = 'A (Sangat Baik)';
    else if (finalScore >= 80) predicate = 'B (Baik)';
    else if (finalScore >= 70) predicate = 'C (Cukup)';
    else if (finalScore > 0) predicate = 'D (Perlu Bimbingan)';
    else predicate = '-';

    return {
      student: std,
      avgTugas,
      avgKuis,
      avgPraktik,
      avgFormatif,
      avgSumatif,
      finalScore,
      predicate,
    };
  });

  const exportToCSV = () => {
    if (studentRecap.length === 0) return;
    const headers = [
      'No',
      'NIS',
      'Nama Peserta Didik',
      'Rata Tugas',
      'Rata Kuis',
      'Praktik',
      'Formatif',
      'Sumatif',
      'Nilai Akhir',
      'Predikat',
    ];
    const rows = studentRecap.map((r, i) => [
      i + 1,
      `"${r.student.student_number}"`,
      `"${r.student.profile?.full_name || ''}"`,
      r.avgTugas,
      r.avgKuis,
      r.avgPraktik,
      r.avgFormatif,
      r.avgSumatif,
      r.finalScore,
      `"${r.predicate}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap-nilai-pai-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <span>Rekapitulasi Nilai Pembelajaran PAI</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kompilasi nilai tugas, kuis, praktik, formatif, sumatif dengan pembobotan nilai yang dapat dikonfigurasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowWeightConfig(!showWeightConfig)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-amber-500/20"
          >
            <Sliders className="w-4 h-4" />
            <span>Atur Bobot Nilai</span>
          </button>
          <button
            onClick={exportToCSV}
            disabled={studentRecap.length === 0}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap</span>
          </button>
        </div>
      </div>

      {/* Weight Settings Drawer / Panel */}
      {showWeightConfig && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-3 animate-in fade-in">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4" /> Konfigurasi Bobot Penilaian Guru (%)
          </h3>
          <p className="text-[11px] text-slate-400">
            Sesuaikan persentase bobot masing-masing komponen penilaian sesuai kesepakatan kurikulum satuan pendidikan.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">Tugas (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={weightTugas}
                onChange={(e) => setWeightTugas(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">Kuis & CBT (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={weightKuis}
                onChange={(e) => setWeightKuis(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">Praktik Ibadah (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={weightPraktik}
                onChange={(e) => setWeightPraktik(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">Formatif (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={weightFormatif}
                onChange={(e) => setWeightFormatif(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">Sumatif Akhir (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={weightSumatif}
                onChange={(e) => setWeightSumatif(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Class Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
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

        <span className="text-xs text-slate-400 font-mono">
          {studentRecap.length} Peserta Didik
        </span>
      </div>

      {/* Recap Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Mengkalkulasi rekapitulasi nilai...
          </div>
        ) : studentRecap.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">Belum Ada Data Siswa di Kelas Ini</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Silakan tambahkan data siswa di menu &ldquo;Data Siswa&rdquo;.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">Nama Lengkap Siswa</th>
                  <th className="py-3 px-3 text-center">Tugas ({weightTugas}%)</th>
                  <th className="py-3 px-3 text-center">Kuis ({weightKuis}%)</th>
                  <th className="py-3 px-3 text-center">Praktik ({weightPraktik}%)</th>
                  <th className="py-3 px-3 text-center">Formatif ({weightFormatif}%)</th>
                  <th className="py-3 px-3 text-center">Sumatif ({weightSumatif}%)</th>
                  <th className="py-3 px-4 text-center font-bold text-amber-400">Nilai Akhir</th>
                  <th className="py-3 px-4 text-center">Predikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {studentRecap.map((r, idx) => (
                  <tr key={r.student.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {r.student.student_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {r.student.profile?.full_name || 'Tanpa Nama'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {r.avgTugas > 0 ? r.avgTugas : '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {r.avgKuis > 0 ? r.avgKuis : '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {r.avgPraktik > 0 ? r.avgPraktik : '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {r.avgFormatif > 0 ? r.avgFormatif : '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {r.avgSumatif > 0 ? r.avgSumatif : '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-extrabold text-amber-300 text-sm">
                      {r.finalScore > 0 ? r.finalScore : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[11px]">
                        {r.predicate}
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
