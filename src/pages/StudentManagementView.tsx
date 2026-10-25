import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Copy,
  Building2,
  UserCheck,
  Database,
  Check,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';
import { StudentItem, ClassItem } from '../types';

export const StudentManagementView: React.FC = () => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newNIS, setNewNIS] = useState('');
  const [newClassId, setNewClassId] = useState('');
  const [newGender, setNewGender] = useState<'L' | 'P'>('L');
  const [formLoading, setFormLoading] = useState(false);

  // Success credential popup after student creation
  const [createdStudentAccount, setCreatedStudentAccount] = useState<{
    name: string;
    nis: string;
    username: string;
    email: string;
    password: string;
  } | null>(null);

  // Edit modal
  const [editStudent, setEditStudent] = useState<StudentItem | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [editStatus, setEditStatus] = useState<'aktif' | 'mutasi' | 'lulus' | 'nonaktif'>('aktif');

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clsList, stdList] = await Promise.all([
        dataService.getClasses(),
        dataService.getStudents(selectedClassId || undefined, searchQuery || undefined),
      ]);
      setClasses(clsList);
      setStudents(stdList);
      if (!newClassId && clsList.length > 0) {
        setNewClassId(clsList[0].id);
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: `Gagal memuat data siswa: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = newFullName.trim();
    const nis = newNIS.trim();
    const targetClassId = newClassId || (classes.length > 0 ? classes[0].id : 'cls-7a');

    if (!fullName || !nis) {
      setAlertMsg({ type: 'error', text: 'Nama lengkap dan Nomor Induk Siswa (NIS) wajib diisi.' });
      return;
    }

    setFormLoading(true);
    setAlertMsg(null);

    try {
      const result = await authService.createStudentAccount(
        fullName,
        nis,
        targetClassId,
        newGender
      );

      setCreatedStudentAccount({
        name: fullName,
        nis: nis,
        username: result.username,
        email: result.email,
        password: result.defaultPassword,
      });

      setShowAddModal(false);
      setNewFullName('');
      setNewNIS('');
      await loadData();
      setAlertMsg({
        type: 'success',
        text: `Siswa "${fullName}" (NIS: ${nis}) berhasil disimpan dan akun aktif!`,
      });
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal membuat akun siswa: ${err.message}` });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;

    setFormLoading(true);
    try {
      const cleanName = editFullName.trim();
      await dataService.updateStudent(editStudent.id, {
        class_id: editClassId || null,
        enrollment_status: editStatus,
        full_name: cleanName,
        profile: {
          ...editStudent.profile,
          id: editStudent.profile?.id || editStudent.id,
          full_name: cleanName,
          username: editStudent.profile?.username || `siswa_${editStudent.student_number}`,
          role: 'siswa',
          avatar_path: null,
          phone: null,
          is_active: editStatus === 'aktif',
        },
      });

      if (editStudent.profile_id) {
        await authService.updateProfile(editStudent.profile_id, {
          full_name: cleanName,
        });
      }

      setAlertMsg({ type: 'success', text: `Data siswa "${cleanName}" berhasil diperbarui di Supabase!` });
      setEditStudent(null);
      await loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal mengupdate: ${err.message}` });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await dataService.deleteStudent(id);
      setAlertMsg({ type: 'success', text: 'Data siswa berhasil dihapus.' });
      setDeleteId(null);
      loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal menghapus siswa: ${err.message}` });
    }
  };

  const exportToCSV = () => {
    if (students.length === 0) return;
    const headers = ['No', 'NIS', 'Nama Lengkap', 'Jenis Kelamin', 'Kelas', 'Status'];
    const rows = students.map((st, i) => [
      i + 1,
      `"${st.student_number || ''}"`,
      `"${st.profile?.full_name || ''}"`,
      st.gender || '-',
      `"${st.class?.class_name || '-'}"`,
      st.enrollment_status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data-siswa-pai-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            <span>Manajemen Data & Akun Siswa</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola data siswa, penempatan kelas, dan pembuatan akun login siswa otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={students.length === 0}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => {
              if (classes.length > 0) {
                setNewClassId(classes[0].id);
              }
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa Baru</span>
          </button>
        </div>
      </div>

      {/* Supabase Status & Schema Helper Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-900/50 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mt-0.5">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Penyimpanan Nama Siswa di Supabase</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Aktif & Terhubung ke Supabase
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Nama lengkap siswa tersimpan permanen di Supabase (tabel <code className="text-amber-300 font-mono">students</code> & <code className="text-amber-300 font-mono">audit_logs</code>). Anda juga dapat menjalankan perintah SQL berikut jika ingin membuat kolom khusus <code className="text-blue-300 font-mono">full_name</code> di Table Editor:
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              const sql = `ALTER TABLE public.students ADD COLUMN IF NOT EXISTS full_name TEXT;\nALTER TABLE public.students ADD COLUMN IF NOT EXISTS username TEXT;\nALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;`;
              navigator.clipboard.writeText(sql);
              setCopiedSql(true);
              setTimeout(() => setCopiedSql(false), 3000);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">SQL Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-blue-400" />
                <span>Salin SQL Supabase</span>
              </>
            )}
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

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full sm:w-48 bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 outline-none focus:border-amber-400"
          >
            <option value="">Semua Rombongan Belajar</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.class_name} (Kelas {c.grade_level})
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari NIS atau Nama Siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Memuat data siswa dari Supabase...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">Belum Ada Data Siswa</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Tambahkan siswa baru untuk membuat profil dan akun login mereka secara otomatis.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tambah Siswa Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">L/P</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Akun Login</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {students.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {st.student_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {st.profile?.full_name || 'Tanpa Nama'}
                    </td>
                    <td className="py-3 px-4">{st.gender || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 font-semibold text-[11px] border border-blue-800">
                        {st.class?.class_name || 'Belum diatur'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      @{st.profile?.username || `siswa_${st.student_number}`}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          st.enrollment_status === 'aktif'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {st.enrollment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditStudent(st);
                            setEditFullName(st.profile?.full_name || '');
                            setEditClassId(st.class_id || '');
                            setEditStatus(st.enrollment_status || 'aktif');
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Edit Siswa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(st.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Tambah Siswa Baru & Auto-generate Akun */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <span>Tambah Siswa & Buat Akun Login</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Sistem akan otomatis membuat akun login siswa dengan NIS dan kata sandi default.
            </p>

            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lengkap Siswa <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Rizki"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nomor Induk Siswa (NIS) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 20240101"
                    value={newNIS}
                    onChange={(e) => setNewNIS(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Kelamin</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Kelas <span className="text-rose-400">*</span>
                </label>
                <select
                  value={newClassId || (classes[0]?.id || '')}
                  onChange={(e) => setNewClassId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_name} (Tingkat {cls.grade_level})
                    </option>
                  ))}
                  {classes.length === 0 && (
                    <option value="cls-7a">VII A (Tingkat 7)</option>
                  )}
                </select>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="text-amber-400 font-semibold flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" /> Format Kredensial Otomatis:
                </div>
                <div>Username: <span className="font-mono text-slate-200">siswa_[nis]</span></div>
                <div>Sandi Default: <span className="font-mono text-slate-200">Pai@[nis]</span></div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {formLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan Siswa...</span>
                    </>
                  ) : (
                    <span>Simpan Siswa</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Akun Siswa Baru Berhasil Dibuat */}
      {createdStudentAccount && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white text-center mb-1">
              Akun Siswa Berhasil Dibuat!
            </h3>
            <p className="text-xs text-slate-400 text-center mb-4">
              Berikan informasi akun berikut kepada peserta didik untuk login ke portal siswa.
            </p>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Nama:</span>
                <span className="text-white font-bold">{createdStudentAccount.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">NIS:</span>
                <span className="text-amber-400 font-bold">{createdStudentAccount.nis}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Username:</span>
                <span className="text-blue-400 font-bold">{createdStudentAccount.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kata Sandi:</span>
                <span className="text-emerald-400 font-bold">{createdStudentAccount.password}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Akun PAI Siswa:\nNama: ${createdStudentAccount.name}\nUsername: ${createdStudentAccount.username}\nKata Sandi: ${createdStudentAccount.password}`
                  );
                  alert('Kredensial disalin!');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Salin Info Akun
              </button>
              <button
                onClick={() => setCreatedStudentAccount(null)}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Edit Data Siswa</h3>
            <form onSubmit={handleUpdateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pindah Kelas</label>
                <select
                  value={editClassId}
                  onChange={(e) => setEditClassId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                >
                  <option value="">Pilih Kelas...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.class_name} (Kelas {c.grade_level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status Keaktifan</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                >
                  <option value="aktif">Aktif</option>
                  <option value="mutasi">Mutasi / Pindah</option>
                  <option value="lulus">Lulus</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditStudent(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Simpan Perubahan
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
            <h4 className="text-sm font-bold text-white mb-2">Hapus Data Siswa?</h4>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Data nilai dan absensi siswa ini akan dihapus dari sistem.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteStudent(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
