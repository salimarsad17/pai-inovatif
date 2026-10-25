import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Users,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { ClassItem, UserProfile } from '../types';

export const ClassManagementView: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<ClassItem | null>(null);

  // Form states
  const [className, setClassName] = useState('');
  const [gradeLevel, setGradeLevel] = useState<number>(7);
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [formLoading, setFormLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await dataService.getClasses();
      setClasses(data);
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: `Gagal memuat kelas: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleOpenAdd = () => {
    setEditItem(null);
    setClassName('');
    setGradeLevel(7);
    setAcademicYear('2025/2026');
    setShowAddModal(true);
  };

  const handleOpenEdit = (cls: ClassItem) => {
    setEditItem(cls);
    setClassName(cls.class_name);
    setGradeLevel(cls.grade_level);
    setAcademicYear(cls.academic_year);
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    setFormLoading(true);
    setAlertMsg(null);

    try {
      if (editItem) {
        await dataService.updateClass(editItem.id, {
          class_name: className.trim(),
          grade_level: gradeLevel,
          academic_year: academicYear.trim(),
        });
        setAlertMsg({ type: 'success', text: `Kelas ${className} berhasil diperbarui.` });
      } else {
        await dataService.createClass({
          class_name: className.trim(),
          grade_level: gradeLevel,
          academic_year: academicYear.trim(),
        });
        setAlertMsg({ type: 'success', text: `Kelas ${className} berhasil ditambahkan ke database.` });
      }
      setShowAddModal(false);
      loadClasses();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Operasi gagal: ${err.message}` });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dataService.deleteClass(id);
      setAlertMsg({ type: 'success', text: 'Kelas berhasil dihapus dari database.' });
      setDeleteId(null);
      loadClasses();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal menghapus kelas: ${err.message}` });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            <span>Manajemen Data Kelas</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola data rombongan belajar jenjang Kelas 7, 8, dan 9 UPT SMPN 2 Rebang Tangkas.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas Baru</span>
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

      {/* Classes Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Memuat data kelas dari Supabase...
        </div>
      ) : classes.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">Belum Ada Data Kelas</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Tambahkan rombongan belajar pertama untuk mulai mengelompokkan siswa dan materi PAI.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Tambah Kelas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold text-xs">
                    Tingkat {cls.grade_level} SMP
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">TP {cls.academic_year}</span>
                </div>

                <h3 className="text-lg font-black text-white mb-1">{cls.class_name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-4">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>{cls.students_count || 0} Siswa Terdaftar</span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(cls)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1"
                  title="Edit Kelas"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setDeleteId(cls.id)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 transition-colors text-xs flex items-center gap-1"
                  title="Hapus Kelas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">
              {editItem ? 'Edit Data Kelas' : 'Tambah Rombongan Belajar Baru'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Kelas <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: VII A, VIII B, IX C"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tingkat</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  >
                    <option value={7}>Kelas 7</option>
                    <option value={8}>Kelas 8</option>
                    <option value={9}>Kelas 9</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white mb-2">Konfirmasi Hapus Kelas?</h4>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Data absensi dan tugas terkait kelas ini dapat terpengaruh.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
