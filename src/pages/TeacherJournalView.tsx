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
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { TeachingJournal, ClassItem } from '../types';

export const TeacherJournalView: React.FC = () => {
  const { profile } = useAuth();

  const [journals, setJournals] = useState<TeachingJournal[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<TeachingJournal | null>(null);

  // Form fields
  const [classId, setClassId] = useState('');
  const [journalDate, setJournalDate] = useState(new Date().toISOString().slice(0, 10));
  const [topic, setTopic] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [methods, setMethods] = useState('');
  const [activities, setActivities] = useState('');
  const [reflection, setReflection] = useState('');
  const [obstacles, setObstacles] = useState('');
  const [followUp, setFollowUp] = useState('');

  const [formLoading, setFormLoading] = useState(false);
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

  const handleOpenAdd = () => {
    setEditItem(null);
    setJournalDate(new Date().toISOString().slice(0, 10));
    setTopic('');
    setLearningObjectives('');
    setMethods('Diskusi, Tanya Jawab, Pembelajaran Berdiferensiasi');
    setActivities('');
    setReflection('');
    setObstacles('');
    setFollowUp('');
    setShowModal(true);
  };

  const handleOpenEdit = (jrn: TeachingJournal) => {
    setEditItem(jrn);
    setClassId(jrn.class_id);
    setJournalDate(jrn.journal_date);
    setTopic(jrn.topic);
    setLearningObjectives(jrn.learning_objectives);
    setMethods(jrn.methods || '');
    setActivities(jrn.activities);
    setReflection(jrn.reflection || '');
    setObstacles(jrn.obstacles || '');
    setFollowUp(jrn.follow_up || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !topic.trim() || !activities.trim()) {
      setAlertMsg({ type: 'error', text: 'Kelas, topik, dan kegiatan wajib diisi.' });
      return;
    }

    setFormLoading(true);
    setAlertMsg(null);

    try {
      const payload = {
        teacher_id: profile?.id || '',
        class_id: classId,
        journal_date: journalDate,
        topic: topic.trim(),
        learning_objectives: learningObjectives.trim(),
        methods: methods.trim(),
        activities: activities.trim(),
        reflection: reflection.trim(),
        obstacles: obstacles.trim(),
        follow_up: followUp.trim(),
      };

      if (editItem) {
        await dataService.updateJournal(editItem.id, payload);
        setAlertMsg({ type: 'success', text: 'Jurnal mengajar berhasil diperbarui.' });
      } else {
        await dataService.createJournal(payload);
        setAlertMsg({ type: 'success', text: 'Jurnal mengajar berhasil disimpan ke Supabase.' });
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
    if (!confirm('Apakah Anda yakin ingin menghapus jurnal ini?')) return;
    try {
      await dataService.deleteJournal(id);
      setAlertMsg({ type: 'success', text: 'Jurnal berhasil dihapus.' });
      loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal menghapus: ${err.message}` });
    }
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
            <BookOpenCheck className="w-6 h-6 text-amber-400" />
            <span>Jurnal Mengajar Guru PAI</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dokumentasi harian pelaksanaan pembelajaran PAI, refleksi kelas, kendala, dan tindak lanjut.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Jurnal Baru</span>
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

      {/* Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <Building2 className="w-4 h-4 text-slate-400" />
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 outline-none focus:border-amber-400"
        >
          <option value="">Semua Kelas</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              Kelas {c.class_name} (Tingkat {c.grade_level})
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400 font-mono ml-auto">
          Total: {journals.length} Catatan Jurnal
        </span>
      </div>

      {/* Journals List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Memuat jurnal dari Supabase...
        </div>
      ) : journals.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
          <BookOpenCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">Belum Ada Jurnal Mengajar</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Catat agenda pembelajaran pertama Anda hari ini untuk dokumentasi administrasi guru.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Tulis Jurnal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {journals.map((jrn) => (
            <div
              key={jrn.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-900/40 border border-blue-800 text-blue-300 font-bold text-xs">
                    Kelas {jrn.class?.class_name || 'SMP'}
                  </span>
                  <h3 className="text-base font-bold text-white">{jrn.topic}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    {new Date(jrn.journal_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(jrn)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="Edit Jurnal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(jrn.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400"
                      title="Hapus Jurnal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Journal Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block mb-0.5">Tujuan Pembelajaran (TP):</span>
                  <p className="text-slate-200 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {jrn.learning_objectives || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block mb-0.5">Metode Pembelajaran:</span>
                  <p className="text-slate-200 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {jrn.methods || '-'}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-xs mb-0.5">Kegiatan Inti Pembelajaran:</span>
                <p className="text-slate-200 text-xs leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 whitespace-pre-line">
                  {jrn.activities}
                </p>
              </div>

              {(jrn.reflection || jrn.obstacles || jrn.follow_up) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  {jrn.reflection && (
                    <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-900/40">
                      <span className="text-blue-300 font-semibold block mb-0.5">Refleksi:</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{jrn.reflection}</p>
                    </div>
                  )}
                  {jrn.obstacles && (
                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/40">
                      <span className="text-amber-300 font-semibold block mb-0.5">Kendala:</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{jrn.obstacles}</p>
                    </div>
                  )}
                  {jrn.follow_up && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40">
                      <span className="text-emerald-300 font-semibold block mb-0.5">Tindak Lanjut:</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{jrn.follow_up}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl my-8">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5 text-amber-400" />
              <span>{editItem ? 'Edit Jurnal Pembelajaran' : 'Input Jurnal Mengajar Harian'}</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tanggal Pembelajaran <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={journalDate}
                    onChange={(e) => setJournalDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Materi / Topik Pembelajaran <span className="text-rose-400">*</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tujuan Pembelajaran (TP)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Peserta didik mampu memahami hakikat zikir..."
                    value={learningObjectives}
                    onChange={(e) => setLearningObjectives(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Metode & Media
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Diskusi kelompok, tayangan LCD, kartu refleksi..."
                    value={methods}
                    onChange={(e) => setMethods(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kegiatan Pembelajaran (Awal, Inti, Penutup) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Kegiatan awal: Pembacaan Asmaul Husna bersama. Kegiatan inti: Siswa menganalisis studi kasus kejujuran..."
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Refleksi Guru</label>
                  <textarea
                    rows={2}
                    placeholder="Antusiasme siswa tinggi..."
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kendala Ditemui</label>
                  <textarea
                    rows={2}
                    placeholder="2 siswa masih kesulitan membaca..."
                    value={obstacles}
                    onChange={(e) => setObstacles(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tindak Lanjut</label>
                  <textarea
                    rows={2}
                    placeholder="Bimbingan membaca Al-Qur'an setelah salat Dhuhur..."
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Jurnal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
