import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Plus,
  Trash2,
  Calendar,
  Building2,
  User,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { AttitudeRecord, AttitudeCategory, ClassItem, StudentItem } from '../types';

export const AttitudeJournalView: React.FC = () => {
  const { profile } = useAuth();

  const [records, setRecords] = useState<AttitudeRecord[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [formStudentId, setFormStudentId] = useState('');
  const [formCategory, setFormCategory] = useState<AttitudeCategory>('Spiritual');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formDesc, setFormDesc] = useState('');
  const [formCoaching, setFormCoaching] = useState('');
  const [formFollowUp, setFormFollowUp] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
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

  const handleOpenAdd = () => {
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormCategory('Spiritual');
    setFormDesc('');
    setFormCoaching('');
    setFormFollowUp('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formDesc.trim()) {
      setAlertMsg({ type: 'error', text: 'Peserta didik dan deskripsi perilaku wajib diisi.' });
      return;
    }

    setFormLoading(true);
    try {
      await dataService.createAttitudeRecord({
        student_id: formStudentId,
        teacher_id: profile?.id || '',
        record_date: formDate,
        category: formCategory,
        description: formDesc.trim(),
        coaching_notes: formCoaching.trim() || undefined,
        follow_up: formFollowUp.trim() || undefined,
      });

      setAlertMsg({ type: 'success', text: 'Catatan jurnal sikap berhasil dicatat ke Supabase.' });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal menyimpan: ${err.message}` });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus catatan sikap ini?')) return;
    try {
      await dataService.deleteAttitudeRecord(id);
      setAlertMsg({ type: 'success', text: 'Catatan sikap berhasil dihapus.' });
      loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal menghapus: ${err.message}` });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-rose-400" />
            <span>Jurnal Pengamatan Sikap & Akhlak Siswa</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pantau dan bina perkembangan sikap Spiritual, Sosial, Kedisiplinan, Toleransi, dan Kejujuran peserta didik.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Sikap Siswa</span>
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
          <option value="">Semua Rombongan Belajar</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              Kelas {c.class_name} (Tingkat {c.grade_level})
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400 font-mono ml-auto">
          {records.length} Catatan Pembinaan
        </span>
      </div>

      {/* Records List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Memuat catatan sikap...
        </div>
      ) : records.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
          <HeartHandshake className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">Belum Ada Catatan Sikap</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Catatan sikap bersifat rahasia guru untuk evaluasi dan pembinaan akhlak mulia peserta didik.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Catat Sikap Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {records.map((rec) => {
            let badgeBg = 'bg-blue-900/40 text-blue-300 border-blue-800';
            if (rec.category === 'Spiritual') badgeBg = 'bg-amber-900/40 text-amber-300 border-amber-800';
            if (rec.category === 'Kejujuran') badgeBg = 'bg-emerald-900/40 text-emerald-300 border-emerald-800';
            if (rec.category === 'Kedisiplinan') badgeBg = 'bg-purple-900/40 text-purple-300 border-purple-800';

            return (
              <div
                key={rec.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {rec.student?.profile?.full_name || 'Peserta Didik'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        NIS: {rec.student?.student_number} &bull; Kelas {rec.student?.class?.class_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeBg}`}>
                        {rec.category}
                      </span>
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    &ldquo;{rec.description}&rdquo;
                  </p>

                  <div className="space-y-1.5 text-xs">
                    {rec.coaching_notes && (
                      <div className="text-[11px] text-slate-300">
                        <span className="font-semibold text-amber-400">Bimbingan:</span> {rec.coaching_notes}
                      </div>
                    )}
                    {rec.follow_up && (
                      <div className="text-[11px] text-slate-300">
                        <span className="font-semibold text-blue-400">Tindak Lanjut:</span> {rec.follow_up}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Tanggal: {new Date(rec.record_date).toLocaleDateString('id-ID')}</span>
                  <span>Oleh Guru PAI</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-rose-400" />
              <span>Input Pengamatan Sikap & Akhlak</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Peserta Didik <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                >
                  <option value="">Pilih Siswa...</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.profile?.full_name} ({st.student_number} - {st.class?.class_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori Sikap</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  >
                    <option value="Spiritual">Spiritual (Ibadah/Doa)</option>
                    <option value="Sosial">Sosial (Tolong-menolong)</option>
                    <option value="Kedisiplinan">Kedisiplinan (Ketepatan waktu)</option>
                    <option value="Toleransi">Toleransi (Menghargai teman)</option>
                    <option value="Kejujuran">Kejujuran (Amanah/Integritas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deskripsi Perilaku Teramati <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Selalu menjadi muazin salat Dhuhur berjamaah tepat waktu dan mengajak teman-temannya..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan Pembinaan / Apresiasi Guru
                </label>
                <input
                  type="text"
                  placeholder="Diberikan apresiasi di depan kelas..."
                  value={formCoaching}
                  onChange={(e) => setFormCoaching(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tindak Lanjut</label>
                <input
                  type="text"
                  placeholder="Ditunjuk sebagai koordinator ibadah kelas..."
                  value={formFollowUp}
                  onChange={(e) => setFormFollowUp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
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
                  {formLoading ? 'Menyimpan...' : 'Simpan Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
