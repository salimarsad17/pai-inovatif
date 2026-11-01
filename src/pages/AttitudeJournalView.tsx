import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Building2,
  User,
  CheckCircle2,
  AlertCircle,
  Search,
  Printer,
  FileText,
  Eye,
  X,
  Sparkles,
  BookOpenCheck,
  Download,
  FileDown,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { AttitudeRecord, AttitudeCategory, ClassItem, StudentItem } from '../types';
import { exportAttitudeJournalToWord, exportAttitudeJournalToPdf } from '../services/exportService';

export const AttitudeJournalView: React.FC = () => {
  const { profile, schoolSettings } = useAuth();

  const [records, setRecords] = useState<AttitudeRecord[]>(() => dataService.getLocalAttitudeRecords());
  const [classes, setClasses] = useState<ClassItem[]>(() => dataService.getLocalClasses());
  const [students, setStudents] = useState<StudentItem[]>(() => dataService.getLocalStudents());
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Form modal (Add / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<AttitudeRecord | null>(null);
  const [formStudentId, setFormStudentId] = useState('');
  const [formCategory, setFormCategory] = useState<AttitudeCategory>('Spiritual');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formDesc, setFormDesc] = useState('');
  const [formFollowUp, setFormFollowUp] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Detail modal
  const [detailItem, setDetailItem] = useState<AttitudeRecord | null>(null);

  // A4 Print Modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [printClassId, setPrintClassId] = useState<string>('');

  const loadData = async () => {
    try {
      const [clsList, recList, stdList] = await Promise.all([
        dataService.getClasses(),
        dataService.getAttitudeRecords(undefined, selectedClassId || undefined),
        dataService.getStudents(selectedClassId || undefined),
      ]);
      setClasses(clsList);
      setRecords(recList);
      setStudents(stdList);
      if (!formStudentId && stdList.length > 0) {
        setFormStudentId(stdList[0].id);
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal memuat jurnal sikap: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId]);

  // Format Day and Date in Indonesian
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

  const handleOpenAdd = () => {
    setEditItem(null);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormCategory('Spiritual');
    setFormDesc('');
    setFormFollowUp('Diberikan apresiasi dan motivasi akhlak mulia');
    if (!formStudentId && students.length > 0) {
      setFormStudentId(students[0].id);
    }
    setShowModal(true);
  };

  const handleOpenEdit = (rec: AttitudeRecord) => {
    setEditItem(rec);
    setFormStudentId(rec.student_id);
    setFormDate(rec.record_date || new Date().toISOString().slice(0, 10));
    setFormCategory(rec.category || 'Spiritual');
    setFormDesc(rec.description || '');
    setFormFollowUp(rec.follow_up || rec.coaching_notes || '');
    setShowModal(true);
  };

  // Quick preset template for behavior observation
  const handleApplyPreset = (presetType: 'adzan' | 'jujur' | 'tadarus' | 'santun' | 'toleransi') => {
    if (presetType === 'adzan') {
      setFormCategory('Spiritual');
      setFormDesc('Secara sukarela mengumandangkan adzan tepat waktu di musala sekolah dan mengajak teman salat berjamaah.');
      setFormFollowUp('Diberikan apresiasi di depan kelas dan ditunjuk sebagai koordinator musala.');
    } else if (presetType === 'jujur') {
      setFormCategory('Kejujuran');
      setFormDesc('Menemukan barang / uang milik teman di musala dan segera menyerahkannya ke guru piket untuk diumumkan.');
      setFormFollowUp('Diberikan bintang kejujuran dan pujian sebagai teladan integritas.');
    } else if (presetType === 'tadarus') {
      setFormCategory('Spiritual');
      setFormDesc('Sangat tertib memimpin tadarus Al-Qur’an dan membantu menyimak bacaan tajwid teman sebangkunya.');
      setFormFollowUp('Diapresiasi dan ditunjuk sebagai tutor sebaya membaca Al-Qur’an.');
    } else if (presetType === 'santun') {
      setFormCategory('Sosial');
      setFormDesc('Selalu menerapkan budaya 5S (Senyum, Salam, Sapa, Sopan, Santun) kepada seluruh warga sekolah.');
      setFormFollowUp('Diberikan catatan positif pada buku pembinaan akhlak siswa.');
    } else if (presetType === 'toleransi') {
      setFormCategory('Toleransi');
      setFormDesc('Menunjukkan sikap lapang dada, menghargai perbedaan pendapat dalam diskusi kelompok, dan tidak membeda-bedakan teman.');
      setFormFollowUp('Diberi pujian atas kedewasaan sikap dan penerapan nilai Wasathiyah Islam.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formDesc.trim()) {
      setAlertMsg({ type: 'error', text: 'Peserta didik dan catatan perilaku wajib diisi.' });
      return;
    }

    setFormLoading(true);
    try {
      const selectedStudent = students.find((s) => s.id === formStudentId);

      const payload = {
        student_id: formStudentId,
        teacher_id: profile?.id || '',
        record_date: formDate,
        category: formCategory,
        description: formDesc.trim(),
        coaching_notes: formCategory,
        follow_up: formFollowUp.trim() || 'KBM terlaksana dengan baik',
        student: selectedStudent,
      };

      if (editItem) {
        await dataService.updateAttitudeRecord(editItem.id, payload);
        setAlertMsg({ type: 'success', text: 'Catatan sikap berhasil diperbarui.' });
      } else {
        await dataService.createAttitudeRecord(payload);
        setAlertMsg({ type: 'success', text: 'Catatan sikap berhasil ditambahkan ke jurnal.' });
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal menyimpan: ${err.message}` });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus catatan sikap ini?')) return;
    try {
      await dataService.deleteAttitudeRecord(id);
      setAlertMsg({ type: 'success', text: 'Catatan sikap berhasil dihapus.' });
      loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal menghapus: ${err.message}` });
    }
  };

  // Trigger A4 Print directly to printer
  const executeA4Print = (orientation: 'landscape' | 'portrait' = printOrientation) => {
    setPrintOrientation(orientation);

    const oldStyle = document.getElementById('a4-attitude-print-style');
    if (oldStyle) oldStyle.remove();

    const styleEl = document.createElement('style');
    styleEl.id = 'a4-attitude-print-style';
    styleEl.innerHTML = `
      @page {
        size: A4 ${orientation} !important;
        margin: ${orientation === 'landscape' ? '8mm 10mm 10mm 10mm' : '10mm 12mm 12mm 12mm'} !important;
      }
    `;
    document.head.appendChild(styleEl);

    try {
      window.focus();
      window.print();
    } catch (e) {
      console.error('Error invoking print dialog:', e);
      window.print();
    }
  };

  // Filter records for screen table
  const filteredRecords = records.filter((r) => {
    if (selectedClassId && r.student?.class_id !== selectedClassId) return false;
    if (selectedCategory && r.category !== selectedCategory) return false;
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const matchName = r.student?.profile?.full_name?.toLowerCase().includes(kw);
      const matchNIS = r.student?.student_number?.toLowerCase().includes(kw);
      const matchDesc = r.description?.toLowerCase().includes(kw);
      const matchCat = r.category?.toLowerCase().includes(kw);
      const matchNotes = r.follow_up?.toLowerCase().includes(kw) || r.coaching_notes?.toLowerCase().includes(kw);
      return matchName || matchNIS || matchDesc || matchCat || matchNotes;
    }
    return true;
  });

  // Filter records for print document
  const recordsForPrint = records.filter((r) => {
    if (printClassId && r.student?.class_id !== printClassId) return false;
    if (!printClassId && selectedClassId && r.student?.class_id !== selectedClassId) return false;
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

      const exportItems = recordsForPrint.map((rec, idx) => {
        const { dayName, fullDate } = formatDayAndDate(rec.record_date);
        return {
          no: idx + 1,
          timeStr: `${dayName}, ${fullDate}`,
          studentName: rec.student?.profile?.full_name || 'Peserta Didik',
          className: rec.student?.class?.class_name || printClassName || 'VII A',
          behaviorNote: rec.description || '-',
          attitudeItem: rec.category || 'Spiritual',
          notes: rec.follow_up || rec.coaching_notes || 'Diberikan apresiasi & bimbingan',
        };
      });

      exportAttitudeJournalToPdf(meta, exportItems);
      setAlertMsg({
        type: 'success',
        text: `Dokumen PDF Jurnal Sikap (${exportItems.length} baris) berhasil diunduh.`,
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

      const exportItems = recordsForPrint.map((rec, idx) => {
        const { dayName, fullDate } = formatDayAndDate(rec.record_date);
        return {
          no: idx + 1,
          timeStr: `${dayName}, ${fullDate}`,
          studentName: rec.student?.profile?.full_name || 'Peserta Didik',
          className: rec.student?.class?.class_name || printClassName || 'VII A',
          behaviorNote: rec.description || '-',
          attitudeItem: rec.category || 'Spiritual',
          notes: rec.follow_up || rec.coaching_notes || 'Diberikan apresiasi & bimbingan',
        };
      });

      exportAttitudeJournalToWord(meta, exportItems);
      setAlertMsg({
        type: 'success',
        text: `Dokumen Microsoft Word (.doc) Jurnal Sikap (${exportItems.length} baris) berhasil diunduh.`,
      });
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal mengunduh Word: ${err.message}` });
    }
  };

  // Badge color helper for Butir Sikap
  const getAttitudeBadge = (category: string) => {
    switch (category) {
      case 'Spiritual':
        return 'bg-amber-950/70 text-amber-300 border-amber-800/80';
      case 'Kejujuran':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80';
      case 'Kedisiplinan':
        return 'bg-purple-950/70 text-purple-300 border-purple-800/80';
      case 'Toleransi':
        return 'bg-blue-950/70 text-blue-300 border-blue-800/80';
      case 'Sosial':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* ==============================================================
          A4 PRINT DOCUMENT (ONLY VISIBLE DURING PRINT)
          Standard Indonesian Educational Administration Layout
      ============================================================== */}
      <div id="print-attitude-document" className="print-document-container text-black bg-white">
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
          <div className="border-b border-black mt-1" />
        </div>

        {/* Judul Buku Jurnal Sikap */}
        <div className="text-center mb-4">
          <h2 className="text-[12pt] font-black uppercase tracking-wider underline">
            BUKU JURNAL PENGAMATAN & PENILAIAN SIKAP SISWA
          </h2>
          <div className="text-[10pt] font-bold text-slate-800 mt-0.5">
            MATA PELAJARAN: PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI
          </div>
          <div className="text-[9pt] font-semibold text-slate-700">
            Tahun Ajaran {schoolSettings?.academic_year || '2025/2026'} &bull; Semester {schoolSettings?.semester || 'Ganjil'} &bull; Rombel: {printClassName}
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

        {/* Tabel Cetak Jurnal Sikap: No, Waktu, Nama, Kelas, Catatan Perilaku, Butir Sikap, Ket, Paraf */}
        <table className="w-full border-collapse border border-black text-[9pt]">
          <thead>
            <tr className="bg-slate-100 border-b border-black text-black font-bold">
              <th className="border border-black py-2 px-1 text-center w-8">No</th>
              <th className="border border-black py-2 px-2 text-center w-28">Waktu</th>
              <th className="border border-black py-2 px-2.5 text-left min-w-[130px]">Nama Siswa</th>
              <th className="border border-black py-2 px-1 text-center w-14">Kelas</th>
              <th className="border border-black py-2 px-3 text-left min-w-[200px]">Catatan Perilaku</th>
              <th className="border border-black py-2 px-2.5 text-center w-28">Butir Sikap</th>
              <th className="border border-black py-2 px-3 text-left min-w-[140px]">Ket (Tindak Lanjut)</th>
              <th className="border border-black py-2 px-1 text-center w-14">Paraf</th>
            </tr>
          </thead>
          <tbody>
            {recordsForPrint.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-black py-6 text-center italic">
                  Belum ada catatan jurnal sikap siswa untuk dicetak pada kelas ini.
                </td>
              </tr>
            ) : (
              recordsForPrint.map((rec, idx) => {
                const { dayName, fullDate } = formatDayAndDate(rec.record_date);
                return (
                  <tr key={rec.id} className="border-b border-black">
                    <td className="border border-black py-2 px-1 text-center font-mono font-bold">
                      {idx + 1}
                    </td>
                    <td className="border border-black py-2 px-2 text-center">
                      <div className="font-bold capitalize">{dayName}</div>
                      <div className="text-[8pt] text-slate-700 font-mono">{fullDate}</div>
                    </td>
                    <td className="border border-black py-2 px-2.5">
                      <div className="font-bold">{rec.student?.profile?.full_name || 'Peserta Didik'}</div>
                      <div className="text-[8pt] text-slate-600 font-mono">NIS: {rec.student?.student_number || '-'}</div>
                    </td>
                    <td className="border border-black py-2 px-1 text-center font-bold">
                      {rec.student?.class?.class_name || 'VII A'}
                    </td>
                    <td className="border border-black py-2 px-3 leading-relaxed text-[8.5pt]">
                      {rec.description}
                    </td>
                    <td className="border border-black py-2 px-2.5 text-center font-semibold text-[8.5pt]">
                      {rec.category || 'Spiritual'}
                    </td>
                    <td className="border border-black py-2 px-3 text-[8.5pt]">
                      {rec.follow_up || rec.coaching_notes || 'Diberikan apresiasi & bimbingan'}
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

      {/* Header Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-rose-400" />
            <span>Jurnal Pengamatan Sikap Siswa</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Buku catatan harian sikap berurutan: <strong className="text-slate-200">No, Waktu, Nama, Kelas, Catatan Perilaku, Butir Sikap, dan Keterangan (Ket)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Direct Print to Printer */}
          <button
            type="button"
            onClick={() => executeA4Print('landscape')}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/25 hover:scale-102 cursor-pointer"
            title="Langsung cetak jurnal sikap format A4 ke printer (1-klik langsung cetak)"
          >
            <Printer className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="font-extrabold tracking-wide">Cetak A4</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-rose-600/25 hover:scale-102 cursor-pointer"
            title="Download jurnal sikap dalam format PDF siap cetak"
          >
            <FileDown className="w-4 h-4 text-white" />
            <span>Download PDF</span>
          </button>

          {/* Download Word */}
          <button
            type="button"
            onClick={handleDownloadWord}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-600/25 hover:scale-102 cursor-pointer"
            title="Download jurnal sikap dalam format Microsoft Word (.doc) yang dapat diedit"
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
            <span>Catat Sikap</span>
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

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Class Filter */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-transparent text-xs text-white outline-none font-medium cursor-pointer"
            >
              <option value="" className="bg-slate-900">Semua Rombel Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900">
                  Kelas {c.class_name} (Tingkat {c.grade_level})
                </option>
              ))}
            </select>
          </div>

          {/* Category / Butir Sikap Filter */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5">
            <HeartHandshake className="w-4 h-4 text-rose-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs text-white outline-none font-medium cursor-pointer"
            >
              <option value="" className="bg-slate-900">Semua Butir Sikap</option>
              <option value="Spiritual" className="bg-slate-900">Spiritual (Beriman & Bertakwa)</option>
              <option value="Kejujuran" className="bg-slate-900">Kejujuran (Integritas)</option>
              <option value="Kedisiplinan" className="bg-slate-900">Kedisiplinan & Tanggung Jawab</option>
              <option value="Toleransi" className="bg-slate-900">Toleransi (Tasamuh)</option>
              <option value="Sosial" className="bg-slate-900">Sosial & Sopan Santun</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, perilaku, butir sikap..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-amber-400 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Main Table: No, Waktu, Nama, Kelas, Catatan Perilaku, Butir Sikap, Ket, Aksi */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm print:hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Tabel Buku Jurnal Sikap Siswa ({filteredRecords.length} Catatan)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Urutan Kolom Sesuai Format Administrasi Guru
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-3 text-center w-12 font-bold">No</th>
                <th className="py-3.5 px-3 w-32 font-bold">Waktu</th>
                <th className="py-3.5 px-3 min-w-[150px] font-bold">Nama</th>
                <th className="py-3.5 px-2.5 text-center w-20 font-bold">Kelas</th>
                <th className="py-3.5 px-4 min-w-[240px] font-bold">Catatan Perilaku</th>
                <th className="py-3.5 px-3 text-center w-36 font-bold">Butir Sikap</th>
                <th className="py-3.5 px-3.5 min-w-[160px] font-bold">Ket</th>
                <th className="py-3.5 px-3 text-center w-24 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat catatan jurnal sikap...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    <HeartHandshake className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">Belum ada catatan jurnal sikap pada filter ini.</p>
                    <p className="text-[11px] text-slate-500 mt-1">Klik tombol &ldquo;Catat Sikap Baru&rdquo; untuk menambahkan penilaian pembinaan siswa.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, index) => {
                  const { dayName, fullDate } = formatDayAndDate(rec.record_date);
                  const badgeClass = getAttitudeBadge(rec.category);

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* 1. No */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400">
                        {index + 1}
                      </td>

                      {/* 2. Waktu */}
                      <td className="py-3.5 px-3 text-slate-200">
                        <div className="font-semibold capitalize text-amber-300">
                          {dayName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {fullDate}
                        </div>
                      </td>

                      {/* 3. Nama */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{rec.student?.profile?.full_name || 'Peserta Didik'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          NIS: {rec.student?.student_number || '-'}
                        </div>
                      </td>

                      {/* 4. Kelas */}
                      <td className="py-3.5 px-2.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-800 text-amber-300 font-bold text-[11px] border border-slate-700">
                          {rec.student?.class?.class_name || 'VII A'}
                        </span>
                      </td>

                      {/* 5. Catatan Perilaku */}
                      <td className="py-3.5 px-4 text-slate-200 leading-relaxed">
                        <p className="line-clamp-3">
                          {rec.description}
                        </p>
                      </td>

                      {/* 6. Butir Sikap */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                          {rec.category || 'Spiritual'}
                        </span>
                      </td>

                      {/* 7. Ket (Keterangan / Tindak Lanjut Guru) */}
                      <td className="py-3.5 px-3.5 text-slate-300">
                        <p className="line-clamp-2 text-[11px] leading-relaxed">
                          {rec.follow_up || rec.coaching_notes || 'Diberikan apresiasi & bimbingan'}
                        </p>
                      </td>

                      {/* 8. Aksi */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailItem(rec)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
                            title="Lihat Rincian Catatan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                            title="Edit Catatan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rec.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-4 h-4" />
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
          ADD / EDIT MODAL
          Structured strictly matching: No, Waktu, Nama, Kelas, Catatan Perilaku, Butir Sikap, Ket
      ============================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-rose-400" />
                <span>{editItem ? 'Edit Catatan Jurnal Sikap' : 'Input Catatan Sikap & Akhlak Siswa'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Template Chips */}
            <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-semibold text-amber-400 block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Pilih Cepat Contoh Pengamatan Perilaku:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('adzan')}
                  className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/80 text-[11px] text-amber-300 hover:bg-amber-900 transition-colors"
                >
                  🕌 Adzan & Kerapihan Salat
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('jujur')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-[11px] text-emerald-300 hover:bg-emerald-900 transition-colors"
                >
                  ⭐ Kejujuran Menemukan Barang
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('tadarus')}
                  className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/80 text-[11px] text-blue-300 hover:bg-blue-900 transition-colors"
                >
                  📖 Tertib Memimpin Tadarus
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('santun')}
                  className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/80 text-[11px] text-purple-300 hover:bg-purple-900 transition-colors"
                >
                  🤝 Budaya 5S Santun
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('toleransi')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-[11px] text-cyan-300 hover:bg-cyan-900 transition-colors"
                >
                  🌱 Toleransi & Tasamuh
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Row 1: Pilih Peserta Didik (Nama & Kelas) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Siswa & Kelas <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="">Pilih Siswa...</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.profile?.full_name} ({st.student_number} - Kelas {st.class?.class_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 2: Waktu (Tanggal & Waktu Kejadian) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Waktu / Tanggal <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                {/* Butir Sikap */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Butir Sikap (Karakter) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="Spiritual">Spiritual (Beriman & Bertakwa)</option>
                    <option value="Kejujuran">Kejujuran (Amanah & Integritas)</option>
                    <option value="Kedisiplinan">Kedisiplinan & Tanggung Jawab</option>
                    <option value="Toleransi">Toleransi (Tasamuh & Menghargai)</option>
                    <option value="Sosial">Sosial (Sopan Santun & Gotong Royong)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Catatan Perilaku */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan Perilaku Teramati <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan peristiwa atau perilaku konkret yang ditunjukkan oleh peserta didik..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400 leading-relaxed font-sans"
                />
              </div>

              {/* Row 4: Keterangan (Ket) / Tindak Lanjut Guru */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Keterangan (Ket) / Tindak Lanjut Pembinaan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Diberi apresiasi di depan kelas dan ditunjuk sebagai koordinator musala"
                  value={formFollowUp}
                  onChange={(e) => setFormFollowUp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              {/* Action Buttons */}
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
                  {formLoading ? 'Menyimpan...' : editItem ? 'Perbarui Catatan Sikap' : 'Simpan Catatan Sikap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          DETAIL MODAL
      ============================================================== */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-rose-400" />
                <span>Rincian Pengamatan Sikap Siswa</span>
              </h3>
              <button
                onClick={() => setDetailItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Nama Siswa:</span>
                  <p className="font-bold text-white text-sm">
                    {detailItem.student?.profile?.full_name || 'Peserta Didik'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    NIS: {detailItem.student?.student_number} &bull; Kelas {detailItem.student?.class?.class_name}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getAttitudeBadge(detailItem.category)}`}>
                  {detailItem.category}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Catatan Perilaku Teramati:</span>
                <p className="text-slate-200 leading-relaxed font-sans">
                  &ldquo;{detailItem.description}&rdquo;
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Keterangan (Ket) & Tindak Lanjut:</span>
                <p className="text-slate-300">
                  {detailItem.follow_up || detailItem.coaching_notes || 'Diberikan bimbingan dan arahan santun.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
                <span>Waktu Kejadian: {formatDayAndDate(detailItem.record_date).dayName}, {formatDayAndDate(detailItem.record_date).fullDate}</span>
                <span>Pencatat: Guru PAI</span>
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
                <div className="w-9 h-9 rounded-xl bg-rose-400/20 border border-rose-400/30 flex items-center justify-center">
                  <Printer className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>Pratinjau & Cetak Jurnal Sikap Siswa (A4)</span>
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
                    <option value="">Semua Rombel ({records.length} Baris Jurnal)</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.class_name} ({records.filter((r) => r.student?.class_id === c.id).length} Baris)
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

              {/* Notification Banner */}
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Siap mencetak <strong>{recordsForPrint.length} baris jurnal sikap</strong> format <strong>A4 ({printOrientation.toUpperCase()})</strong> untuk <strong>{printClassName}</strong>.
                  </span>
                </div>
                <span className="text-[11px] text-amber-300 font-mono hidden md:inline">
                  No, Waktu, Nama, Kelas, Catatan Perilaku, Butir Sikap, Ket
                </span>
              </div>
            </div>

            {/* Live Scaled Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/80">
              <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                <span>PRATINJAU DOKUMEN CETAK KERTAS A4:</span>
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
                    BUKU JURNAL PENGAMATAN & PENILAIAN SIKAP SISWA
                  </h4>
                  <div className="text-[9pt] font-bold text-slate-800">
                    MATA PELAJARAN: PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI
                  </div>
                  <div className="text-[8pt] text-slate-600">
                    Tahun Ajaran {schoolSettings?.academic_year || '2025/2026'} &bull; Semester {schoolSettings?.semester || 'Ganjil'} &bull; Rombel: {printClassName}
                  </div>
                </div>

                {/* Info Bar */}
                <div className="flex justify-between items-center text-[8pt] mb-2 px-1 text-black font-sans">
                  <span><strong>Guru Pengampu:</strong> {profile?.full_name || 'Salim Arsad, S.Pd.I.'}</span>
                  <span><strong>Format Kertas:</strong> A4 ({printOrientation.toUpperCase()})</span>
                </div>

                {/* Table Preview */}
                <table className="w-full border-collapse border border-black text-[8pt] text-black">
                  <thead>
                    <tr className="bg-slate-100 border-b border-black font-bold">
                      <th className="border border-black p-1 text-center w-6">No</th>
                      <th className="border border-black p-1 text-center w-24">Waktu</th>
                      <th className="border border-black p-1 text-left w-36">Nama Siswa</th>
                      <th className="border border-black p-1 text-center w-12">Kelas</th>
                      <th className="border border-black p-1.5 text-left">Catatan Perilaku</th>
                      <th className="border border-black p-1 text-center w-24">Butir Sikap</th>
                      <th className="border border-black p-1.5 text-left w-36">Ket (Tindak Lanjut)</th>
                      <th className="border border-black p-1 text-center w-10">Paraf</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recordsForPrint.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="border border-black py-4 text-center italic text-slate-500">
                          Tidak ada catatan jurnal sikap pada filter ini.
                        </td>
                      </tr>
                    ) : (
                      recordsForPrint.slice(0, 15).map((rec, idx) => {
                        const { dayName, fullDate } = formatDayAndDate(rec.record_date);
                        return (
                          <tr key={rec.id} className="border-b border-black">
                            <td className="border border-black p-1 text-center font-bold">{idx + 1}</td>
                            <td className="border border-black p-1 text-center">
                              <span className="font-semibold capitalize">{dayName}</span>, {fullDate}
                            </td>
                            <td className="border border-black p-1 font-bold">
                              {rec.student?.profile?.full_name || 'Peserta Didik'}
                            </td>
                            <td className="border border-black p-1 text-center font-semibold">
                              {rec.student?.class?.class_name || 'VII A'}
                            </td>
                            <td className="border border-black p-1.5 leading-snug line-clamp-3">
                              {rec.description}
                            </td>
                            <td className="border border-black p-1 text-center font-semibold">
                              {rec.category || 'Spiritual'}
                            </td>
                            <td className="border border-black p-1.5 text-[7.5pt]">
                              {rec.follow_up || rec.coaching_notes || 'Diberikan apresiasi & bimbingan'}
                            </td>
                            <td className="border border-black p-1 text-center"></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* Signatures */}
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
