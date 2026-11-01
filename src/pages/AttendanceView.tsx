import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck2,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Printer,
  Users,
  Building2,
  FileDown,
  Download,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Layers,
  TableProperties,
  Clock,
  RotateCcw,
  Check,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { ClassItem, StudentItem, AttendanceRecord, AttendanceStatus } from '../types';
import {
  exportAttendanceMonthlyToWord,
  exportAttendanceMonthlyToPdf,
  exportAttendanceRecapToWord,
  exportAttendanceRecapToPdf,
} from '../services/exportService';

interface MonthDef {
  num: string; // '01' - '12'
  name: string;
  days: number;
}

const SEMESTER_1_MONTHS: MonthDef[] = [
  { num: '07', name: 'Juli', days: 31 },
  { num: '08', name: 'Agustus', days: 31 },
  { num: '09', name: 'September', days: 30 },
  { num: '10', name: 'Oktober', days: 31 },
  { num: '11', name: 'November', days: 30 },
  { num: '12', name: 'Desember', days: 31 },
];

const SEMESTER_2_MONTHS: MonthDef[] = [
  { num: '01', name: 'Januari', days: 31 },
  { num: '02', name: 'Februari', days: 28 },
  { num: '03', name: 'Maret', days: 31 },
  { num: '04', name: 'April', days: 30 },
  { num: '05', name: 'Mei', days: 31 },
  { num: '06', name: 'Juni', days: 30 },
];

export const AttendanceView: React.FC = () => {
  const { profile, schoolSettings } = useAuth();

  // Navigation & filter states
  const [classes, setClasses] = useState<ClassItem[]>(() => dataService.getLocalClasses());
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    const local = dataService.getLocalClasses();
    return local.length > 0 ? local[0].id : '';
  });

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // View mode: 'bulanan' (1-31), 'rekap' (Accumulation of all months), 'harian' (Quick daily)
  const [viewMode, setViewMode] = useState<'bulanan' | 'rekap' | 'harian'>('bulanan');

  // Semester & Month controls
  const [semester, setSemester] = useState<1 | 2>(1);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(1); // Default to Agustus (index 1 of Sem 1)
  const [notesState, setNotesState] = useState<Record<string, string>>({});

  // Daily input date
  const [dailyDate, setDailyDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Attendance matrix: map key `${studentId}_${dateStr}` -> AttendanceStatus
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [dailyNotesMap, setDailyNotesMap] = useState<Record<string, string>>({});

  // A4 Print & Preview modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');

  // Current semester months list
  const activeMonths = useMemo(() => {
    return semester === 1 ? SEMESTER_1_MONTHS : SEMESTER_2_MONTHS;
  }, [semester]);

  const activeMonthDef = activeMonths[selectedMonthIndex] || activeMonths[0];

  // Resolve academic years (e.g., '2025/2026' -> 2025 for Sem 1, 2026 for Sem 2)
  const currentAcademicYear = schoolSettings?.academic_year || '2025/2026';
  const yearForMonth = useMemo(() => {
    const parts = currentAcademicYear.split('/');
    if (parts.length === 2) {
      return semester === 1 ? parts[0].trim() : parts[1].trim();
    }
    const currentYear = new Date().getFullYear();
    return semester === 1 ? String(currentYear) : String(currentYear + 1);
  }, [currentAcademicYear, semester]);

  // Load classes initially
  useEffect(() => {
    async function initClasses() {
      const cls = await dataService.getClasses();
      setClasses(cls);
      if (cls.length > 0 && !selectedClassId) {
        setSelectedClassId(cls[0].id);
      }
    }
    initClasses();
  }, []);

  // When class changes or semester changes, load all students and semester attendance
  useEffect(() => {
    if (!selectedClassId) return;

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const stdList = await dataService.getStudents(selectedClassId);
        if (!isMounted) return;
        setStudents(stdList);

        // Calculate semester date range:
        // Sem 1: YYYY-07-01 to YYYY-12-31
        // Sem 2: YYYY-01-01 to YYYY-06-30
        const parts = currentAcademicYear.split('/');
        const yr1 = parts[0]?.trim() || String(new Date().getFullYear());
        const yr2 = parts[1]?.trim() || String(new Date().getFullYear() + 1);

        const startDate = semester === 1 ? `${yr1}-07-01` : `${yr2}-01-01`;
        const endDate = semester === 1 ? `${yr1}-12-31` : `${yr2}-06-30`;

        const records = await dataService.getAttendanceRange(selectedClassId, startDate, endDate);
        if (!isMounted) return;

        const newMap: Record<string, AttendanceStatus> = {};
        const newNotes: Record<string, string> = {};

        records.forEach((rec) => {
          const key = `${rec.student_id}_${rec.attendance_date}`;
          newMap[key] = rec.status;
          if (rec.notes) {
            newNotes[key] = rec.notes;
          }
        });

        // If no records at all, prefill sample attendance pattern for demonstration
        if (records.length === 0 && stdList.length > 0) {
          const sampleRecords: Array<{
            student_id: string;
            class_id: string;
            attendance_date: string;
            status: string;
          }> = [];

          // Prefill effective school days with mostly hadir, 1-2 sakit/izin/alpa
          activeMonths.forEach((m) => {
            const mYear = semester === 1 ? yr1 : yr2;
            const daysInM = m.days;
            // Seed a few school days (e.g. day 4, 11, 18, 25)
            [4, 11, 18, 25].forEach((d) => {
              if (d <= daysInM) {
                const dateStr = `${mYear}-${m.num}-${String(d).padStart(2, '0')}`;
                stdList.forEach((st, sIdx) => {
                  let stStatus: AttendanceStatus = 'hadir';
                  if (sIdx === 1 && d === 11) stStatus = 'sakit';
                  else if (sIdx === 2 && d === 18) stStatus = 'izin';
                  else if (sIdx === 4 && d === 25) stStatus = 'alpa';

                  const k = `${st.id}_${dateStr}`;
                  newMap[k] = stStatus;
                  sampleRecords.push({
                    student_id: st.id,
                    class_id: selectedClassId,
                    attendance_date: dateStr,
                    status: stStatus,
                  });
                });
              }
            });
          });

          // Save sample locally
          if (sampleRecords.length > 0) {
            dataService.saveLocalAttendanceBatch(sampleRecords);
          }
        }

        setAttendanceMap(newMap);
        setDailyNotesMap(newNotes);
      } catch (err: any) {
        if (isMounted) {
          setAlertMsg({ type: 'error', text: `Gagal memuat absensi: ${err.message}` });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedClassId, semester, currentAcademicYear]);

  // Active class name
  const activeClass = classes.find((c) => c.id === selectedClassId);
  const activeClassName = activeClass ? `Kelas ${activeClass.class_name}` : 'Semua Kelas';

  // Toggle cell status for monthly matrix 1-31
  // Sequence: H (Hadir) -> S (Sakit) -> I (Izin) -> A (Alpa) -> H (Hadir)
  const handleToggleCell = (studentId: string, dayNum: number) => {
    const dateStr = `${yearForMonth}-${activeMonthDef.num}-${String(dayNum).padStart(2, '0')}`;
    const key = `${studentId}_${dateStr}`;
    const current = attendanceMap[key];

    let next: AttendanceStatus = 'hadir';
    if (!current || current === 'hadir') next = 'sakit';
    else if (current === 'sakit') next = 'izin';
    else if (current === 'izin') next = 'alpa';
    else if (current === 'alpa') next = 'hadir';

    setAttendanceMap((prev) => ({
      ...prev,
      [key]: next,
    }));
  };

  // Quick set status for a specific date
  const handleSetDayStatus = (studentId: string, dayNum: number, status: AttendanceStatus) => {
    const dateStr = `${yearForMonth}-${activeMonthDef.num}-${String(dayNum).padStart(2, '0')}`;
    const key = `${studentId}_${dateStr}`;
    setAttendanceMap((prev) => ({
      ...prev,
      [key]: status,
    }));
  };

  // Bulk set entire month to 'hadir' for school weekdays (Mon-Sat)
  const handleFillAllHadirMonth = () => {
    if (!selectedClassId || students.length === 0) return;
    const newEntries: Record<string, AttendanceStatus> = {};

    for (let d = 1; d <= activeMonthDef.days; d++) {
      const dateStr = `${yearForMonth}-${activeMonthDef.num}-${String(d).padStart(2, '0')}`;
      const dt = new Date(`${dateStr}T00:00:00`);
      const dayOfWeek = dt.getDay(); // 0 is Sunday
      if (dayOfWeek !== 0) {
        students.forEach((st) => {
          const key = `${st.id}_${dateStr}`;
          if (!attendanceMap[key]) {
            newEntries[key] = 'hadir';
          }
        });
      }
    }

    setAttendanceMap((prev) => ({
      ...prev,
      ...newEntries,
    }));

    setAlertMsg({
      type: 'success',
      text: `Berhasil mengisi kehadiran 'Hadir' pada hari-hari sekolah bulan ${activeMonthDef.name}.`,
    });
  };

  // Save changes to database & localStorage
  const handleSaveMatrix = async () => {
    if (!selectedClassId || students.length === 0) return;
    setSaveLoading(true);
    setAlertMsg(null);

    try {
      const batch: Array<{
        student_id: string;
        class_id: string;
        attendance_date: string;
        status: string;
        notes?: string;
        recorded_by?: string;
      }> = [];

      // Collect all records in this semester from attendanceMap
      Object.entries(attendanceMap).forEach(([k, status]) => {
        const parts = k.split('_');
        if (parts.length === 2) {
          const [stId, dtStr] = parts;
          batch.push({
            student_id: stId,
            class_id: selectedClassId,
            attendance_date: dtStr,
            status,
            notes: dailyNotesMap[k] || undefined,
            recorded_by: profile?.id,
          });
        }
      });

      if (batch.length > 0) {
        await dataService.saveAttendanceBatch(batch);
      }

      setAlertMsg({
        type: 'success',
        text: `Data absensi bulan ${activeMonthDef.name} ${yearForMonth} (${batch.length} entri) berhasil disimpan!`,
      });
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal menyimpan absensi: ${err.message}` });
    } finally {
      setSaveLoading(false);
    }
  };

  // ==========================================================================
  // COMPUTED CALCULATIONS: Rekap S, I, A per bulan dan Akumulasi Semua Bulan
  // ==========================================================================

  // Per student, calculate stats for active month
  const monthlyStatsByStudent = useMemo(() => {
    const res: Record<
      string,
      {
        h: number;
        s: number;
        i: number;
        a: number;
        jumlah: number;
        daily: Record<number, string>;
      }
    > = {};

    students.forEach((st) => {
      let h = 0,
        s = 0,
        i = 0,
        a = 0;
      const daily: Record<number, string> = {};

      for (let d = 1; d <= 31; d++) {
        if (d <= activeMonthDef.days) {
          const dateStr = `${yearForMonth}-${activeMonthDef.num}-${String(d).padStart(2, '0')}`;
          const key = `${st.id}_${dateStr}`;
          const stat = attendanceMap[key];

          if (stat === 'hadir') {
            h++;
            daily[d] = 'H';
          } else if (stat === 'sakit') {
            s++;
            daily[d] = 'S';
          } else if (stat === 'izin') {
            i++;
            daily[d] = 'I';
          } else if (stat === 'alpa') {
            a++;
            daily[d] = 'A';
          } else {
            daily[d] = '.';
          }
        } else {
          daily[d] = '-';
        }
      }

      res[st.id] = {
        h,
        s,
        i,
        a,
        jumlah: s + i + a,
        daily,
      };
    });

    return res;
  }, [students, attendanceMap, activeMonthDef, yearForMonth]);

  // Per student, calculate accumulation across all 6 months of this semester
  const semesterAccumulationByStudent = useMemo(() => {
    const res: Record<
      string,
      {
        monthStats: Record<string, { s: number; i: number; a: number; h: number }>;
        totalS: number;
        totalI: number;
        totalA: number;
        totalAbsen: number;
        totalHadir: number;
        presentRate: string;
      }
    > = {};

    const parts = currentAcademicYear.split('/');
    const yr1 = parts[0]?.trim() || String(new Date().getFullYear());
    const yr2 = parts[1]?.trim() || String(new Date().getFullYear() + 1);
    const yr = semester === 1 ? yr1 : yr2;

    students.forEach((st) => {
      let totalS = 0;
      let totalI = 0;
      let totalA = 0;
      let totalHadir = 0;
      const monthStats: Record<string, { s: number; i: number; a: number; h: number }> = {};

      activeMonths.forEach((m) => {
        let mS = 0,
          mI = 0,
          mA = 0,
          mH = 0;
        for (let d = 1; d <= m.days; d++) {
          const dateStr = `${yr}-${m.num}-${String(d).padStart(2, '0')}`;
          const key = `${st.id}_${dateStr}`;
          const stat = attendanceMap[key];
          if (stat === 'sakit') mS++;
          else if (stat === 'izin') mI++;
          else if (stat === 'alpa') mA++;
          else if (stat === 'hadir') mH++;
        }
        monthStats[m.name] = { s: mS, i: mI, a: mA, h: mH };
        totalS += mS;
        totalI += mI;
        totalA += mA;
        totalHadir += mH;
      });

      const totalAbsen = totalS + totalI + totalA;
      const grandTotalDays = totalHadir + totalAbsen;
      const presentRate = grandTotalDays > 0 ? `${Math.round((totalHadir / grandTotalDays) * 100)}%` : '100%';

      res[st.id] = {
        monthStats,
        totalS,
        totalI,
        totalA,
        totalAbsen,
        totalHadir,
        presentRate,
      };
    });

    return res;
  }, [students, attendanceMap, activeMonths, currentAcademicYear, semester]);

  // Direct A4 Print trigger
  const executeA4Print = () => {
    const oldStyle = document.getElementById('a4-dynamic-attendance-style');
    if (oldStyle) oldStyle.remove();

    const styleEl = document.createElement('style');
    styleEl.id = 'a4-dynamic-attendance-style';
    styleEl.innerHTML = `
      @page {
        size: A4 landscape !important;
        margin: 8mm 10mm 10mm 10mm !important;
      }
    `;
    document.head.appendChild(styleEl);

    try {
      window.focus();
      window.print();
    } catch (e) {
      console.error('Print trigger error:', e);
      window.print();
    }
  };

  // Helper metadata for export
  const getExportMeta = () => ({
    schoolName: schoolSettings?.school_name || 'UPT SMP NEGERI 2 REBANG TANGKAS',
    schoolAddress: schoolSettings?.school_address || 'Jl. Rebang Tangkas, Kec. Rebang Tangkas, Kab. Way Kanan, Lampung 34764',
    headmasterName: schoolSettings?.headmaster_name || 'H. AHMAD ROFIQ, M.Pd.',
    headmasterNip: schoolSettings?.headmaster_nip || '19750812 200003 1 004',
    teacherName: profile?.full_name || 'SALIM ARSAD, S.Pd.I.',
    teacherNip: profile?.nip || '19840215 201101 1 012',
    academicYear: currentAcademicYear,
    semester: `Semester ${semester} (${semester === 1 ? 'Ganjil' : 'Genap'})`,
    className: activeClassName,
  });

  // Export handlers
  const handleDownloadMonthlyPdf = () => {
    try {
      const meta = {
        ...getExportMeta(),
        monthName: `${activeMonthDef.name} ${yearForMonth}`,
        daysInMonth: activeMonthDef.days,
        semesterName: `Semester ${semester} (${semester === 1 ? 'Ganjil' : 'Genap'})`,
      };

      const items = students.map((st, idx) => {
        const mStat = monthlyStatsByStudent[st.id] || { s: 0, i: 0, a: 0, jumlah: 0, daily: {} };
        const accum = semesterAccumulationByStudent[st.id] || { totalS: 0, totalI: 0, totalA: 0, totalAbsen: 0 };
        return {
          no: idx + 1,
          studentNumber: st.student_number,
          studentName: st.profile?.full_name || 'Tanpa Nama',
          gender: st.gender || '-',
          dailyStatus: mStat.daily,
          rekapS: mStat.s,
          rekapI: mStat.i,
          rekapA: mStat.a,
          rekapJumlah: mStat.jumlah,
          notes: notesState[st.id] || '',
          accumS: accum.totalS,
          accumI: accum.totalI,
          accumA: accum.totalA,
          accumJumlah: accum.totalAbsen,
        };
      });

      exportAttendanceMonthlyToPdf(meta, items);
      setAlertMsg({
        type: 'success',
        text: `Dokumen PDF Absensi Bulan ${activeMonthDef.name} berhasil diunduh.`,
      });
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: `Gagal mengunduh PDF: ${e.message}` });
    }
  };

  const handleDownloadMonthlyWord = () => {
    try {
      const meta = {
        ...getExportMeta(),
        monthName: `${activeMonthDef.name} ${yearForMonth}`,
        daysInMonth: activeMonthDef.days,
        semesterName: `Semester ${semester} (${semester === 1 ? 'Ganjil' : 'Genap'})`,
      };

      const items = students.map((st, idx) => {
        const mStat = monthlyStatsByStudent[st.id] || { s: 0, i: 0, a: 0, jumlah: 0, daily: {} };
        const accum = semesterAccumulationByStudent[st.id] || { totalS: 0, totalI: 0, totalA: 0, totalAbsen: 0 };
        return {
          no: idx + 1,
          studentNumber: st.student_number,
          studentName: st.profile?.full_name || 'Tanpa Nama',
          gender: st.gender || '-',
          dailyStatus: mStat.daily,
          rekapS: mStat.s,
          rekapI: mStat.i,
          rekapA: mStat.a,
          rekapJumlah: mStat.jumlah,
          notes: notesState[st.id] || '',
          accumS: accum.totalS,
          accumI: accum.totalI,
          accumA: accum.totalA,
          accumJumlah: accum.totalAbsen,
        };
      });

      exportAttendanceMonthlyToWord(meta, items);
      setAlertMsg({
        type: 'success',
        text: `Dokumen Microsoft Word (.doc) Absensi Bulan ${activeMonthDef.name} berhasil diunduh.`,
      });
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: `Gagal mengunduh Word: ${e.message}` });
    }
  };

  const handleDownloadRecapPdf = () => {
    try {
      const meta = {
        ...getExportMeta(),
        semesterName: `Semester ${semester} (${semester === 1 ? 'Juli s.d. Desember' : 'Januari s.d. Juni'})`,
        monthLabels: activeMonths.map((m) => m.name),
      };

      const items = students.map((st, idx) => {
        const accum = semesterAccumulationByStudent[st.id] || {
          monthStats: {},
          totalS: 0,
          totalI: 0,
          totalA: 0,
          totalAbsen: 0,
          presentRate: '100%',
        };

        return {
          no: idx + 1,
          studentNumber: st.student_number,
          studentName: st.profile?.full_name || 'Tanpa Nama',
          gender: st.gender || '-',
          monthlyStats: accum.monthStats,
          totalS: accum.totalS,
          totalI: accum.totalI,
          totalA: accum.totalA,
          totalAbsen: accum.totalAbsen,
          presentRate: accum.presentRate,
          notes: notesState[st.id] || '',
        };
      });

      exportAttendanceRecapToPdf(meta, items);
      setAlertMsg({
        type: 'success',
        text: `Dokumen PDF Rekapitulasi Akumulasi Semester ${semester} berhasil diunduh.`,
      });
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: `Gagal mengunduh PDF: ${e.message}` });
    }
  };

  const handleDownloadRecapWord = () => {
    try {
      const meta = {
        ...getExportMeta(),
        semesterName: `Semester ${semester} (${semester === 1 ? 'Juli s.d. Desember' : 'Januari s.d. Juni'})`,
        monthLabels: activeMonths.map((m) => m.name),
      };

      const items = students.map((st, idx) => {
        const accum = semesterAccumulationByStudent[st.id] || {
          monthStats: {},
          totalS: 0,
          totalI: 0,
          totalA: 0,
          totalAbsen: 0,
          presentRate: '100%',
        };

        return {
          no: idx + 1,
          studentNumber: st.student_number,
          studentName: st.profile?.full_name || 'Tanpa Nama',
          gender: st.gender || '-',
          monthlyStats: accum.monthStats,
          totalS: accum.totalS,
          totalI: accum.totalI,
          totalA: accum.totalA,
          totalAbsen: accum.totalAbsen,
          presentRate: accum.presentRate,
          notes: notesState[st.id] || '',
        };
      });

      exportAttendanceRecapToWord(meta, items);
      setAlertMsg({
        type: 'success',
        text: `Dokumen Microsoft Word (.doc) Rekapitulasi Akumulasi Semester ${semester} berhasil diunduh.`,
      });
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: `Gagal mengunduh Word: ${e.message}` });
    }
  };

  // Helper color for status in cell
  const getCellBadge = (status?: string) => {
    if (status === 'S') return 'bg-blue-600 text-white font-bold';
    if (status === 'I') return 'bg-amber-500 text-slate-950 font-bold';
    if (status === 'A') return 'bg-rose-600 text-white font-bold';
    if (status === 'H') return 'bg-emerald-600/80 text-white font-bold';
    return 'text-slate-500 hover:text-slate-300';
  };

  // Total summary counts for active month
  const totalMonthS = useMemo(() => {
    return Object.values(monthlyStatsByStudent).reduce((acc, curr) => acc + curr.s, 0);
  }, [monthlyStatsByStudent]);

  const totalMonthI = useMemo(() => {
    return Object.values(monthlyStatsByStudent).reduce((acc, curr) => acc + curr.i, 0);
  }, [monthlyStatsByStudent]);

  const totalMonthA = useMemo(() => {
    return Object.values(monthlyStatsByStudent).reduce((acc, curr) => acc + curr.a, 0);
  }, [monthlyStatsByStudent]);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* ==============================================================
          A4 PRINT DOCUMENT (ONLY VISIBLE DURING PRINT)
          Structured to conform with Indonesian school administrative standards
      ============================================================== */}
      <div id="print-attendance-document" className="print-document-container text-black bg-white">
        {/* Kop Surat Resmi Dinas Pendidikan & UPT SMPN 2 Rebang Tangkas */}
        <div className="border-b-[3px] border-black pb-2 mb-3 text-center">
          <div className="text-[11pt] font-semibold tracking-wider uppercase">
            Pemerintah Kabupaten Way Kanan &bull; Dinas Pendidikan dan Kebudayaan
          </div>
          <div className="text-[14pt] font-black uppercase tracking-wide my-0.5">
            {schoolSettings?.school_name || 'UPT SMP NEGERI 2 REBANG TANGKAS'}
          </div>
          <div className="text-[9pt] text-slate-700">
            {schoolSettings?.school_address || 'Jl. Rebang Tangkas, Kec. Rebang Tangkas, Kab. Way Kanan, Lampung 34764'} &bull; NSS: 201120803023 &bull; NPSN: 10806871
          </div>
          <div className="border-b border-black mt-1" />
        </div>

        {/* Judul Buku Absen */}
        <div className="text-center mb-3">
          <h2 className="text-[12pt] font-black uppercase tracking-wider underline">
            {viewMode === 'rekap'
              ? 'REKAPITULASI AKUMULASI KEHADIRAN SISWA DARI SEMUA BULAN'
              : 'BUKU DAFTAR HADIR / ABSENSI SISWA BULANAN (TANGGAL 1 - 31)'}
          </h2>
          <div className="text-[10pt] font-bold text-slate-900 mt-0.5">
            MATA PELAJARAN: PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI
          </div>
          <div className="text-[9pt] font-semibold text-slate-700">
            {viewMode === 'rekap'
              ? `Semester ${semester} (${semester === 1 ? 'Juli s.d. Desember' : 'Januari s.d. Juni'})`
              : `Bulan: ${activeMonthDef.name.toUpperCase()} ${yearForMonth} \u2022 Semester ${semester} (${semester === 1 ? 'Ganjil' : 'Genap'})`}{' '}
            &bull; {activeClassName} &bull; Tahun Ajaran {currentAcademicYear}
          </div>
        </div>

        {/* Metadata Guru */}
        <div className="flex justify-between items-center text-[8.5pt] mb-2 px-1">
          <div>
            <span><strong>Guru Pengampu:</strong> {profile?.full_name || 'Salim Arsad, S.Pd.I.'}</span>
            <span className="ml-3"><strong>NIP:</strong> {profile?.nip || '19840215 201101 1 012'}</span>
          </div>
          <div>
            <span><strong>Format Kertas:</strong> A4 Landscape &bull; Kode: [ . / H ] Hadir, [ S ] Sakit, [ I ] Izin, [ A ] Alpa</span>
          </div>
        </div>

        {/* PRINT TABLE: EITHER MONTHLY (1-31) OR SEMESTER RECAP */}
        {viewMode !== 'rekap' ? (
          <table className="w-full border-collapse border border-black text-[7.5pt]">
            <thead>
              <tr className="bg-slate-100 border-b border-black text-black font-bold">
                <th rowSpan={2} className="border border-black py-1 px-1 text-center w-6">No</th>
                <th rowSpan={2} className="border border-black py-1 px-1 text-center w-14">NIS</th>
                <th rowSpan={2} className="border border-black py-1 px-2 text-left min-w-[120px]">Nama Peserta Didik</th>
                <th rowSpan={2} className="border border-black py-1 px-1 text-center w-6">L/P</th>
                <th colSpan={31} className="border border-black py-1 px-1 text-center">
                  Tanggal Bulan {activeMonthDef.name} (1 - 31)
                </th>
                <th colSpan={4} className="border border-black py-1 px-1 text-center">
                  Rekap {activeMonthDef.name}
                </th>
                <th rowSpan={2} className="border border-black py-1 px-1 text-center w-14">Akumulasi<br/>(S/I/A)</th>
                <th rowSpan={2} className="border border-black py-1 px-1 text-left w-20">Ket</th>
              </tr>
              <tr className="bg-slate-100 border-b border-black text-black font-bold text-[7pt]">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <th key={d} className={`border border-black py-0.5 text-center ${d > activeMonthDef.days ? 'bg-slate-200' : ''}`}>
                    {d}
                  </th>
                ))}
                <th className="border border-black py-0.5 text-center w-5 bg-blue-50 text-blue-900">S</th>
                <th className="border border-black py-0.5 text-center w-5 bg-amber-50 text-amber-900">I</th>
                <th className="border border-black py-0.5 text-center w-5 bg-rose-50 text-rose-900">A</th>
                <th className="border border-black py-0.5 text-center w-6 bg-slate-200">Jml</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st, idx) => {
                const mStat = monthlyStatsByStudent[st.id] || { s: 0, i: 0, a: 0, jumlah: 0, daily: {} };
                const accum = semesterAccumulationByStudent[st.id] || { totalS: 0, totalI: 0, totalA: 0, totalAbsen: 0 };
                return (
                  <tr key={st.id} className="border-b border-black">
                    <td className="border border-black py-1 px-1 text-center font-bold">{idx + 1}</td>
                    <td className="border border-black py-1 px-1 text-center font-mono">{st.student_number}</td>
                    <td className="border border-black py-1 px-2 font-semibold">{st.profile?.full_name || 'Tanpa Nama'}</td>
                    <td className="border border-black py-1 px-1 text-center">{st.gender || '-'}</td>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                      if (d > activeMonthDef.days) {
                        return <td key={d} className="border border-black py-1 text-center bg-slate-100 text-slate-400">-</td>;
                      }
                      const val = mStat.daily[d] || '.';
                      let colorClass = 'text-black';
                      if (val === 'S') colorClass = 'font-bold text-blue-800';
                      if (val === 'I') colorClass = 'font-bold text-amber-800';
                      if (val === 'A') colorClass = 'font-bold text-rose-800';
                      return (
                        <td key={d} className={`border border-black py-1 text-center ${colorClass}`}>
                          {val}
                        </td>
                      );
                    })}
                    <td className="border border-black py-1 text-center font-bold text-blue-900">{mStat.s}</td>
                    <td className="border border-black py-1 text-center font-bold text-amber-900">{mStat.i}</td>
                    <td className="border border-black py-1 text-center font-bold text-rose-900">{mStat.a}</td>
                    <td className="border border-black py-1 text-center font-bold bg-slate-50">{mStat.jumlah}</td>
                    <td className="border border-black py-1 text-center font-mono text-[6.5pt]">
                      {accum.totalS}/{accum.totalI}/{accum.totalA} ({accum.totalAbsen})
                    </td>
                    <td className="border border-black py-1 px-1 text-left text-[6.5pt]">{notesState[st.id] || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse border border-black text-[8pt]">
            <thead>
              <tr className="bg-slate-100 border-b border-black text-black font-bold">
                <th rowSpan={2} className="border border-black py-1 px-1 text-center w-7">No</th>
                <th rowSpan={2} className="border border-black py-1 px-1 text-center w-16">NIS</th>
                <th rowSpan={2} className="border border-black py-1 px-2 text-left min-w-[140px]">Nama Peserta Didik</th>
                <th rowSpan={2} className="border border-black py-1 px-1 text-center w-7">L/P</th>
                {activeMonths.map((m) => (
                  <th key={m.num} colSpan={3} className="border border-black py-1 px-1 text-center">
                    {m.name}
                  </th>
                ))}
                <th colSpan={4} className="border border-black py-1 px-1 text-center bg-slate-200">
                  AKUMULASI TOTAL
                </th>
                <th rowSpan={2} className="border border-black py-1 px-1 text-center w-12">% Hadir</th>
                <th rowSpan={2} className="border border-black py-1 px-2 text-left w-24">Ket</th>
              </tr>
              <tr className="bg-slate-100 border-b border-black text-black font-bold text-[7pt]">
                {activeMonths.map((m) => (
                  <React.Fragment key={m.num}>
                    <th className="border border-black py-0.5 text-center text-blue-900 w-5">S</th>
                    <th className="border border-black py-0.5 text-center text-amber-900 w-5">I</th>
                    <th className="border border-black py-0.5 text-center text-rose-900 w-5">A</th>
                  </React.Fragment>
                ))}
                <th className="border border-black py-0.5 text-center text-blue-900 w-6 bg-blue-50">S</th>
                <th className="border border-black py-0.5 text-center text-amber-900 w-6 bg-amber-50">I</th>
                <th className="border border-black py-0.5 text-center text-rose-900 w-6 bg-rose-50">A</th>
                <th className="border border-black py-0.5 text-center bg-slate-200 w-8">Jml</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st, idx) => {
                const accum = semesterAccumulationByStudent[st.id] || {
                  monthStats: {},
                  totalS: 0,
                  totalI: 0,
                  totalA: 0,
                  totalAbsen: 0,
                  presentRate: '100%',
                };
                return (
                  <tr key={st.id} className="border-b border-black">
                    <td className="border border-black py-1 px-1 text-center font-bold">{idx + 1}</td>
                    <td className="border border-black py-1 px-1 text-center font-mono">{st.student_number}</td>
                    <td className="border border-black py-1 px-2 font-semibold">{st.profile?.full_name || 'Tanpa Nama'}</td>
                    <td className="border border-black py-1 px-1 text-center">{st.gender || '-'}</td>
                    {activeMonths.map((m) => {
                      const stStat = accum.monthStats[m.name] || { s: 0, i: 0, a: 0 };
                      return (
                        <React.Fragment key={m.num}>
                          <td className="border border-black py-1 text-center text-blue-900">{stStat.s || '-'}</td>
                          <td className="border border-black py-1 text-center text-amber-900">{stStat.i || '-'}</td>
                          <td className="border border-black py-1 text-center text-rose-900">{stStat.a || '-'}</td>
                        </React.Fragment>
                      );
                    })}
                    <td className="border border-black py-1 text-center font-bold text-blue-900 bg-blue-50">{accum.totalS}</td>
                    <td className="border border-black py-1 text-center font-bold text-amber-900 bg-amber-50">{accum.totalI}</td>
                    <td className="border border-black py-1 text-center font-bold text-rose-900 bg-rose-50">{accum.totalA}</td>
                    <td className="border border-black py-1 text-center font-bold bg-slate-200">{accum.totalAbsen}</td>
                    <td className="border border-black py-1 text-center font-bold text-emerald-800">{accum.presentRate}</td>
                    <td className="border border-black py-1 px-2 text-left text-[7pt]">{notesState[st.id] || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Tanda Tangan Pengesahan Guru & Kepala Sekolah */}
        <div className="grid grid-cols-2 mt-6 text-[8.5pt] text-center text-black font-sans">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala {schoolSettings?.school_name || 'UPT SMP NEGERI 2 REBANG TANGKAS'}</p>
            <div className="h-14" />
            <p className="font-bold underline uppercase">{schoolSettings?.headmaster_name || 'H. AHMAD ROFIQ, M.Pd.'}</p>
            <p className="text-[7.5pt]">NIP. {schoolSettings?.headmaster_nip || '19750812 200003 1 004'}</p>
          </div>
          <div>
            <p>Rebang Tangkas, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">Guru Mata Pelajaran PAI & BP</p>
            <div className="h-14" />
            <p className="font-bold underline uppercase">{profile?.full_name || 'SALIM ARSAD, S.Pd.I.'}</p>
            <p className="text-[7.5pt]">NIP. {profile?.nip || '19840215 201101 1 012'}</p>
          </div>
        </div>
      </div>

      {/* ==============================================================
          SCREEN VIEW
      ============================================================== */}
      <div className="screen-only-section space-y-6 print:hidden">

        {/* Header Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <CalendarCheck2 className="w-6 h-6 text-emerald-400" />
              <span>Buku Absensi & Daftar Hadir Siswa PAI</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Buku presensi lengkap: format tanggal <strong className="text-slate-200">1 - 31</strong>, rekap bulanan{' '}
              <strong className="text-blue-400">Sakit (S)</strong>, <strong className="text-amber-400">Izin (I)</strong>,{' '}
              <strong className="text-rose-400">Alpa (A)</strong>, <strong className="text-slate-200">Jumlah</strong>,{' '}
              <strong className="text-slate-200">Ket</strong>, dan <strong className="text-emerald-400">Akumulasi Dari Semua Bulan</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct Print to Printer */}
            <button
              type="button"
              onClick={executeA4Print}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/25 hover:scale-102 cursor-pointer"
              title="Langsung cetak dokumen absensi format A4 Landscape ke printer (1-klik)"
            >
              <Printer className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="font-extrabold tracking-wide">Cetak A4</span>
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={viewMode === 'rekap' ? handleDownloadRecapPdf : handleDownloadMonthlyPdf}
              className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-rose-600/25 hover:scale-102 cursor-pointer"
              title="Download absensi dalam format file PDF A4 Landscape"
            >
              <FileDown className="w-4 h-4 text-white" />
              <span>Download PDF</span>
            </button>

            {/* Download Word */}
            <button
              type="button"
              onClick={viewMode === 'rekap' ? handleDownloadRecapWord : handleDownloadMonthlyWord}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-600/25 hover:scale-102 cursor-pointer"
              title="Download absensi dalam format file Microsoft Word (.doc) yang dapat diedit"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Download Word</span>
            </button>

            {/* Pratinjau Modal */}
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 transition-colors border border-slate-700 shadow-sm cursor-pointer"
              title="Pratinjau tampilan dokumen A4 sebelum dicetak atau diunduh"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Pratinjau A4</span>
            </button>

            {/* Save Matrix */}
            <button
              type="button"
              onClick={handleSaveMatrix}
              disabled={saveLoading || students.length === 0}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-400/20 transition-all hover:scale-102 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>{saveLoading ? 'Menyimpan...' : 'Simpan Absensi'}</span>
            </button>
          </div>
        </div>

        {/* Alert Notification */}
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

        {/* Filter Controls Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Class Selector */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-transparent text-xs text-white outline-none font-semibold cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    Kelas {c.class_name} (Tingkat {c.grade_level})
                  </option>
                ))}
              </select>
            </div>

            {/* Semester Switcher */}
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-1">
              <button
                type="button"
                onClick={() => {
                  setSemester(1);
                  setSelectedMonthIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  semester === 1
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semester 1 (Juli - Des)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSemester(2);
                  setSelectedMonthIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  semester === 2
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semester 2 (Jan - Jun)
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('bulanan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'bulanan'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableProperties className="w-3.5 h-3.5" />
                <span>Buku Bulanan (1-31)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('rekap')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'rekap'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Rekap Akumulasi Semua Bulan</span>
              </button>
            </div>
          </div>

          {/* Quick Helper Tools */}
          {viewMode === 'bulanan' && (
            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              <button
                type="button"
                onClick={handleFillAllHadirMonth}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                title="Otomatis isi Hadir (H) pada hari Senin s.d. Sabtu untuk bulan ini"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Isi Hadir Semua Hari Sekolah</span>
              </button>
            </div>
          )}
        </div>

        {/* MONTH TABS SELECTOR (When in 'bulanan' mode) */}
        {viewMode === 'bulanan' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-1.5 min-w-max">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
                  Pilih Bulan ({semester === 1 ? 'Semester 1' : 'Semester 2'}):
                </span>
                {activeMonths.map((m, idx) => {
                  const isActive = selectedMonthIndex === idx;
                  return (
                    <button
                      key={m.num}
                      type="button"
                      onClick={() => setSelectedMonthIndex(idx)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-102'
                          : 'bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{m.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isActive ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {m.days} hr
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-slate-400 font-mono hidden md:block">
                Tahun: <strong className="text-amber-400">{yearForMonth}</strong>
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY STATS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Siswa Terdaftar</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{students.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{activeClassName}</div>
          </div>

          <div className="p-3.5 bg-blue-950/40 border border-blue-900/60 rounded-xl">
            <div className="flex items-center justify-between text-xs text-blue-400">
              <span>Sakit (S) {viewMode === 'bulanan' ? `Bulan ${activeMonthDef.name}` : 'Total'}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            </div>
            <div className="text-2xl font-black text-blue-300 mt-1">{totalMonthS}</div>
            <div className="text-[10px] text-blue-400/70 mt-0.5">Surat dokter / izin ortu</div>
          </div>

          <div className="p-3.5 bg-amber-950/40 border border-amber-900/60 rounded-xl">
            <div className="flex items-center justify-between text-xs text-amber-400">
              <span>Izin (I) {viewMode === 'bulanan' ? `Bulan ${activeMonthDef.name}` : 'Total'}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">{totalMonthI}</div>
            <div className="text-[10px] text-amber-400/70 mt-0.5">Izin keperluan keluarga</div>
          </div>

          <div className="p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl">
            <div className="flex items-center justify-between text-xs text-rose-400">
              <span>Alpa (A) {viewMode === 'bulanan' ? `Bulan ${activeMonthDef.name}` : 'Total'}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-300 mt-1">{totalMonthA}</div>
            <div className="text-[10px] text-rose-400/70 mt-0.5">Tanpa keterangan</div>
          </div>
        </div>

        {/* ==============================================================
            MAIN TABLE CONTAINER: BULANAN (1-31) OR REKAP AKUMULASI
        ============================================================== */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400">
              <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Memuat data buku absensi siswa...
            </div>
          ) : students.length === 0 ? (
            <div className="p-16 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white mb-1">Belum Ada Siswa di {activeClassName}</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Silakan tambahkan data peserta didik terlebih dahulu pada menu Data Siswa.
              </p>
            </div>
          ) : viewMode === 'bulanan' ? (
            /* ============================================================
               VIEW 1: BUKU ABSEN BULANAN (TANGGAL 1 - 31)
               Urutan: NO, NIS, NAMA, L/P, BULAN (1-31), REKAP (S,I,A), JUMLAH, KET, AKUMULASI
            ============================================================ */
            <div className="overflow-x-auto">
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    Buku Daftar Hadir &bull; Bulan {activeMonthDef.name.toUpperCase()} {yearForMonth}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    (Klik kotak tanggal untuk mengganti status: Hadir &rarr; Sakit &rarr; Izin &rarr; Alpa)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> H = Hadir
                  </span>
                  <span className="flex items-center gap-1 text-blue-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> S = Sakit
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> I = Izin
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> A = Alpa
                  </span>
                </div>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-300 font-bold text-[10px] tracking-wider uppercase">
                    <th rowSpan={2} className="py-2.5 px-2 text-center w-8 border-r border-slate-800">No</th>
                    <th rowSpan={2} className="py-2.5 px-2 text-center w-16 border-r border-slate-800">NIS</th>
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-800 min-w-[170px] sticky left-0 bg-slate-950 z-10 shadow-r">
                      Nama Peserta Didik
                    </th>
                    <th rowSpan={2} className="py-2.5 px-1 text-center w-8 border-r border-slate-800">L/P</th>
                    <th colSpan={31} className="py-1.5 px-1 text-center border-r border-slate-800 bg-slate-900/90 text-amber-300">
                      Tanggal Bulan {activeMonthDef.name} (1 - 31)
                    </th>
                    <th colSpan={4} className="py-1.5 px-1 text-center border-r border-slate-800 bg-slate-900/90 text-blue-300">
                      Rekap {activeMonthDef.name}
                    </th>
                    <th rowSpan={2} className="py-2.5 px-2 text-center w-24 border-r border-slate-800 bg-emerald-950/30 text-emerald-300">
                      Akumulasi<br/><span className="text-[9px] font-normal">(S / I / A)</span>
                    </th>
                    <th rowSpan={2} className="py-2.5 px-3 min-w-[140px]">Catatan Keterangan</th>
                  </tr>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono text-[9px]">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                      const isOutOfMonth = d > activeMonthDef.days;
                      const dateStr = `${yearForMonth}-${activeMonthDef.num}-${String(d).padStart(2, '0')}`;
                      const isSunday = !isOutOfMonth && new Date(`${dateStr}T00:00:00`).getDay() === 0;

                      return (
                        <th
                          key={d}
                          className={`py-1 text-center w-6 border-r border-slate-800/80 ${
                            isOutOfMonth
                              ? 'bg-slate-950 text-slate-700'
                              : isSunday
                              ? 'bg-rose-950/40 text-rose-400 font-bold'
                              : 'text-slate-300'
                          }`}
                        >
                          {d}
                        </th>
                      );
                    })}
                    <th className="py-1 text-center w-7 border-r border-slate-800 bg-blue-950/40 text-blue-400 font-bold">S</th>
                    <th className="py-1 text-center w-7 border-r border-slate-800 bg-amber-950/40 text-amber-400 font-bold">I</th>
                    <th className="py-1 text-center w-7 border-r border-slate-800 bg-rose-950/40 text-rose-400 font-bold">A</th>
                    <th className="py-1 text-center w-8 border-r border-slate-800 bg-slate-800 text-white font-bold">Jml</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-200">
                  {students.map((st, idx) => {
                    const mStat = monthlyStatsByStudent[st.id] || { s: 0, i: 0, a: 0, jumlah: 0, daily: {} };
                    const accum = semesterAccumulationByStudent[st.id] || { totalS: 0, totalI: 0, totalA: 0, totalAbsen: 0 };

                    return (
                      <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-2 text-center text-slate-500 font-mono border-r border-slate-800/80">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-amber-400/90 border-r border-slate-800/80">
                          {st.student_number}
                        </td>
                        <td className="py-2 px-3 font-semibold text-white border-r border-slate-800/80 sticky left-0 bg-slate-900 z-10">
                          {st.profile?.full_name || 'Tanpa Nama'}
                        </td>
                        <td className="py-2 px-1 text-center text-slate-400 border-r border-slate-800/80">
                          {st.gender || '-'}
                        </td>

                        {/* 31 Date Cells */}
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                          if (d > activeMonthDef.days) {
                            return (
                              <td key={d} className="py-1.5 px-0.5 text-center bg-slate-950/60 text-slate-700 border-r border-slate-800/50">
                                -
                              </td>
                            );
                          }

                          const dateStr = `${yearForMonth}-${activeMonthDef.num}-${String(d).padStart(2, '0')}`;
                          const key = `${st.id}_${dateStr}`;
                          const stat = attendanceMap[key];
                          const isSunday = new Date(`${dateStr}T00:00:00`).getDay() === 0;

                          let displayLetter = '.';
                          if (stat === 'hadir') displayLetter = 'H';
                          if (stat === 'sakit') displayLetter = 'S';
                          if (stat === 'izin') displayLetter = 'I';
                          if (stat === 'alpa') displayLetter = 'A';

                          return (
                            <td
                              key={d}
                              onClick={() => handleToggleCell(st.id, d)}
                              title={`${st.profile?.full_name}: Tgl ${d} ${activeMonthDef.name} -> ${stat || 'Hadir'}`}
                              className={`py-1 px-0.5 text-center border-r border-slate-800/50 cursor-pointer select-none transition-colors hover:bg-slate-700/50 ${
                                isSunday ? 'bg-rose-950/20' : ''
                              }`}
                            >
                              <span
                                className={`inline-block w-5 h-5 leading-5 text-[10px] rounded font-mono ${
                                  stat ? getCellBadge(displayLetter) : isSunday ? 'text-rose-600' : 'text-slate-600'
                                }`}
                              >
                                {displayLetter}
                              </span>
                            </td>
                          );
                        })}

                        {/* Rekap Bulanan (S, I, A, Jumlah) */}
                        <td className="py-2 px-1 text-center font-bold font-mono text-blue-400 bg-blue-950/20 border-r border-slate-800/80">
                          {mStat.s}
                        </td>
                        <td className="py-2 px-1 text-center font-bold font-mono text-amber-400 bg-amber-950/20 border-r border-slate-800/80">
                          {mStat.i}
                        </td>
                        <td className="py-2 px-1 text-center font-bold font-mono text-rose-400 bg-rose-950/20 border-r border-slate-800/80">
                          {mStat.a}
                        </td>
                        <td className="py-2 px-1 text-center font-bold font-mono text-white bg-slate-800/60 border-r border-slate-800/80">
                          {mStat.jumlah}
                        </td>

                        {/* Akumulasi Dari Semua Bulan */}
                        <td className="py-2 px-2 text-center font-mono text-[11px] bg-emerald-950/20 text-emerald-300 border-r border-slate-800/80">
                          <span>{accum.totalS}</span>/<span>{accum.totalI}</span>/<span>{accum.totalA}</span>{' '}
                          <span className="text-[10px] text-slate-400">({accum.totalAbsen})</span>
                        </td>

                        {/* Catatan / Keterangan */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            placeholder="Catatan..."
                            value={notesState[st.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNotesState((prev) => ({ ...prev, [st.id]: val }));
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 placeholder-slate-600 outline-none focus:border-amber-400"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* ============================================================
               VIEW 2: REKAPITULASI AKUMULASI SEMUA BULAN (SEMESTER 1 / SEMESTER 2)
            ============================================================ */
            <div className="overflow-x-auto">
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    Rekapitulasi Akumulasi Kehadiran Siswa Seluruh Bulan &bull; Semester {semester} ({semester === 1 ? 'Juli - Desember' : 'Januari - Juni'})
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tabel rekapitulasi lengkap: rincian Sakit (S), Izin (I), Alpa (A) tiap bulan dan akumulasi total keseluruhan.
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Kelas: <strong className="text-emerald-400">{activeClassName}</strong> &bull; Tahun Ajaran: <strong className="text-white">{currentAcademicYear}</strong>
                </div>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-300 font-bold text-[10px] tracking-wider uppercase">
                    <th rowSpan={2} className="py-2.5 px-2 text-center w-8 border-r border-slate-800">No</th>
                    <th rowSpan={2} className="py-2.5 px-2 text-center w-16 border-r border-slate-800">NIS</th>
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-800 min-w-[180px] sticky left-0 bg-slate-950 z-10">
                      Nama Peserta Didik
                    </th>
                    <th rowSpan={2} className="py-2.5 px-1 text-center w-8 border-r border-slate-800">L/P</th>
                    {activeMonths.map((m) => (
                      <th key={m.num} colSpan={3} className="py-1.5 px-1 text-center border-r border-slate-800 bg-slate-900/90 text-amber-300">
                        {m.name}
                      </th>
                    ))}
                    <th colSpan={4} className="py-1.5 px-1 text-center border-r border-slate-800 bg-slate-800 text-white font-black">
                      AKUMULASI TOTAL
                    </th>
                    <th rowSpan={2} className="py-2.5 px-2 text-center w-16 border-r border-slate-800 bg-emerald-950/40 text-emerald-300">
                      % Hadir
                    </th>
                    <th rowSpan={2} className="py-2.5 px-3 min-w-[140px]">Keterangan</th>
                  </tr>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono text-[9px]">
                    {activeMonths.map((m) => (
                      <React.Fragment key={m.num}>
                        <th className="py-1 text-center w-6 border-r border-slate-800 text-blue-400">S</th>
                        <th className="py-1 text-center w-6 border-r border-slate-800 text-amber-400">I</th>
                        <th className="py-1 text-center w-6 border-r border-slate-800 text-rose-400">A</th>
                      </React.Fragment>
                    ))}
                    <th className="py-1 text-center w-7 border-r border-slate-800 bg-blue-950 text-blue-300 font-bold">S</th>
                    <th className="py-1 text-center w-7 border-r border-slate-800 bg-amber-950 text-amber-300 font-bold">I</th>
                    <th className="py-1 text-center w-7 border-r border-slate-800 bg-rose-950 text-rose-300 font-bold">A</th>
                    <th className="py-1 text-center w-8 border-r border-slate-800 bg-slate-700 text-white font-bold">Jml</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-200">
                  {students.map((st, idx) => {
                    const accum = semesterAccumulationByStudent[st.id] || {
                      monthStats: {},
                      totalS: 0,
                      totalI: 0,
                      totalA: 0,
                      totalAbsen: 0,
                      presentRate: '100%',
                    };

                    return (
                      <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-2 text-center text-slate-500 font-mono border-r border-slate-800/80">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-400/90 border-r border-slate-800/80">
                          {st.student_number}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white border-r border-slate-800/80 sticky left-0 bg-slate-900 z-10">
                          {st.profile?.full_name || 'Tanpa Nama'}
                        </td>
                        <td className="py-2.5 px-1 text-center text-slate-400 border-r border-slate-800/80">
                          {st.gender || '-'}
                        </td>

                        {/* Each Month Stats (S, I, A) */}
                        {activeMonths.map((m) => {
                          const mStat = accum.monthStats[m.name] || { s: 0, i: 0, a: 0 };
                          return (
                            <React.Fragment key={m.num}>
                              <td className="py-2 px-1 text-center font-mono text-blue-400/80 border-r border-slate-800/50">
                                {mStat.s || '-'}
                              </td>
                              <td className="py-2 px-1 text-center font-mono text-amber-400/80 border-r border-slate-800/50">
                                {mStat.i || '-'}
                              </td>
                              <td className="py-2 px-1 text-center font-mono text-rose-400/80 border-r border-slate-800/50">
                                {mStat.a || '-'}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        {/* Akumulasi Total */}
                        <td className="py-2 px-1 text-center font-mono font-bold text-blue-300 bg-blue-950/30 border-r border-slate-800/80">
                          {accum.totalS}
                        </td>
                        <td className="py-2 px-1 text-center font-mono font-bold text-amber-300 bg-amber-950/30 border-r border-slate-800/80">
                          {accum.totalI}
                        </td>
                        <td className="py-2 px-1 text-center font-mono font-bold text-rose-300 bg-rose-950/30 border-r border-slate-800/80">
                          {accum.totalA}
                        </td>
                        <td className="py-2 px-1 text-center font-mono font-black text-white bg-slate-800 border-r border-slate-800/80">
                          {accum.totalAbsen}
                        </td>

                        {/* % Hadir */}
                        <td className="py-2 px-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20 border-r border-slate-800/80">
                          {accum.presentRate}
                        </td>

                        {/* Catatan */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            placeholder="Catatan semester..."
                            value={notesState[st.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNotesState((prev) => ({ ...prev, [st.id]: val }));
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 placeholder-slate-600 outline-none focus:border-amber-400"
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

      {/* ==============================================================
          A4 PRINT & PREVIEW MODAL
      ============================================================== */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Printer className="w-5 h-5 text-amber-400" />
                  <span>Pratinjau Dokumen Absensi A4 (Landscape)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Format standar tata kelola buku absensi sekolah: Kop Dinas, data sekolah, tabel matriks dan tanda tangan resmi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg"
              >
                &times;
              </button>
            </div>

            {/* Preview Sheet Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/70">
              <div className="bg-white text-black p-6 rounded-xl shadow-2xl border border-slate-200 text-xs overflow-x-auto font-serif">
                {/* Kop Dinas Preview */}
                <div className="border-b-[3px] border-black pb-2 mb-3 text-center">
                  <div className="text-[10pt] font-semibold uppercase tracking-wider text-black">
                    Pemerintah Kabupaten Way Kanan &bull; Dinas Pendidikan dan Kebudayaan
                  </div>
                  <div className="text-[12pt] font-black uppercase text-black my-0.5">
                    {schoolSettings?.school_name || 'UPT SMP NEGERI 2 REBANG TANGKAS'}
                  </div>
                  <div className="text-[8pt] text-slate-700">
                    {schoolSettings?.school_address || 'Jl. Rebang Tangkas, Kec. Rebang Tangkas, Kab. Way Kanan, Lampung 34764'} &bull; NSS: 201120803023 &bull; NPSN: 10806871
                  </div>
                  <div className="border-b border-black mt-1" />
                </div>

                {/* Judul Dokumen Preview */}
                <div className="text-center mb-3">
                  <h4 className="text-[11pt] font-black uppercase tracking-wider underline text-black">
                    {viewMode === 'rekap'
                      ? 'REKAPITULASI AKUMULASI KEHADIRAN SISWA DARI SEMUA BULAN'
                      : 'BUKU DAFTAR HADIR / ABSENSI SISWA BULANAN (TANGGAL 1 - 31)'}
                  </h4>
                  <div className="text-[9pt] font-bold text-slate-800">
                    MATA PELAJARAN: PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI
                  </div>
                  <div className="text-[8pt] text-slate-600">
                    {viewMode === 'rekap'
                      ? `Semester ${semester} (${semester === 1 ? 'Juli s.d. Desember' : 'Januari s.d. Juni'})`
                      : `Bulan: ${activeMonthDef.name.toUpperCase()} ${yearForMonth} \u2022 Semester ${semester}`}{' '}
                    &bull; {activeClassName} &bull; Tahun Ajaran {currentAcademicYear}
                  </div>
                </div>

                {/* Signatures Preview */}
                <div className="grid grid-cols-2 mt-8 text-[8pt] text-center text-black font-sans">
                  <div>
                    <p>Mengetahui,</p>
                    <p className="font-bold">Kepala {schoolSettings?.school_name || 'UPT SMP NEGERI 2 REBANG TANGKAS'}</p>
                    <div className="h-10" />
                    <p className="font-bold underline">{schoolSettings?.headmaster_name || 'H. AHMAD ROFIQ, M.Pd.'}</p>
                    <p className="text-[7pt]">NIP. {schoolSettings?.headmaster_nip || '19750812 200003 1 004'}</p>
                  </div>
                  <div>
                    <p>Rebang Tangkas, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="font-bold">Guru Mata Pelajaran PAI & BP</p>
                    <div className="h-10" />
                    <p className="font-bold underline">{profile?.full_name || 'SALIM ARSAD, S.Pd.I.'}</p>
                    <p className="text-[7pt]">NIP. {profile?.nip || '19840215 201101 1 012'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup Pratinjau
              </button>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={viewMode === 'rekap' ? handleDownloadRecapPdf : handleDownloadMonthlyPdf}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all hover:scale-102 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={viewMode === 'rekap' ? handleDownloadRecapWord : handleDownloadMonthlyWord}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all hover:scale-102 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Word</span>
                </button>

                <button
                  type="button"
                  onClick={executeA4Print}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-400/25 transition-all hover:scale-102 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-950" />
                  <span>Cetak Dokumen Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
