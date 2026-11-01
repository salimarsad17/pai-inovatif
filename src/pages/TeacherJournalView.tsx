import React, { useState, useEffect } from 'react';
import {
  BookOpenCheck,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Building2,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Users,
  Search,
  Sparkles,
  Download,
  Eye,
  RefreshCw,
  X,
  FileDown,
  Check,
  FileCheck,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { TeachingJournal, ClassItem } from '../types';
import { exportTeacherJournalToWord, exportTeacherJournalToPdf } from '../services/exportService';

export const TeacherJournalView: React.FC = () => {
  const { profile, schoolSettings } = useAuth();

  const [journals, setJournals] = useState<TeachingJournal[]>(() => dataService.getLocalJournals());
  const [classes, setClasses] = useState<ClassItem[]>(() => dataService.getLocalClasses());
  const [loading, setLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<TeachingJournal | null>(null);

  // A4 Print Modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [printClassId, setPrintClassId] = useState<string>('');

  // Form fields matching user requirements:
  // no, hari/tanggal, kelas, jam, Materi Pokok, kegiatan KBM, Kehadiran siswa (S,I,A), Ket
  const [classId, setClassId] = useState('');
  const [journalDate, setJournalDate] = useState(new Date().toISOString().slice(0, 10));
  const [teachingHour, setTeachingHour] = useState('Jam ke-1 s.d 2 (07.30 - 08.50)');
  const [topic, setTopic] = useState('');
  const [activities, setActivities] = useState('');
  const [attendanceS, setAttendanceS] = useState<number | string>(0);
  const [attendanceI, setAttendanceI] = useState<number | string>(0);
  const [attendanceA, setAttendanceA] = useState<number | string>(0);
  const [notes, setNotes] = useState('KBM terlaksana tuntas dan tertib');

  // Additional optional fields
  const [learningObjectives, setLearningObjectives] = useState('');
  const [methods, setMethods] = useState('');
  const [reflection, setReflection] = useState('');

  // Detail modal state
  const [detailItem, setDetailItem] = useState<TeachingJournal | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clsList, jrnList] = await Promise.all([
        dataService.getClasses(),
        dataService.getJournals(selectedClassId || undefined),
      ]);
      setClasses(clsList);
      setJournals(jrnList);
      if (!classId && clsList.length > 0) {
        setClassId(clsList[0].id);
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal memuat jurnal: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId]);

  // Quick preset hours
  const HOUR_OPTIONS = [
    'Jam ke-1 s.d 2 (07.30 - 08.50)',
    'Jam ke-3 s.d 4 (09.05 - 10.25)',
    'Jam ke-5 s.d 6 (10.40 - 12.00)',
    'Jam ke-7 s.d 8 (13.00 - 14.20)',
    'Jam ke-1 s.d 3 (07.30 - 09.30)',
  ];

  // Quick standard KBM template
  const handleApplyKbmTemplate = () => {
    setActivities(
      '1. Pendahuluan:\n' +
      '   - Berdoa bersama dan tadarus Al-Qur’an / Asmaul Husna.\n' +
      '   - Memeriksa kehadiran (S, I, A), kerapihan kelas, dan apersepsi materi.\n' +
      '2. Kegiatan Inti:\n' +
      '   - Penjelasan materi pokok dengan tanya jawab interaktif.\n' +
      '   - Diskusi kelompok dan pemecahan kasus kontekstual islami.\n' +
      '   - Presentasi hasil analisis kelompok dan apresiasi guru.\n' +
      '3. Penutup:\n' +
      '   - Pengambilan kesimpulan bersama & refleksi pemahaman siswa.\n' +
      '   - Doa kafaratul majelis dan penutup.'
    );
  };

  // Auto-sync attendance from attendance_records for that class and date
  const handleSyncAttendance = async () => {
    if (!classId || !journalDate) {
      setAlertMsg({ type: 'error', text: 'Pilih kelas dan tanggal terlebih dahulu.' });
      return;
    }

    setIsFetchingAttendance(true);
    try {
      const records = await dataService.getAttendance(classId, journalDate);
      if (records && records.length > 0) {
        let countS = 0;
        let countI = 0;
        let countA = 0;
        records.forEach((rec) => {
          if (rec.status === 'sakit') countS++;
          else if (rec.status === 'izin') countI++;
          else if (rec.status === 'alpa') countA++;
        });
        setAttendanceS(countS);
        setAttendanceI(countI);
        setAttendanceA(countA);
        setAlertMsg({
          type: 'success',
          text: `Berhasil menarik data absensi: S=${countS}, I=${countI}, A=${countA}`,
        });
      } else {
        setAlertMsg({
          type: 'error',
          text: `Belum ada data absensi tercatat untuk kelas ini pada tanggal ${journalDate}.`,
        });
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: `Gagal menarik absensi: ${e.message}` });
    } finally {
      setIsFetchingAttendance(false);
    }
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    setJournalDate(new Date().toISOString().slice(0, 10));
    setTeachingHour('Jam ke-1 s.d 2 (07.30 - 08.50)');
    setTopic('');
    setActivities(
      '1. Pendahuluan: Berdoa bersama, tadarus QS Al-Baqarah, apersepsi.\n' +
      '2. Kegiatan Inti: Pemaparan materi, diskusi kelompok terarah, tanya jawab.\n' +
      '3. Penutup: Refleksi pembelajaran, kesimpulan, dan doa penutup.'
    );
    setAttendanceS(0);
    setAttendanceI(0);
    setAttendanceA(0);
    setNotes('KBM berjalan tertib, siswa aktif berpartisipasi.');
    setLearningObjectives('');
    setMethods('Diskusi, Tanya Jawab, Ceramah Interaktif');
    setReflection('');
    setShowModal(true);
  };

  const handleOpenEdit = (jrn: TeachingJournal) => {
    setEditItem(jrn);
    setClassId(jrn.class_id);
    setJournalDate(jrn.journal_date);
    setTeachingHour(jrn.teaching_hour || 'Jam ke-1 s.d 2 (07.30 - 08.50)');
    setTopic(jrn.topic);
    setActivities(jrn.activities);
    setAttendanceS(jrn.attendance_s ?? 0);
    setAttendanceI(jrn.attendance_i ?? 0);
    setAttendanceA(jrn.attendance_a ?? 0);
    setNotes(jrn.notes || jrn.reflection || '');
    setLearningObjectives(jrn.learning_objectives || '');
    setMethods(jrn.methods || '');
    setReflection(jrn.reflection || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !topic.trim() || !activities.trim()) {
      setAlertMsg({ type: 'error', text: 'Kelas, Materi Pokok, dan Kegiatan KBM wajib diisi.' });
      return;
    }

    setFormLoading(true);
    setAlertMsg(null);

    try {
      const payload: Partial<TeachingJournal> = {
        teacher_id: profile?.id || 'guru-1',
        class_id: classId,
        journal_date: journalDate,
        teaching_hour: teachingHour.trim(),
        topic: topic.trim(),
        activities: activities.trim(),
        attendance_s: Number(attendanceS) || 0,
        attendance_i: Number(attendanceI) || 0,
        attendance_a: Number(attendanceA) || 0,
        notes: notes.trim() || 'KBM terlaksana dengan baik',
        learning_objectives: learningObjectives.trim() || topic.trim(),
        methods: methods.trim(),
        reflection: reflection.trim() || notes.trim(),
      };

      if (editItem) {
        await dataService.updateJournal(editItem.id, payload);
        setAlertMsg({ type: 'success', text: 'Jurnal mengajar berhasil diperbarui.' });
      } else {
        await dataService.createJournal(payload);
        setAlertMsg({ type: 'success', text: 'Jurnal mengajar baru berhasil disimpan ke agenda.' });
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal menyimpan jurnal: ${err.message}` });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus baris jurnal ini?')) return;
    try {
      await dataService.deleteJournal(id);
      setAlertMsg({ type: 'success', text: 'Baris jurnal berhasil dihapus.' });
      loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal menghapus: ${err.message}` });
    }
  };

  // Helper format day and date
  const formatDayAndDate = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr + 'T00:00:00');
      const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
      const fullDate = dateObj.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return { dayName, fullDate };
    } catch {
      return { dayName: 'Hari', fullDate: dateStr };
    }
  };

  // Trigger print directly with explicit A4 paper setup in browser
  const executeA4Print = (orientation: 'landscape' | 'portrait' = printOrientation) => {
    // Keep orientation state in sync
    setPrintOrientation(orientation);

    // Clean any prior injected print style
    const oldStyle = document.getElementById('a4-dynamic-print-style');
    if (oldStyle) oldStyle.remove();

    // Inject strict A4 page rule for the browser's printer driver
    const styleEl = document.createElement('style');
    styleEl.id = 'a4-dynamic-print-style';
    styleEl.innerHTML = `
      @page {
        size: A4 ${orientation} !important;
        margin: ${orientation === 'landscape' ? '8mm 10mm 10mm 10mm' : '10mm 12mm 12mm 12mm'} !important;
      }
    `;
    document.head.appendChild(styleEl);

    // Directly trigger the native browser print dialog in the active user gesture
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.error('Error invoking print dialog:', e);
      window.print();
    }
  };

  // Filter journals based on class and search keyword for screen table
  const filteredJournals = journals.filter((j) => {
    if (selectedClassId && j.class_id !== selectedClassId) return false;
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const matchTopic = j.topic?.toLowerCase().includes(kw);
      const matchKBM = j.activities?.toLowerCase().includes(kw);
      const matchClass = j.class?.class_name?.toLowerCase().includes(kw);
      const matchKet = j.notes?.toLowerCase().includes(kw);
      return matchTopic || matchKBM || matchClass || matchKet;
    }
    return true;
  });

  // Filter journals for print document
  const journalsForPrint = journals.filter((j) => {
    if (printClassId && j.class_id !== printClassId) return false;
    if (!printClassId && selectedClassId && j.class_id !== selectedClassId) return false;
    return true;
  });

  const printClassName = printClassId
    ? classes.find((c) => c.id === printClassId)?.class_name
    : selectedClassId
    ? classes.find((c) => c.id === selectedClassId)?.class_name
    : 'Semua Kelas';

  // Export handlers for PDF & Word download
  const handleDownloadPdf = () => {
    try {
      const meta = {
        schoolName: schoolSettings?.school_name || 'UPT SMP NEGERI 2 REBANG TANGKAS',
        schoolAddress: schoolSettings?.school_address || 'Jl. Rebang Tangkas, Kec. Rebang Tangkas, Kab. Way Kanan, Lampung 34764',
        headmasterName: schoolSettings?.headmaster_name || 'H. AHMAD ROFIQ, M.Pd.',
        headmasterNip: schoolSettings?.headmaster_nip || '19750812 200003 1 004',
        teacherName: profile?.full_name || 'SALIM ARSAD, S.Pd.I.',
        teacherNip: profile?.nip || '19840215 201101 1 012',
        academicYear: schoolSettings?.academic_year || '2025/2026',
        semester: schoolSettings?.semester || 'Ganjil',
        className: printClassName || 'Semua Kelas',
      };

      const exportItems = journalsForPrint.map((jrn, idx) => {
        const { dayName, fullDate } = formatDayAndDate(jrn.journal_date);
        const sVal = Number(jrn.attendance_s) || 0;
        const iVal = Number(jrn.attendance_i) || 0;
        const aVal = Number(jrn.attendance_a) || 0;
        return {
          no: idx + 1,
          dateStr: jrn.journal_date,
          dayName,
          fullDate,
          className: jrn.class?.class_name || printClassName || 'VII A',
          hour: jrn.teaching_hour || '-',
          topic: jrn.topic || '-',
          activities: jrn.activities || '-',
          attendanceStr: `S:${sVal} I:${iVal} A:${aVal}`,
          notes: jrn.notes || 'KBM terlaksana dengan tuntas',
        };
      });

      exportTeacherJournalToPdf(meta, exportItems);
      setAlertMsg({
        type: 'success',
        text: `Dokumen PDF Jurnal Mengajar (${exportItems.length} baris) berhasil diunduh.`,
      });
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal mengunduh PDF: ${err.message}` });
    }
  };

  const handleDownloadWord = () => {
    try {
      const meta = {
        schoolName: schoolSettings?.school_name || 'UPT SMP NEGERI 2 REBANG TANGKAS',
        schoolAddress: schoolSettings?.school_address || 'Jl. Rebang Tangkas, Kec. Rebang Tangkas, Kab. Way Kanan, Lampung 34764',
        headmasterName: schoolSettings?.headmaster_name || 'H. AHMAD ROFIQ, M.Pd.',
        headmasterNip: schoolSettings?.headmaster_nip || '19750812 200003 1 004',
        teacherName: profile?.full_name || 'SALIM ARSAD, S.Pd.I.',
        teacherNip: profile?.nip || '19840215 201101 1 012',
        academicYear: schoolSettings?.academic_year || '2025/2026',
        semester: schoolSettings?.semester || 'Ganjil',
        className: printClassName || 'Semua Kelas',
      };

      const exportItems = journalsForPrint.map((jrn, idx) => {
        const { dayName, fullDate } = formatDayAndDate(jrn.journal_date);
        const sVal = Number(jrn.attendance_s) || 0;
        const iVal = Number(jrn.attendance_i) || 0;
        const aVal = Number(jrn.attendance_a) || 0;
        return {
          no: idx + 1,
          dateStr: jrn.journal_date,
          dayName,
          fullDate,
          className: jrn.class?.class_name || printClassName || 'VII A',
          hour: jrn.teaching_hour || '-',
          topic: jrn.topic || '-',
          activities: jrn.activities || '-',
          attendanceStr: `S:${sVal} I:${iVal} A:${aVal}`,
          notes: jrn.notes || 'KBM terlaksana dengan tuntas',
        };
      });

      exportTeacherJournalToWord(meta, exportItems);
      setAlertMsg({
        type: 'success',
        text: `Dokumen Microsoft Word (.doc) Jurnal Mengajar (${exportItems.length} baris) berhasil diunduh.`,
      });
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal mengunduh Word: ${err.message}` });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* ==============================================================
          A4 PRINT DOCUMENT (ONLY VISIBLE DURING PRINT)
          Structured to conform with Indonesian school administrative standards
      ============================================================== */}
      <div id="print-journal-document" className="print-document-container text-black bg-white">
        {/* Kop Surat Resmi Dinas Pendidikan & UPT SMPN 2 Rebang Tangkas */}
        <div className="border-b-[3px] border-black pb-2 mb-4 text-center">
          <div className="text-[11pt] font-semibold tracking-wider uppercase">
            Pemerintah Kabupaten Way Kanan &bull; Dinas Pendidikan dan Kebudayaan
          </div>
          <div className="text-[14pt] font-black uppercase tracking-wide my-0.5">
            {schoolSettings?.school_name || 'UPT SMP NEGERI 2 REBANG TANGKAS'}
          </div>
          <div className="text-[9pt] text-slate-700">
            {schoolSettings?.school_address || 'Jl. Rebang Tangkas, Kec. Rebang Tangkas, Kab. Way Kanan, Lampung 34764'} &bull; NSS: 201120803023 &bull; NPSN: 10806871
          </div>
          {/* Garis Ganda Kop Dinas */}
          <div className="border-b border-black mt-1" />
        </div>

        {/* Judul Buku Jurnal */}
        <div className="text-center mb-4">
          <h2 className="text-[12pt] font-black uppercase tracking-wider underline">
            BUKU JURNAL HARIAN PELAKSANAAN PEMBELAJARAN
          </h2>
          <div className="text-[10pt] font-bold text-slate-800 mt-0.5">
            MATA PELAJARAN: PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI
          </div>
          <div className="text-[9pt] font-semibold text-slate-700">
            Tahun Ajaran {schoolSettings?.academic_year || '2025/2026'} &bull; Semester {schoolSettings?.semester || 'Ganjil'} &bull; Kelas: {printClassName}
          </div>
        </div>

        {/* Metadata Guru Pengampu */}
        <div className="flex justify-between items-center text-[9pt] mb-2 px-1">
          <div>
            <span><strong>Guru Pengampu:</strong> {profile?.full_name || 'Salim Arsad, S.Pd.I.'}</span>
            <span className="ml-3"><strong>NIP:</strong> {profile?.nip || '19840215 201101 1 012'}</span>
          </div>
          <div>
            <span><strong>Format Kertas:</strong> A4 ({printOrientation.toUpperCase()})</span>
          </div>
        </div>

        {/* Tabel Agenda Jurnal Ukuran Kertas A4 */}
        <table className="w-full border-collapse border border-black text-[9pt]">
          <thead>
            <tr className="bg-slate-100 border-b border-black text-black font-bold">
              <th className="border border-black py-2 px-1 text-center w-8">No</th>
              <th className="border border-black py-2 px-2 text-center w-28">Hari / Tanggal</th>
              <th className="border border-black py-2 px-1 text-center w-14">Kelas</th>
              <th className="border border-black py-2 px-2 text-center w-24">Jam Ke-</th>
              <th className="border border-black py-2 px-2.5 text-left min-w-[140px]">Materi Pokok</th>
              <th className="border border-black py-2 px-3 text-left min-w-[180px]">Kegiatan Pembelajaran (KBM)</th>
              <th className="border border-black py-2 px-2 text-center w-24">
                Kehadiran<br /><span className="text-[8pt] font-normal">(S, I, A)</span>
              </th>
              <th className="border border-black py-2 px-2.5 text-left min-w-[120px]">Keterangan</th>
              <th className="border border-black py-2 px-1 text-center w-14">Paraf</th>
            </tr>
          </thead>
          <tbody>
            {journalsForPrint.length === 0 ? (
              <tr>
                <td colSpan={9} className="border border-black py-6 text-center italic">
                  Belum ada catatan jurnal mengajar untuk dicetak pada kelas ini.
                </td>
              </tr>
            ) : (
              journalsForPrint.map((jrn, idx) => {
                const { dayName, fullDate } = formatDayAndDate(jrn.journal_date);
                const sVal = Number(jrn.attendance_s) || 0;
                const iVal = Number(jrn.attendance_i) || 0;
                const aVal = Number(jrn.attendance_a) || 0;

                return (
                  <tr key={jrn.id} className="border-b border-black">
                    <td className="border border-black py-2 px-1 text-center font-mono font-bold">
                      {idx + 1}
                    </td>
                    <td className="border border-black py-2 px-2">
                      <div className="font-bold capitalize">{dayName}</div>
                      <div className="text-[8pt] text-slate-700 font-mono">{fullDate}</div>
                    </td>
                    <td className="border border-black py-2 px-1 text-center font-bold">
                      {jrn.class?.class_name || 'VII A'}
                    </td>
                    <td className="border border-black py-2 px-2 text-center font-mono text-[8.5pt]">
                      {jrn.teaching_hour || 'Jam 1 - 2'}
                    </td>
                    <td className="border border-black py-2 px-2.5">
                      <div className="font-bold leading-tight">{jrn.topic}</div>
                      {jrn.learning_objectives && jrn.learning_objectives !== jrn.topic && (
                        <div className="text-[8pt] text-slate-600 mt-0.5">
                          TP: {jrn.learning_objectives}
                        </div>
                      )}
                    </td>
                    <td className="border border-black py-2 px-3 whitespace-pre-line leading-relaxed text-[8.5pt]">
                      {jrn.activities}
                    </td>
                    <td className="border border-black py-2 px-2 text-center font-mono text-[8.5pt] whitespace-nowrap">
                      S: {sVal} &bull; I: {iVal} &bull; A: {aVal}
                    </td>
                    <td className="border border-black py-2 px-2.5 text-[8.5pt]">
                      {jrn.notes || jrn.reflection || 'KBM terlaksana tuntas'}
                    </td>
                    <td className="border border-black py-2 px-1 text-center">
                      <div className="w-8 h-8 mx-auto" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Tanda Tangan Pengesahan (Kepala Sekolah & Guru PAI) */}
        <div className="grid grid-cols-2 mt-8 text-[9pt] text-center break-inside-avoid">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala UPT SMPN 2 Rebang Tangkas</p>
            <div className="h-16" />
            <p className="font-bold underline">
              {schoolSettings?.headmaster_name || 'H. AHMAD ROFIQ, M.Pd.'}
            </p>
            <p className="text-[8pt]">
              NIP. 19750812 200003 1 004
            </p>
          </div>
          <div>
            <p>Rebang Tangkas, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">Guru Mata Pelajaran PAI & Budi Pekerti</p>
            <div className="h-16" />
            <p className="font-bold underline">
              {profile?.full_name || 'SALIM ARSAD, S.Pd.I.'}
            </p>
            <p className="text-[8pt]">
              NIP. {profile?.nip || '19840215 201101 1 012'}
            </p>
          </div>
        </div>
      </div>

      {/* ==============================================================
          SCREEN VIEW
      ============================================================== */}

      {/* Screen Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-amber-400" />
            <span>Jurnal Mengajar Guru PAI</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Buku catatan harian KBM: nomor, hari/tanggal, kelas, jam, materi pokok, kegiatan KBM, kehadiran siswa (S, I, A), dan keterangan.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Direct Print to Printer */}
          <button
            type="button"
            onClick={() => executeA4Print('landscape')}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/25 hover:scale-102 cursor-pointer"
            title="Langsung cetak jurnal mengajar format A4 ke printer (1-klik langsung cetak)"
          >
            <Printer className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="font-extrabold tracking-wide">Cetak A4</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-rose-600/25 hover:scale-102 cursor-pointer"
            title="Download jurnal mengajar dalam format PDF siap cetak"
          >
            <FileDown className="w-4 h-4 text-white" />
            <span>Download PDF</span>
          </button>

          {/* Download Word */}
          <button
            type="button"
            onClick={handleDownloadWord}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-600/25 hover:scale-102 cursor-pointer"
            title="Download jurnal mengajar dalam format Microsoft Word (.doc) yang dapat diedit"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Download Word</span>
          </button>

          {/* Pratinjau Modal */}
          <button
            type="button"
            onClick={() => {
              setPrintClassId(selectedClassId);
              setShowPrintModal(true);
            }}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 transition-colors border border-slate-700 shadow-sm cursor-pointer"
            title="Buka pengaturan dan pratinjau cetak kertas ukuran A4"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Pratinjau A4</span>
          </button>

          {/* New Entry */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-400/20 transition-all hover:scale-102 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950 font-black" />
            <span>Tulis Jurnal</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {alertMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between print:hidden ${
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

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 w-full md:w-auto">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-transparent text-xs text-white outline-none font-medium cursor-pointer"
            >
              <option value="" className="bg-slate-900">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900">
                  Kelas {c.class_name} (Tingkat {c.grade_level})
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari materi pokok / KBM..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono flex items-center gap-2 self-end md:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Total: <strong className="text-white">{filteredJournals.length}</strong> Baris Agenda</span>
        </div>
      </div>

      {/* The Core Jurnal Table (Buku Jurnal Guru) on Screen */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 text-center border-r border-slate-800">No</th>
                <th className="py-3 px-3 w-32 border-r border-slate-800">Hari / Tanggal</th>
                <th className="py-3 px-2 w-20 text-center border-r border-slate-800">Kelas</th>
                <th className="py-3 px-2.5 w-28 text-center border-r border-slate-800">Jam</th>
                <th className="py-3 px-4 min-w-[200px] border-r border-slate-800">Materi Pokok</th>
                <th className="py-3 px-4 min-w-[240px] border-r border-slate-800">Kegiatan KBM</th>
                <th className="py-3 px-3 min-w-[150px] text-center border-r border-slate-800">
                  <div>Kehadiran Siswa</div>
                  <div className="text-[10px] font-normal text-slate-400">(S, I, A)</div>
                </th>
                <th className="py-3 px-3 min-w-[140px] border-r border-slate-800">Ket</th>
                <th className="py-3 px-2 w-20 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat data agenda jurnal...
                  </td>
                </tr>
              ) : filteredJournals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                    <BookOpenCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    Belum ada baris jurnal mengajar yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredJournals.map((jrn, idx) => {
                  const { dayName, fullDate } = formatDayAndDate(jrn.journal_date);
                  const sVal = Number(jrn.attendance_s) || 0;
                  const iVal = Number(jrn.attendance_i) || 0;
                  const aVal = Number(jrn.attendance_a) || 0;

                  return (
                    <tr
                      key={jrn.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* 1. NO */}
                      <td className="py-3 px-3 text-center font-bold text-slate-400 border-r border-slate-800/80 font-mono">
                        {idx + 1}
                      </td>

                      {/* 2. HARI / TANGGAL */}
                      <td className="py-3 px-3 border-r border-slate-800/80">
                        <span className="font-bold text-white block capitalize">
                          {dayName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {fullDate}
                        </span>
                      </td>

                      {/* 3. KELAS */}
                      <td className="py-3 px-2 text-center border-r border-slate-800/80">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 font-bold text-xs">
                          {jrn.class?.class_name || 'VII A'}
                        </span>
                      </td>

                      {/* 4. JAM */}
                      <td className="py-3 px-2.5 text-center border-r border-slate-800/80">
                        <span className="text-xs text-amber-300 font-mono font-medium block">
                          {jrn.teaching_hour || 'Jam 1 - 2'}
                        </span>
                      </td>

                      {/* 5. MATERI POKOK */}
                      <td className="py-3 px-4 border-r border-slate-800/80">
                        <div className="font-bold text-white text-xs leading-snug">
                          {jrn.topic}
                        </div>
                        {jrn.learning_objectives && jrn.learning_objectives !== jrn.topic && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            TP: {jrn.learning_objectives}
                          </div>
                        )}
                      </td>

                      {/* 6. KEGIATAN KBM */}
                      <td className="py-3 px-4 border-r border-slate-800/80 text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                        <div className="line-clamp-3">
                          {jrn.activities}
                        </div>
                        {jrn.activities.length > 140 && (
                          <button
                            type="button"
                            onClick={() => setDetailItem(jrn)}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline mt-1 inline-block"
                          >
                            Lihat Lengkap &raquo;
                          </button>
                        )}
                      </td>

                      {/* 7. KEHADIRAN SISWA (S, I, A) */}
                      <td className="py-3 px-3 border-r border-slate-800/80 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${
                              sVal > 0
                                ? 'bg-amber-950/70 text-amber-300 border-amber-700/80'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800'
                            }`}
                            title="Sakit"
                          >
                            <span className="font-semibold text-[10px]">S:</span> {sVal}
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${
                              iVal > 0
                                ? 'bg-blue-950/70 text-blue-300 border-blue-700/80'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800'
                            }`}
                            title="Izin"
                          >
                            <span className="font-semibold text-[10px]">I:</span> {iVal}
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${
                              aVal > 0
                                ? 'bg-rose-950/80 text-rose-300 border-rose-700 font-black animate-pulse'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800'
                            }`}
                            title="Alpa / Tanpa Keterangan"
                          >
                            <span className="font-semibold text-[10px]">A:</span> {aVal}
                          </span>
                        </div>
                      </td>

                      {/* 8. KET (KETERANGAN) */}
                      <td className="py-3 px-3 border-r border-slate-800/80 text-xs text-slate-300">
                        <p className="line-clamp-2">
                          {jrn.notes || jrn.reflection || 'KBM terlaksana baik'}
                        </p>
                      </td>

                      {/* 9. AKSI (EDIT & HAPUS) */}
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(jrn)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
                            title="Edit Jurnal"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(jrn.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 transition-colors"
                            title="Hapus Jurnal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==============================================================
          MODAL PENGATURAN CETAK UKURAN KERTAS A4
      ============================================================== */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cetak Buku Jurnal Mengajar</h3>
                  <p className="text-xs text-emerald-400 font-medium">Standar Kertas A4 (210 &times; 297 mm)</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Paper Size Confirmation Badge */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs text-emerald-200">
                  <span className="font-bold text-white block">Ukuran Kertas Terverifikasi: ISO A4</span>
                  Format dokumen otomatis disesuaikan dengan margin 10mm dan tabel 8 kolom bergaris dinas.
                </div>
              </div>

              {/* Pilihan Orientasi Cetak A4 */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Pilih Orientasi Kertas A4:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPrintOrientation('landscape')}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      printOrientation === 'landscape'
                        ? 'bg-amber-400/10 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-amber-300">A4 Landscape</span>
                      {printOrientation === 'landscape' && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <span className="text-[10px] text-slate-300 block">
                      Mendatar (297 &times; 210 mm)
                    </span>
                    <span className="text-[9px] text-emerald-400 font-semibold block mt-1">
                      &star; Sangat Direkomendasikan untuk Agenda Guru 8 Kolom
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintOrientation('portrait')}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      printOrientation === 'portrait'
                        ? 'bg-amber-400/10 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">A4 Portrait</span>
                      {printOrientation === 'portrait' && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <span className="text-[10px] text-slate-300 block">
                      Tegak (210 &times; 297 mm)
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-1">
                      Cocok untuk lampiran portofolio
                    </span>
                  </button>
                </div>
              </div>

              {/* Pilihan Filter Kelas untuk Cetak */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Pilih Data Kelas yang Ingin Dicetak:
                </label>
                <select
                  value={printClassId}
                  onChange={(e) => setPrintClassId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="">Semua Kelas ({journals.length} catatan)</option>
                  {classes.map((c) => {
                    const count = journals.filter((j) => j.class_id === c.id).length;
                    return (
                      <option key={c.id} value={c.id}>
                        Kelas {c.class_name} ({count} catatan)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Rangkuman Cetak */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Baris Siap Cetak:</span>
                  <span className="font-bold text-white font-mono">{journalsForPrint.length} Pertemuan</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Identitas Sekolah:</span>
                  <span className="text-white font-medium">{schoolSettings?.school_name || 'UPT SMPN 2 Rebang Tangkas'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kop & Tanda Tangan:</span>
                  <span className="text-emerald-400 font-medium">&check; Termasuk Kepala Sekolah & Guru</span>
                </div>
              </div>

              {/* Tombol Aksi Cetak */}
              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    executeA4Print(printOrientation);
                  }}
                  className="flex-[2] py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-400/20 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4 text-slate-950" />
                  <span>Cetak Sekarang (Ukuran A4)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL INPUT / EDIT JURNAL GURU
      ============================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpenCheck className="w-5 h-5 text-amber-400" />
                <span>{editItem ? 'Edit Baris Jurnal Mengajar' : 'Tulis Jurnal Mengajar Harian'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Row 1: Hari/Tanggal & Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Hari / Tanggal Pembelajaran <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={journalDate}
                    onChange={(e) => setJournalDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-400"
                  />
                  <span className="text-[11px] text-amber-400 font-medium mt-1 block">
                    Hari: {formatDayAndDate(journalDate).dayName}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kelas <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.class_name} (Tingkat {c.grade_level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Jam Pelajaran */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Jam Pembelajaran <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Pilih cepat atau ketik sendiri</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jam ke-1 s.d 2 (07.30 - 08.50)"
                    value={teachingHour}
                    onChange={(e) => setTeachingHour(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                  <select
                    onChange={(e) => {
                      if (e.target.value) setTeachingHour(e.target.value);
                    }}
                    value=""
                    className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-xl px-2 py-2 outline-none cursor-pointer"
                  >
                    <option value="">Preset Jam...</option>
                    {HOUR_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Materi Pokok */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Materi Pokok / Pokok Bahasan <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bab 1: Meraih Ketenteraman Hati dengan Zikir dan Salat"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              {/* Row 4: Kegiatan KBM */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Kegiatan KBM (Pendahuluan, Inti, Penutup) <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleApplyKbmTemplate}
                    className="text-[11px] text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-medium transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Gunakan Template Standar PAI</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan tahapan kegiatan KBM yang dilaksanakan..."
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400 font-sans leading-relaxed"
                />
              </div>

              {/* Row 5: Kehadiran Siswa (S, I, A) */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Kehadiran Siswa (S, I, A)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSyncAttendance}
                    disabled={isFetchingAttendance}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-semibold transition-colors disabled:opacity-50"
                    title="Tarik data absensi kelas hari ini jika sudah diabsen"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingAttendance ? 'animate-spin' : ''}`} />
                    <span>Ambil dari Absensi Siswa</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-400 mb-1">
                      S (Sakit)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={attendanceS}
                      onChange={(e) => setAttendanceS(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-900/60 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-bold font-mono outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-blue-400 mb-1">
                      I (Izin)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={attendanceI}
                      onChange={(e) => setAttendanceI(e.target.value)}
                      className="w-full bg-slate-900 border border-blue-900/60 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-bold font-mono outline-none focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-rose-400 mb-1">
                      A (Alpa / Tanpa Ket.)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={attendanceA}
                      onChange={(e) => setAttendanceA(e.target.value)}
                      className="w-full bg-slate-900 border border-rose-900/60 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-bold font-mono outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              </div>

              {/* Row 6: Keterangan (Ket) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Keterangan (Ket) <span className="text-slate-400 font-normal">(Catatan KBM / Ketuntasan)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: KBM berjalan tuntas, seluruh siswa mencapai KKTP, 1 siswa sakit"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-400/20 disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : editItem ? 'Perbarui Baris Jurnal' : 'Simpan ke Agenda Jurnal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          DETAIL VIEW MODAL
      ============================================================== */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4 text-amber-400" />
                <span>Rincian Kegiatan KBM</span>
              </h3>
              <button
                onClick={() => setDetailItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Materi Pokok:</span>
                <p className="font-bold text-white text-sm">{detailItem.topic}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Hari / Tanggal:</span>
                  <span className="text-white font-medium">
                    {formatDayAndDate(detailItem.journal_date).dayName},{' '}
                    {formatDayAndDate(detailItem.journal_date).fullDate}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Kelas & Jam:</span>
                  <span className="text-amber-300 font-medium">
                    Kelas {detailItem.class?.class_name} &bull; {detailItem.teaching_hour}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] mb-1">Rincian Langkah Kegiatan KBM:</span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 whitespace-pre-line leading-relaxed text-xs">
                  {detailItem.activities}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">Kehadiran Siswa:</span>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800 font-mono">
                    Sakit (S): {detailItem.attendance_s ?? 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-950/70 text-blue-300 border border-blue-800 font-mono">
                    Izin (I): {detailItem.attendance_i ?? 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800 font-mono">
                    Alpa (A): {detailItem.attendance_a ?? 0}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Keterangan:</span>
                <p className="text-slate-300 italic">{detailItem.notes || 'KBM terlaksana dengan baik'}</p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          A4 PRINT PREVIEW & CONFIGURATION MODAL
      ============================================================== */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in print:hidden">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
                  <Printer className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>Pratinjau & Cetak Jurnal Mengajar (A4)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono">
                      Format Resmi A4
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kertas A4 standard (210 x 297 mm) sesuai format administrasi guru Dinas Pendidikan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Options Bar */}
            <div className="p-4 sm:p-6 bg-slate-900/90 border-b border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* 1. Pilih Kelas Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Filter Kelas Cetak:</span>
                  </label>
                  <select
                    value={printClassId}
                    onChange={(e) => setPrintClassId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="">Semua Kelas ({journals.length} Baris Jurnal)</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.class_name} ({journals.filter((j) => j.class_id === c.id).length} Baris)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Pilihan Orientasi A4 */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Orientasi Kertas A4:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPrintOrientation('landscape')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
                        printOrientation === 'landscape'
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span>Mendatar (Landscape)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 uppercase tracking-wider">
                        Rekomendasi
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintOrientation('portrait')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
                        printOrientation === 'portrait'
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span>Tegak (Portrait)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tips & Notification */}
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Siap mencetak <strong>{journalsForPrint.length} baris KBM</strong> format <strong>A4 ({printOrientation.toUpperCase()})</strong> untuk <strong>{printClassName}</strong>.
                  </span>
                </div>
                <span className="text-[11px] text-amber-300 font-mono hidden md:inline">
                  Tabel 8 Kolom Lengkap + Tanda Tangan
                </span>
              </div>
            </div>

            {/* Live Scaled Preview of A4 Paper */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/80">
              <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                <span>PRATINJAU TAMPILAN CETAK KERTAS A4:</span>
                <span className="text-amber-400">Skala Pratinjau Dokumen</span>
              </div>

              <div className="bg-white text-black p-6 rounded-xl shadow-2xl border border-slate-200 text-xs overflow-x-auto font-serif">
                {/* Kop Surat Resmi */}
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

                {/* Judul Dokumen */}
                <div className="text-center mb-3">
                  <h4 className="text-[11pt] font-black uppercase tracking-wider underline text-black">
                    BUKU JURNAL HARIAN PELAKSANAAN PEMBELAJARAN
                  </h4>
                  <div className="text-[9pt] font-bold text-slate-800">
                    MATA PELAJARAN: PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI
                  </div>
                  <div className="text-[8pt] text-slate-600">
                    Tahun Ajaran {schoolSettings?.academic_year || '2025/2026'} &bull; Semester {schoolSettings?.semester || 'Ganjil'} &bull; Kelas: {printClassName}
                  </div>
                </div>

                {/* Info Bar */}
                <div className="flex justify-between items-center text-[8pt] mb-2 px-1 text-black font-sans">
                  <span><strong>Guru Pengampu:</strong> {profile?.full_name || 'Salim Arsad, S.Pd.I.'}</span>
                  <span><strong>Format Kertas:</strong> A4 ({printOrientation.toUpperCase()})</span>
                </div>

                {/* Preview Table */}
                <table className="w-full border-collapse border border-black text-[8pt] text-black">
                  <thead>
                    <tr className="bg-slate-100 border-b border-black font-bold">
                      <th className="border border-black p-1 text-center w-6">No</th>
                      <th className="border border-black p-1 text-center w-24">Hari / Tanggal</th>
                      <th className="border border-black p-1 text-center w-12">Kelas</th>
                      <th className="border border-black p-1 text-center w-20">Jam</th>
                      <th className="border border-black p-1.5 text-left">Materi Pokok</th>
                      <th className="border border-black p-1.5 text-left">Kegiatan KBM</th>
                      <th className="border border-black p-1 text-center w-20">Kehadiran (S,I,A)</th>
                      <th className="border border-black p-1.5 text-left">Ket</th>
                      <th className="border border-black p-1 text-center w-12">Paraf</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalsForPrint.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="border border-black py-4 text-center italic text-slate-500">
                          Tidak ada catatan jurnal mengajar pada filter ini.
                        </td>
                      </tr>
                    ) : (
                      journalsForPrint.slice(0, 15).map((jrn, idx) => {
                        const { dayName, fullDate } = formatDayAndDate(jrn.journal_date);
                        return (
                          <tr key={jrn.id} className="border-b border-black">
                            <td className="border border-black p-1 text-center font-bold">{idx + 1}</td>
                            <td className="border border-black p-1">
                              <span className="font-semibold capitalize">{dayName}</span>, {fullDate}
                            </td>
                            <td className="border border-black p-1 text-center font-semibold">
                              {jrn.class?.class_name || 'VII A'}
                            </td>
                            <td className="border border-black p-1 text-center font-mono text-[7.5pt]">
                              {jrn.teaching_hour || 'Jam 1 - 2'}
                            </td>
                            <td className="border border-black p-1.5 font-medium leading-tight">
                              {jrn.topic}
                            </td>
                            <td className="border border-black p-1.5 leading-snug line-clamp-3">
                              {jrn.activities}
                            </td>
                            <td className="border border-black p-1 text-center font-mono text-[7.5pt] whitespace-nowrap">
                              S:{jrn.attendance_s ?? 0} I:{jrn.attendance_i ?? 0} A:{jrn.attendance_a ?? 0}
                            </td>
                            <td className="border border-black p-1.5 text-[7.5pt]">
                              {jrn.notes || 'KBM terlaksana tuntas'}
                            </td>
                            <td className="border border-black p-1 text-center"></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                {journalsForPrint.length > 15 && (
                  <p className="text-[7.5pt] text-slate-500 italic mt-1 text-center">
                    ... dan {journalsForPrint.length - 15} baris jurnal lainnya akan dicetak pada halaman berikutnya.
                  </p>
                )}

                {/* Preview Signatures */}
                <div className="grid grid-cols-2 mt-6 text-[8pt] text-center text-black font-sans">
                  <div>
                    <p>Mengetahui,</p>
                    <p className="font-bold">Kepala UPT SMPN 2 Rebang Tangkas</p>
                    <div className="h-10" />
                    <p className="font-bold underline">{schoolSettings?.headmaster_name || 'H. AHMAD ROFIQ, M.Pd.'}</p>
                    <p className="text-[7pt]">NIP. 19750812 200003 1 004</p>
                  </div>
                  <div>
                    <p>Rebang Tangkas, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="font-bold">Guru Mata Pelajaran PAI & Budi Pekerti</p>
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
                  onClick={handleDownloadPdf}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all hover:scale-102 cursor-pointer"
                  title="Unduh berkas PDF A4"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadWord}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all hover:scale-102 cursor-pointer"
                  title="Unduh berkas Microsoft Word (.doc)"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Word</span>
                </button>

                <button
                  type="button"
                  onClick={() => executeA4Print(printOrientation)}
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
