import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Upload,
  BookOpen,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Search,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { TeachingDocument } from '../types';
import { DocumentReaderModal } from '../components/DocumentReaderModal';

export const TeachingDocumentsView: React.FC = () => {
  const { profile, schoolSettings } = useAuth();

  const [documents, setDocuments] = useState<TeachingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // In-app Document Reader Modal state
  const [readingDoc, setReadingDoc] = useState<TeachingDocument | null>(null);

  // Form & Upload Modal state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TeachingDocument['category']>('CP');
  const [gradeLevel, setGradeLevel] = useState<number>(7);
  const [semester, setSemester] = useState<string>('Ganjil');
  const [fileUrl, setFileUrl] = useState('');
  const [description, setDescription] = useState('');

  // Uploaded file state
  const [uploadedFileData, setUploadedFileData] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickUploadRef = useRef<HTMLInputElement>(null);

  const categories: Array<TeachingDocument['category']> = [
    'CP',
    'TP',
    'ATP',
    'Prota',
    'Promes',
    'Modul Ajar',
    'KKTP',
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

  // Helper to detect file category from filename
  const detectCategoryFromName = (filename: string): TeachingDocument['category'] => {
    const fn = filename.toUpperCase();
    if (fn.includes('KKTP')) return 'KKTP';
    if (fn.includes('ATP')) return 'ATP';
    if (fn.includes('CP')) return 'CP';
    if (fn.includes('PROTA')) return 'Prota';
    if (fn.includes('PROMES')) return 'Promes';
    if (fn.includes('MODUL') || fn.includes('AJAR')) return 'Modul Ajar';
    if (fn.includes('TP')) return 'TP';
    return 'Dokumen Pendukung';
  };

  // Helper to detect file type extension
  const detectFileType = (file: File): string => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
    if (name.endsWith('.docx') || name.endsWith('.doc')) return 'docx';
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) return 'xlsx';
    if (file.type.startsWith('image/') || name.match(/\.(png|jpe?g|webp|gif|svg)$/)) return 'image';
    return 'txt';
  };

  // Handle file selection from input
  const processSelectedFile = (file: File) => {
    const fType = detectFileType(file);
    const autoCat = detectCategoryFromName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedFileData(result);
      setUploadedFileName(file.name);
      setUploadedFileType(fType);
      setUploadedFileSize(file.size);

      // Auto-suggest title if empty
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ');
        setTitle(cleanName);
      }
      setCategory(autoCat);
      setShowModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleQuickUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processSelectedFile(files[0]);
    }
    e.target.value = '';
  };

  const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processSelectedFile(files[0]);
    }
    e.target.value = '';
  };

  const handleOpenAddModal = (presetCategory?: TeachingDocument['category']) => {
    setTitle('');
    setCategory(presetCategory || (selectedCategory as any) || 'CP');
    setGradeLevel(selectedGrade || 7);
    setSemester('Ganjil');
    setFileUrl('');
    setDescription('');
    setUploadedFileData(null);
    setUploadedFileName(null);
    setUploadedFileType(null);
    setUploadedFileSize(null);
    setShowModal(true);
  };

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
        file_data: uploadedFileData || null,
        file_name: uploadedFileName || null,
        file_type: uploadedFileType || (fileUrl ? 'pdf' : 'txt'),
        file_size: uploadedFileSize || null,
        description: description.trim() || undefined,
        created_by: profile?.id,
      });

      setAlertMsg({
        type: 'success',
        text: `Dokumen "${title}" berhasil disimpan dan siap dibaca di aplikasi.`,
      });
      setShowModal(false);
      setTitle('');
      setFileUrl('');
      setDescription('');
      setUploadedFileData(null);
      setUploadedFileName(null);
      setUploadedFileType(null);
      loadDocuments();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal menyimpan dokumen: ${err.message}` });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, docTitle: string) => {
    if (!confirm(`Hapus dokumen "${docTitle}" dari arsip?`)) return;
    try {
      await dataService.deleteTeachingDocument(id);
      setAlertMsg({ type: 'success', text: `Dokumen "${docTitle}" berhasil dihapus.` });
      loadDocuments();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal menghapus: ${err.message}` });
    }
  };

  // Filtered documents by search
  const filteredDocuments = documents.filter((doc) => {
    if (!searchKeyword.trim()) return true;
    const q = searchKeyword.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      (doc.description && doc.description.toLowerCase().includes(q)) ||
      (doc.file_name && doc.file_name.toLowerCase().includes(q))
    );
  });

  // Badge formatter for file type
  const renderTypeIcon = (doc: TeachingDocument) => {
    const type = (doc.file_type || '').toLowerCase();
    const name = (doc.file_name || doc.file_url || '').toLowerCase();

    if (type === 'docx' || name.endsWith('.docx') || name.endsWith('.doc')) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-blue-950/80 border border-blue-700/80 text-blue-300 font-bold text-[10px] flex items-center gap-1">
          <FileText className="w-3 h-3 text-blue-400" />
          <span>Word</span>
        </span>
      );
    }
    if (type === 'xlsx' || name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
          <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
          <span>Excel</span>
        </span>
      );
    }
    if (type === 'pdf' || name.endsWith('.pdf')) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-700/80 text-rose-300 font-bold text-[10px] flex items-center gap-1">
          <File className="w-3 h-3 text-rose-400" />
          <span>PDF</span>
        </span>
      );
    }
    if (type === 'image' || name.match(/\.(png|jpe?g|webp|gif|svg)$/)) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-700/80 text-purple-300 font-bold text-[10px] flex items-center gap-1">
          <ImageIcon className="w-3 h-3 text-purple-400" />
          <span>Gambar</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-700/80 text-amber-300 font-bold text-[10px] flex items-center gap-1">
        <BookOpen className="w-3 h-3 text-amber-400" />
        <span>Kurikulum</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Hidden file input for quick direct upload */}
      <input
        type="file"
        ref={quickUploadRef}
        onChange={handleQuickUploadChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*,.txt"
        className="hidden"
      />

      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Perangkat Ajar Kurikulum Merdeka</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Arsip lengkap <strong>CP, TP, ATP, Prota, Promes, Modul Ajar, dan KKTP</strong> dengan pembaca dokumen langsung di dalam aplikasi (Word, PDF, Excel, Gambar).
          </p>
        </div>

        {/* Action Buttons: Upload & Tambah Dokumen */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Direct File Upload Button */}
          <button
            type="button"
            onClick={() => quickUploadRef.current?.click()}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-102 cursor-pointer"
            title="Unggah dokumen langsung dari komputer (Word, PDF, Excel, Gambar)"
          >
            <Upload className="w-4 h-4 font-black" />
            <span>Upload Dokumen</span>
          </button>

          {/* Manual Entry Button */}
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-102 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dokumen</span>
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

      {/* Category Pills & Filters Toolbar */}
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
            Semua Dokumen ({documents.length})
          </button>
          {categories.map((cat) => {
            const count = documents.filter((d) => d.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{cat}</span>
                {count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 font-mono">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Search & Grade filter */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari dokumen..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-xl pl-8 pr-3 py-1.5 outline-none focus:border-amber-400 placeholder-slate-500"
            />
          </div>

          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(parseInt(e.target.value, 10))}
            className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-1.5 outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value={0}>Semua Tingkat</option>
            <option value={7}>Kelas 7</option>
            <option value={8}>Kelas 8</option>
            <option value={9}>Kelas 9</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">
          <div className="w-7 h-7 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat arsip perangkat ajar...
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
          <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">Tidak Ada Dokumen Pada Kategori Ini</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Klik tombol <strong>Upload Dokumen</strong> untuk mengunggah file Word, PDF, Excel, atau Gambar, atau buat arsip dokumen baru.
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => quickUploadRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" /> Upload File Sekarang
            </button>
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tambah Manual
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-sm flex flex-col justify-between group"
            >
              <div>
                {/* Category & Format Badges */}
                <div className="flex items-center justify-between mb-2.5 gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-black uppercase">
                      {doc.category}
                    </span>
                    {renderTypeIcon(doc)}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Kelas {doc.grade_level} &bull; {doc.semester}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-white mb-2 leading-snug group-hover:text-amber-300 transition-colors">
                  {doc.title}
                </h3>

                {/* Description */}
                {doc.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {doc.description}
                  </p>
                )}

                {/* Uploaded File Name preview */}
                {doc.file_name && (
                  <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                    <span className="truncate max-w-[200px]" title={doc.file_name}>
                      📎 {doc.file_name}
                    </span>
                    {doc.file_size ? (
                      <span className="text-slate-500 shrink-0 text-[10px]">
                        {(doc.file_size / 1024).toFixed(0)} KB
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Bottom Actions: Baca Dokumen (Primary) & Extra buttons */}
              <div className="pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {/* In-app Document Reader Button (Primary requested feature) */}
                <button
                  type="button"
                  onClick={() => setReadingDoc(doc)}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 transition-all hover:scale-102 cursor-pointer"
                  title="Buka dan baca dokumen ini langsung di dalam aplikasi"
                >
                  <BookOpen className="w-3.5 h-3.5 font-bold" />
                  <span>Baca Dokumen</span>
                </button>

                {doc.file_url && (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 transition-colors"
                    title="Buka Tautan Eksternal"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(doc.id, doc.title)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Hapus Dokumen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==============================================================
          UPLOAD & TAMBAH DOKUMEN MODAL
      ============================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                <span>Upload & Arsip Perangkat Ajar</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              {/* File Upload Drop Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>File Dokumen (Word, PDF, Excel, Gambar)</span>
                  <span className="text-[10px] text-amber-300 font-mono">Bisa dibaca langsung</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleModalFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*,.txt"
                  className="hidden"
                />

                {uploadedFileName ? (
                  <div className="p-3 rounded-xl bg-slate-950 border border-emerald-600/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 font-bold" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate text-xs">{uploadedFileName}</p>
                        <p className="text-[10px] text-emerald-400 font-mono">
                          Format: {uploadedFileType?.toUpperCase()} &bull;{' '}
                          {uploadedFileSize ? (uploadedFileSize / 1024).toFixed(0) : 0} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFileData(null);
                        setUploadedFileName(null);
                        setUploadedFileType(null);
                        setUploadedFileSize(null);
                      }}
                      className="text-slate-400 hover:text-rose-400 text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-5 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/60 hover:bg-slate-950 text-center cursor-pointer transition-all group"
                  >
                    <Upload className="w-7 h-7 text-slate-500 group-hover:text-emerald-400 mx-auto mb-1.5 transition-colors" />
                    <p className="font-bold text-slate-200 group-hover:text-white text-xs">
                      Klik untuk Pilih File Dokumen
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Mendukung <strong>.docx (Word)</strong>, <strong>.pdf</strong>, <strong>.xlsx (Excel)</strong>, atau <strong>Foto/Gambar</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Judul Dokumen */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Judul Dokumen <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: KKTP PAI Bab 1 Kelas 7 Semester Ganjil"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              {/* Kategori & Tingkat Kelas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer font-medium"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer font-medium"
                  >
                    <option value={7}>Kelas 7</option>
                    <option value={8}>Kelas 8</option>
                    <option value={9}>Kelas 9</option>
                  </select>
                </div>
              </div>

              {/* Semester */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                    <option value="Ganjil & Genap">Ganjil & Genap (1 Tahun)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tautan Drive / Web <span className="text-slate-500 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Keterangan / Catatan Singkat
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan mengenai materi pokok, capaian, atau penggunaan modul..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan & Arsipkan Dokumen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          IN-APP DOCUMENT READER MODAL (WORD, PDF, EXCEL, GAMBAR, TEKS)
      ============================================================== */}
      {readingDoc && (
        <DocumentReaderModal
          document={readingDoc}
          onClose={() => setReadingDoc(null)}
        />
      )}
    </div>
  );
};
