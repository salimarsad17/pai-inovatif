import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Trash2,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  MessageSquare,
  FileCheck,
  Save,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { Assignment, Submission, ClassItem } from '../types';

export const AssignmentView: React.FC = () => {
  const { profile } = useAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modal: Buat Tugas
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [assignmentType, setAssignmentType] = useState('uraian');
  const [dueAt, setDueAt] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [formLoading, setFormLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Submissions drawer/modal
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  // Grading state
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(85);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [clsList, assList] = await Promise.all([
        dataService.getClasses(),
        dataService.getAssignments(selectedClassId || undefined),
      ]);
      setClasses(clsList);
      setAssignments(assList);
      if (!targetClassId && clsList.length > 0) {
        setTargetClassId(clsList[0].id);
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal memuat tugas: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !targetClassId) {
      setAlertMsg({ type: 'error', text: 'Semua kolom wajib diisi.' });
      return;
    }

    setFormLoading(true);
    try {
      await dataService.createAssignment({
        title: title.trim(),
        description: description.trim(),
        class_id: targetClassId,
        assignment_type: assignmentType,
        due_at: new Date(dueAt).toISOString(),
        publication_status: 'published',
        created_by: profile?.id,
      });

      setAlertMsg({ type: 'success', text: 'Tugas baru berhasil dipublikasikan untuk siswa.' });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal membuat tugas: ${err.message}` });
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenSubmissions = async (ass: Assignment) => {
    setActiveAssignment(ass);
    setSubLoading(true);
    try {
      const subs = await dataService.getSubmissions(ass.id);
      setSubmissions(subs);
    } catch (err: any) {
      alert(`Gagal mengambil jawaban siswa: ${err.message}`);
    } finally {
      setSubLoading(false);
    }
  };

  const handleSaveGrade = async (subId: string) => {
    try {
      await dataService.gradeSubmission(
        subId,
        gradeScore,
        gradeFeedback,
        profile?.id || ''
      );

      // Also record to grade_records so it appears in rekap nilai
      if (activeAssignment) {
        const sub = submissions.find((s) => s.id === subId);
        if (sub?.student_id) {
          await dataService.createGradeRecord({
            student_id: sub.student_id,
            class_id: activeAssignment.class_id,
            category: 'tugas',
            title: activeAssignment.title,
            score: gradeScore,
            max_score: 100,
            weight: 1,
            recorded_date: new Date().toISOString().slice(0, 10),
          });
        }
      }

      setGradingSubId(null);
      // Reload submissions
      if (activeAssignment) {
        const updatedSubs = await dataService.getSubmissions(activeAssignment.id);
        setSubmissions(updatedSubs);
      }
      setAlertMsg({ type: 'success', text: 'Nilai dan umpan balik berhasil disimpan!' });
    } catch (err: any) {
      alert(`Gagal menyimpan nilai: ${err.message}`);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Hapus tugas ini beserta seluruh jawaban siswa yang terkumpul?')) return;
    try {
      await dataService.deleteAssignment(id);
      setAlertMsg({ type: 'success', text: 'Tugas berhasil dihapus.' });
      loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal menghapus tugas: ${err.message}` });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            <span>Tugas & Penilaian Pembelajaran PAI</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Buat tugas uraian/praktik, kelola jawaban peserta didik, dan berikan nilai serta umpan balik evaluatif.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Tugas Baru</span>
        </button>
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
          {assignments.length} Tugas Diberikan
        </span>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Memuat daftar tugas...
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">Belum Ada Tugas Aktif</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Buat tugas pertama untuk mengukur pemahaman peserta didik terhadap materi PAI.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Buat Tugas Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((ass) => (
            <div
              key={ass.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-900/40 text-blue-300 border border-blue-800 font-bold text-[11px]">
                    Kelas {ass.class?.class_name || 'SMP'}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    {ass.assignment_type}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{ass.title}</h3>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                  {ass.description}
                </p>

                <div className="text-[11px] text-slate-400 space-y-1 mb-4">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Batas: {new Date(ass.due_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400 font-semibold">{ass.submissions_count || 0} Pengumpulan</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenSubmissions(ass)}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat Jawaban & Nilai</span>
                </button>
                <button
                  onClick={() => handleDeleteAssignment(ass.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Hapus Tugas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Buat Tugas Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Buat Tugas Baru untuk Siswa</span>
            </h3>

            <form onSubmit={handleCreateAssignment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Judul Tugas <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Analisis Penerapan Nilai Kejujuran dalam Kehidupan Sehari-hari"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kelas Sasaran <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={targetClassId}
                    onChange={(e) => setTargetClassId(e.target.value)}
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Penugasan</label>
                  <select
                    value={assignmentType}
                    onChange={(e) => setAssignmentType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  >
                    <option value="uraian">Uraian / Esai</option>
                    <option value="praktik">Uji Praktik Ibadah</option>
                    <option value="portofolio">Portofolio / LKPD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Batas Waktu Pengumpulan (Deadline) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Petunjuk & Soal Tugas <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan petunjuk pengerjaan dan soal yang harus dijawab siswa..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  {formLoading ? 'Menerbitkan...' : 'Terbitkan Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions & Grading Drawer / Modal */}
      {activeAssignment && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  <span>Pengumpulan Jawaban: {activeAssignment.title}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Periksa jawaban peserta didik dan berikan nilai (0-100) serta umpan balik.
                </p>
              </div>
              <button
                onClick={() => setActiveAssignment(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {subLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Memuat jawaban siswa...
                </div>
              ) : submissions.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-400">Belum ada siswa yang mengumpulkan tugas ini.</p>
                </div>
              ) : (
                submissions.map((sub) => {
                  const isGraded = sub.score !== null && sub.score !== undefined;
                  const isEditingGrade = gradingSubId === sub.id;

                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white">
                            {sub.student?.profile?.full_name || 'Peserta Didik'}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-mono">
                            NIS: {sub.student?.student_number} &bull; Dikirim: {new Date(sub.submitted_at).toLocaleString('id-ID')}
                          </p>
                        </div>

                        <div>
                          {isGraded ? (
                            <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-xs">
                              Nilai: {sub.score} / 100
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-amber-950 text-amber-300 border border-amber-800 font-bold text-xs">
                              Belum Dinilai
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Student answer text */}
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                        {sub.answer_text || '(Tidak ada teks jawaban)'}
                      </div>

                      {/* Feedback display */}
                      {sub.feedback && !isEditingGrade && (
                        <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/40 text-xs text-slate-300">
                          <span className="font-semibold text-blue-400 block mb-0.5">Umpan Balik Guru:</span>
                          {sub.feedback}
                        </div>
                      )}

                      {/* Grading form */}
                      {isEditingGrade ? (
                        <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/40 space-y-2">
                          <div className="flex items-center gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                Berikan Nilai (0 - 100)
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={gradeScore}
                                onChange={(e) => setGradeScore(parseFloat(e.target.value) || 0)}
                                className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold outline-none focus:border-amber-400"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                Umpan Balik / Catatan Evaluatif
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: Jawaban sangat baik dan mendalam..."
                                value={gradeFeedback}
                                onChange={(e) => setGradeFeedback(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => setGradingSubId(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => handleSaveGrade(sub.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                            >
                              <Save className="w-3.5 h-3.5" /> Simpan Nilai
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              setGradingSubId(sub.id);
                              setGradeScore(sub.score || 85);
                              setGradeFeedback(sub.feedback || '');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{isGraded ? 'Ubah Nilai / Feedback' : 'Beri Nilai & Feedback'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveAssignment(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
