import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Filter,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { TeachingDocument } from '../types';

export const TeachingDocumentsView: React.FC = () => {
  const { profile, schoolSettings } = useAuth();

  const [documents, setDocuments] = useState<TeachingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<number>(0);

  // Form Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TeachingDocument['category']>('Modul Ajar');
  const [gradeLevel, setGradeLevel] = useState<number>(7);
  const [semester, setSemester] = useState<string>('Ganjil');
  const [fileUrl, setFileUrl] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const categories: Array<TeachingDocument['category']> = [
    'CP',
    'TP',
    'ATP',
    'Prota',
    'Promes',
    'Modul Ajar',
    'RPP',
    'Dokumen Pendukung',
  ];

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await dataService.getTeachingDocuments(
        selectedCategory || undefined,
        selectedGrade || undefined
      );
      setDocuments(data);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal memuat dokumen: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [selectedCategory, selectedGrade]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setFormLoading(true);
    setAlertMsg(null);

    try {
      await dataService.createTeachingDocument({
        title: title.trim(),
        category,
        grade_level: gradeLevel,
        semester,
        academic_year: schoolSettings?.academic_year || '2025/2026',
        file_url: fileUrl.trim() || null,
        description: description.trim() || undefined,
        created_by: profile?.id,
      });

      setAlertMsg({ type: 'success', text: `Dokumen ${title} berhasil diarsipkan ke database.` });
      setShowModal(false);
      setTitle('');
      setFileUrl('');
      setDescription('');
      loadDocuments();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal menyimpan dokumen: ${err.message}` });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus dokumen ini dari arsip?')) return;
    try {
      await dataService.deleteTeachingDocument(id);
      setAlertMsg({ type: 'success', text: 'Dokumen berhasil dihapus.' });
      loadDocuments();
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
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Perangkat Ajar Kurikulum Merdeka</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Arsip Capaian Pembelajaran (CP), TP, ATP, Program Tahunan, Program Semester, dan Modul Ajar PAI.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Dokumen</span>
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

      {/* Category Pills & Grade Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Horizontal Category Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === ''
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Semua Dokumen
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grade filter */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(parseInt(e.target.value, 10))}
            className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 outline-none focus:border-amber-400"
          >
            <option value={0}>Semua Tingkat (7, 8, 9)</option>
            <option value={7}>Kelas 7 SMP</option>
            <option value={8}>Kelas 8 SMP</option>
            <option value={9}>Kelas 9 SMP</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Memuat perangkat ajar...
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
          <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">Belum Ada Dokumen Perangkat Ajar</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Arsipkan CP, TP, ATP, Prota, Promes, atau Modul Ajar Kurikulum Merdeka Anda di sini.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Tambah Dokumen Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-bold uppercase">
                    {doc.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Kelas {doc.grade_level} &bull; {doc.semester}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1.5 line-clamp-2">{doc.title}</h3>
                {doc.description && (
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                    {doc.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                {doc.file_url ? (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Dokumen</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-500 italic">Dokumen Teks</span>
                )}

                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Document */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>Arsip Perangkat Ajar Baru</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Judul Dokumen <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Modul Ajar PAI Bab 1 Kelas 7 Semester Ganjil"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tingkat Kelas</label>
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tautan / URL Dokumen Drive</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Keterangan Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan mengenai modul..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
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
                  {formLoading ? 'Menyimpan...' : 'Simpan Dokumen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
