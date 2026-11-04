import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  X,
  Check,
  FolderOpen,
  Sparkles,
  RotateCcw,
  Camera,
  Layers,
} from 'lucide-react';
import { TextbookChapter, TeachingDocument } from '../types';
import {
  getDefaultTextbookChapters,
  DEFAULT_TEXTBOOK_CHAPTERS_K7,
  DEFAULT_TEXTBOOK_CHAPTERS_K8,
  DEFAULT_TEXTBOOK_CHAPTERS_K9,
} from '../data/defaultTextbookChapters';
import { documentStorage } from '../services/documentStorage';
import { DocumentReaderModal } from '../components/DocumentReaderModal';

interface StudentTextbookViewProps {
  gradeLevel?: number;
  onSelectMenu?: (menuId: string) => void;
}

// Preset gallery for cover images (rich educational and Islamic illustrations)
export const PRESET_COVER_GALLERY = [
  {
    id: 'pmm-library',
    label: 'Ilustrasi Buku PMM (Perpustakaan & Pramuka)',
    url: '/assets/aistudio/image_802beb1e.png',
    category: 'PMM Resmi',
  },
  {
    id: 'masjid-modern',
    label: 'Arsitektur Masjid Raya Modern',
    url: '/masjid-al-jabbar-modern.jpg',
    category: 'Arsitektur & Sejarah',
  },
  {
    id: 'santri-salafi',
    label: 'Santri Membaca Kitab Kuning',
    url: '/santri-salafi.jpg',
    category: 'Keilmuan Islam',
  },
  {
    id: 'santri-murajaah',
    label: "Santri Muraja'ah Al-Qur'an",
    url: '/santri-murajaah.jpg',
    category: "Al-Qur'an & Hadis",
  },
  {
    id: 'berguru',
    label: 'Belajar Bersama Guru di Perpustakaan',
    url: '/berguru.jpg',
    category: 'Pendidikan & Literasi',
  },
  {
    id: 'pendidikan-santri',
    label: 'Pendidikan Akhlak Santri Bersama',
    url: '/pendidikan-santri.jpg',
    category: 'Akhlak & Karakter',
  },
  {
    id: 'santri-tanbihul',
    label: 'Santri Belajar Mandiri di Pesantren',
    url: '/santri-tanbihul.jpg',
    category: 'Kemandirian & Adab',
  },
  {
    id: 'three-children',
    label: 'Tiga Sahabat Menuntut Ilmu',
    url: '/three-children.jpg',
    category: 'Ukhuwah & Moderasi',
  },
];

export const StudentTextbookView: React.FC<StudentTextbookViewProps> = ({
  gradeLevel = 7,
  onSelectMenu,
}) => {
  const [activeGrade, setActiveGrade] = useState<number>(gradeLevel);

  // Sync activeGrade if prop changes
  useEffect(() => {
    setActiveGrade(gradeLevel);
  }, [gradeLevel]);

  // Load chapters for active grade from localStorage or defaults
  const loadChaptersForGrade = (grade: number): TextbookChapter[] => {
    if (typeof window === 'undefined') return getDefaultTextbookChapters(grade);
    try {
      const stored = localStorage.getItem(`pai_textbook_chapters_k${grade}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed loading chapters from localStorage:', e);
    }
    return getDefaultTextbookChapters(grade);
  };

  const [chapters, setChapters] = useState<TextbookChapter[]>(() => loadChaptersForGrade(gradeLevel));

  // Re-fetch chapters whenever activeGrade changes
  useEffect(() => {
    setChapters(loadChaptersForGrade(activeGrade));
  }, [activeGrade]);

  const [selectedSemester, setSelectedSemester] = useState<string>('Semua');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // In-app Document Reader Modal state
  const [readingDoc, setReadingDoc] = useState<TeachingDocument | null>(null);

  // Dedicated "Ubah / Ganti Gambar Sampul" Modal
  const [coverModalChapter, setCoverModalChapter] = useState<TextbookChapter | null>(null);
  const [tempCoverImage, setTempCoverImage] = useState<string>('');
  const [customCoverUrl, setCustomCoverUrl] = useState<string>('');
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Form Modal (Input / Edit / Upload Buku)
  const [showModal, setShowModal] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [tag, setTag] = useState('PMM');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('/assets/aistudio/image_802beb1e.png');

  // File upload state for chapter book
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickUploadInputRef = useRef<HTMLInputElement>(null);
  const targetUploadChapterIdRef = useRef<string | null>(null);

  // Save chapters to state and localStorage (safely stripping heavy file_data)
  const saveChapters = (newChapters: TextbookChapter[], grade = activeGrade) => {
    setChapters(newChapters);
    if (typeof window !== 'undefined') {
      try {
        const lightChapters = newChapters.map((ch) => {
          if (ch.file_data) {
            const { file_data, ...rest } = ch;
            return rest;
          }
          return ch;
        });
        localStorage.setItem(`pai_textbook_chapters_k${grade}`, JSON.stringify(lightChapters));
      } catch (err) {
        console.warn('Failed saving chapters to localStorage:', err);
      }
    }
  };

  // Sanitize any existing bloated chapters in localStorage to free up browser quota
  useEffect(() => {
    if (typeof window === 'undefined') return;
    [7, 8, 9].forEach((g) => {
      try {
        const key = `pai_textbook_chapters_k${g}`;
        const raw = localStorage.getItem(key);
        if (raw && (raw.includes('data:') || raw.length > 50000)) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const sanitized = parsed.map((item: any) => {
              if (item.file_data) {
                if (item.id) {
                  documentStorage.saveFile(item.id, item.file_data).catch(() => {});
                }
                const { file_data, ...rest } = item;
                return rest;
              }
              return item;
            });
            localStorage.setItem(key, JSON.stringify(sanitized));
          }
        }
      } catch {}
    });
  }, []);

  // Switch Grade Handler
  const handleSwitchGrade = (grade: number) => {
    setActiveGrade(grade);
    if (onSelectMenu) {
      onSelectMenu(`bahan_ajar_k${grade}`);
    }
  };

  // Helper detect file extension
  const detectFileType = (file: File): string => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
    if (name.endsWith('.docx') || name.endsWith('.doc')) return 'docx';
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) return 'xlsx';
    if (file.type.startsWith('image/') || name.match(/\.(png|jpe?g|webp|gif|svg)$/)) return 'image';
    return 'txt';
  };

  // Process file upload inside edit modal
  const handleFileSelected = (file: File) => {
    const fType = detectFileType(file);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileData(result);
      setFileName(file.name);
      setFileType(fType);
      setFileSize(file.size);

      // Auto-fill title if empty
      if (!title) {
        const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[_\-]/g, ' ');
        setTitle(clean);
      }
    };
    reader.readAsDataURL(file);
  };

  // Direct chapter upload handler from card button
  const handleDirectChapterUpload = (chapterId: string) => {
    targetUploadChapterIdRef.current = chapterId;
    quickUploadInputRef.current?.click();
  };

  const handleQuickUploadFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const targetId = targetUploadChapterIdRef.current;
    if (files && files[0] && targetId) {
      const file = files[0];
      const fType = detectFileType(file);
      const reader = new FileReader();

      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await documentStorage.saveFile(targetId, dataUrl);

        const updated = chapters.map((ch) => {
          if (ch.id === targetId) {
            return {
              ...ch,
              file_data: dataUrl,
              file_name: file.name,
              file_type: fType,
              file_size: file.size,
              updated_at: new Date().toISOString(),
            };
          }
          return ch;
        });

        saveChapters(updated);
        setAlertMsg({
          type: 'success',
          text: `Berkas buku "${file.name}" (${fType.toUpperCase()}) berhasil diunggah ke bab ini.`,
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
    targetUploadChapterIdRef.current = null;
  };

  // ============================================================================
  // OPEN & HANDLE "UBAH / GANTI GAMBAR SAMPUL" MODAL
  // ============================================================================
  const handleOpenCoverModal = (ch: TextbookChapter) => {
    setCoverModalChapter(ch);
    setTempCoverImage(ch.cover_image || '/assets/aistudio/image_802beb1e.png');
    setCustomCoverUrl('');
  };

  // Handle local image file upload from user's computer
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setTempCoverImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Reset to default cover matching this chapter's standard curriculum
  const handleResetToCurriculumCover = () => {
    if (!coverModalChapter) return;
    const defaults = getDefaultTextbookChapters(activeGrade);
    const defaultCh =
      defaults.find((c) => c.id === coverModalChapter.id) ||
      defaults.find((c) => c.chapter_number === coverModalChapter.chapter_number);
    if (defaultCh?.cover_image) {
      setTempCoverImage(defaultCh.cover_image);
    } else {
      setTempCoverImage('/assets/aistudio/image_802beb1e.png');
    }
  };

  // Save the selected or uploaded cover image
  const handleSaveCoverImage = () => {
    if (!coverModalChapter) return;
    const finalImage = customCoverUrl.trim() || tempCoverImage;
    const updated = chapters.map((ch) => {
      if (ch.id === coverModalChapter.id) {
        return {
          ...ch,
          cover_image: finalImage,
          updated_at: new Date().toISOString(),
        };
      }
      return ch;
    });

    saveChapters(updated);
    setAlertMsg({
      type: 'success',
      text: `Gambar sampul Bab ${coverModalChapter.chapter_number}: "${coverModalChapter.title}" berhasil diubah!`,
    });
    setCoverModalChapter(null);
  };

  // Reset all chapters of this grade to initial curriculum data
  const handleResetAllChaptersToDefault = () => {
    if (
      !confirm(
        `Kembalikan semua daftar bab dan gambar sampul Kelas ${activeGrade} ke kurikulum standar PAI Fase D?`
      )
    )
      return;

    const defaults = getDefaultTextbookChapters(activeGrade);
    saveChapters(defaults);
    setAlertMsg({
      type: 'success',
      text: `Daftar buku pelajaran dan gambar materi Kelas ${activeGrade} berhasil dikembalikan ke standar kurikulum.`,
    });
  };

  // ============================================================================
  // OPEN & HANDLE GENERAL CHAPTER EDIT / CREATE MODAL
  // ============================================================================
  const handleOpenAdd = () => {
    setEditingChapterId(null);
    setChapterNumber(chapters.length + 1);
    setTitle('');
    setSemester('Ganjil');
    setTag('PMM');
    setDescription('');
    // Pick an appropriate default cover for the new chapter
    const defaults = getDefaultTextbookChapters(activeGrade);
    const defaultCover =
      defaults[(chapters.length) % defaults.length]?.cover_image || '/assets/aistudio/image_802beb1e.png';
    setCoverImage(defaultCover);
    setFileData(null);
    setFileName(null);
    setFileType(null);
    setFileSize(null);
    setShowModal(true);
  };

  const handleOpenEdit = async (ch: TextbookChapter) => {
    setEditingChapterId(ch.id);
    setChapterNumber(ch.chapter_number);
    setTitle(ch.title);
    setSemester(ch.semester);
    setTag(ch.tag || 'PMM');
    setDescription(ch.description || '');
    setCoverImage(ch.cover_image || '/assets/aistudio/image_802beb1e.png');

    let fData = ch.file_data || null;
    if (!fData && ch.id) {
      fData = await documentStorage.getFile(ch.id);
    }
    setFileData(fData);
    setFileName(ch.file_name || null);
    setFileType(ch.file_type || null);
    setFileSize(ch.file_size || null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setAlertMsg({ type: 'error', text: 'Judul Bab wajib diisi.' });
      return;
    }

    const chId = editingChapterId || `ch-k${activeGrade}-${Date.now()}`;

    if (fileData) {
      await documentStorage.saveFile(chId, fileData);
    }

    const newChapterItem: TextbookChapter = {
      id: chId,
      grade_level: activeGrade,
      chapter_number: Number(chapterNumber) || 1,
      title: title.trim(),
      semester,
      tag: tag.trim() || 'PMM',
      description: description.trim(),
      cover_image: coverImage || '/assets/aistudio/image_802beb1e.png',
      file_data: fileData,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      content_text: editingChapterId
        ? chapters.find((c) => c.id === editingChapterId)?.content_text || description
        : `# ${title}\n\n${description}`,
      updated_at: new Date().toISOString(),
      created_at: editingChapterId
        ? chapters.find((c) => c.id === editingChapterId)?.created_at
        : new Date().toISOString(),
    };

    let updated: TextbookChapter[];
    if (editingChapterId) {
      updated = chapters.map((c) => (c.id === editingChapterId ? newChapterItem : c));
      setAlertMsg({ type: 'success', text: `Bab "${title}" berhasil diperbarui.` });
    } else {
      updated = [...chapters, newChapterItem].sort((a, b) => a.chapter_number - b.chapter_number);
      setAlertMsg({ type: 'success', text: `Bab "${title}" baru berhasil ditambahkan ke Buku Pelajaran Kelas ${activeGrade}.` });
    }

    saveChapters(updated);
    setShowModal(false);
  };

  const handleDelete = (chId: string, chTitle: string) => {
    if (!confirm(`Hapus "${chTitle}" dari daftar buku pelajaran Kelas ${activeGrade}?`)) return;
    const updated = chapters.filter((c) => c.id !== chId);
    saveChapters(updated);
    documentStorage.deleteFile(chId).catch(() => {});
    setAlertMsg({ type: 'success', text: `Bab "${chTitle}" berhasil dihapus.` });
  };

  // Read Chapter in DocumentReaderModal
  const handleReadChapter = async (ch: TextbookChapter) => {
    let resolvedData = ch.file_data;
    if (!resolvedData) {
      resolvedData = await documentStorage.getFile(ch.id);
    }

    const docAdapter: TeachingDocument = {
      id: ch.id,
      title: ch.title,
      category: 'Modul Ajar',
      grade_level: ch.grade_level,
      semester: ch.semester,
      academic_year: '2025/2026',
      file_data: resolvedData,
      file_name: ch.file_name || `${ch.title}.${ch.file_type || 'txt'}`,
      file_type: ch.file_type || 'txt',
      file_size: ch.file_size,
      content_text: ch.content_text || ch.description,
      description: ch.description,
    };

    setReadingDoc(docAdapter);
  };

  // Download chapter
  const handleDownloadChapter = async (ch: TextbookChapter) => {
    let resolvedData = ch.file_data;
    if (!resolvedData) {
      resolvedData = await documentStorage.getFile(ch.id);
    }

    if (resolvedData) {
      const a = window.document.createElement('a');
      a.href = resolvedData;
      a.download = ch.file_name || `${ch.title}.${ch.file_type === 'image' ? 'png' : ch.file_type || 'txt'}`;
      a.click();
    } else if (ch.content_text) {
      const blob = new Blob([ch.content_text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${ch.title}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      setAlertMsg({ type: 'error', text: 'Bab ini belum memiliki berkas untuk diunduh.' });
    }
  };

  // Filter chapters by semester and search keyword
  const filteredChapters = chapters.filter((ch) => {
    const matchSem = selectedSemester === 'Semua' || ch.semester === selectedSemester;
    const matchKeyword =
      !searchKeyword ||
      ch.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      ch.description.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchSem && matchKeyword;
  });

  // Render Format Icon
  const renderFormatBadge = (ch: TextbookChapter) => {
    const fType = ch.file_type?.toLowerCase();
    if (fType === 'docx' || fType === 'doc') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-400/20">
          <FileText className="w-3 h-3" /> Word (.docx)
        </span>
      );
    }
    if (fType === 'pdf') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-400/20">
          <File className="w-3 h-3" /> PDF
        </span>
      );
    }
    if (fType === 'xlsx' || fType === 'xls') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-400/20">
          <FileSpreadsheet className="w-3 h-3" /> Excel (.xlsx)
        </span>
      );
    }
    if (fType === 'image') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-400/20">
          <ImageIcon className="w-3 h-3" /> Gambar (.png)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-400/20">
        <Sparkles className="w-3 h-3" /> Teks Modul
      </span>
    );
  };

  // Grade metadata descriptions
  const gradeMeta: Record<number, { title: string; subtitle: string; color: string; badge: string }> = {
    7: {
      title: 'Buku Pelajaran PAI Kelas VII (Fase D - Awal)',
      subtitle: "Fokus materi: Al-Qur'an Pedoman Hidup, Asmaul Husna, Salat & Zikir, Sujud Sahwi/Syukur, Sejarah Peradaban Madinah, Alam Semesta, dan Sikap Amanah.",
      color: 'from-amber-500/20 to-orange-500/10',
      badge: 'Kelas 7 SMP',
    },
    8: {
      title: 'Buku Pelajaran PAI Kelas VIII (Fase D - Menengah)',
      subtitle: 'Fokus materi: Pelestarian Lingkungan & Tajwid Ra/Lam, 4 Kitab Suci Allah, Integritas Kejujuran, Salat Gerhana/Istisqa/Jenazah, Kejayaan Daulah Abbasiyah & Ilmuwan Muslim, Adab Media Sosial, dan Peradaban Andalusia.',
      color: 'from-blue-500/20 to-indigo-500/10',
      badge: 'Kelas 8 SMP',
    },
    9: {
      title: 'Buku Pelajaran PAI Kelas IX (Fase D - Lanjutan)',
      subtitle: 'Fokus materi: Moderasi Beragama & Mad Lazim, Hari Akhir & Eskatologi, Birrul Walidain Orang Tua & Guru, Zakat & Wakaf Produktif, Tradisi Akulturasi Islam Nusantara, Qada & Qadar, serta Ormas Islam di Indonesia.',
      color: 'from-emerald-500/20 to-teal-500/10',
      badge: 'Kelas 9 SMP',
    },
  };

  const currentGradeMeta = gradeMeta[activeGrade] || gradeMeta[7];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hidden file input for quick direct upload */}
      <input
        type="file"
        ref={quickUploadInputRef}
        onChange={handleQuickUploadFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*,.txt"
        className="hidden"
      />

      {/* Hidden file input for cover image upload */}
      <input
        type="file"
        ref={coverFileInputRef}
        onChange={handleCoverFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Grade Level Selector Tabs (Kelas 7, Kelas 8, Kelas 9) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              Pilih Jenjang Kelas:
            </span>
            {[7, 8, 9].map((g) => {
              const isActive = activeGrade === g;
              const count = (loadChaptersForGrade(g) || []).length;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleSwitchGrade(g)}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/25 ring-2 ring-amber-400/50 scale-102'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Kelas {g}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count} Bab
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAllChaptersToDefault}
              className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Kembalikan semua bab dan gambar kelas ini ke materi kurikulum standar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Materi Standar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-400/30 text-amber-600 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wide">
              Buku Pelajaran Siswa
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-400/30 text-blue-600 dark:text-blue-400 font-bold text-xs">
              {currentGradeMeta.badge}
            </span>
            <span className="text-xs text-slate-500 font-mono">Kurikulum Merdeka (PMM)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-500" />
            <span>{currentGradeMeta.title}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {currentGradeMeta.subtitle} Setiap bab dilengkapi gambar sampul materi yang <strong>bisa diubah atau diganti kapan saja</strong>, serta fitur unggah berkas (Word, PDF, Excel, Gambar) yang dapat dibaca langsung.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-400/25 transition-all hover:scale-102 cursor-pointer"
          >
            <Plus className="w-4 h-4 font-black" />
            <span>Input Bab Baru (Kelas {activeGrade})</span>
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
          <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-white cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Semester Filter Tabs & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Semester Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {['Semua', 'Ganjil', 'Genap'].map((sem) => (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedSemester === sem
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {sem === 'Semua' ? `Semua Bab (${chapters.length})` : `Semester ${sem}`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul bab / materi..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-xl pl-8 pr-3 py-1.5 outline-none focus:border-amber-400 placeholder-slate-400"
          />
        </div>
      </div>

      {/* ==============================================================
          CHAPTERS FEED / CARDS (AUTHENTIC HORIZONTAL CARD LAYOUT)
          - Left: Distinct cover image matching the grade and material
          - Quick "Ganti Sampul" action button overlay
          - Right: Title, Red 'PMM' tag, description, and action buttons
      ============================================================== */}
      {filteredChapters.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40">
          <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Belum Ada Bab Buku Pelajaran Kelas {activeGrade}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Klik tombol <strong>Input Bab Baru</strong> untuk menambahkan buku pelajaran atau klik <strong>Reset Materi Standar</strong> untuk memuat kurikulum bawaan.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 font-bold" /> Tambah Bab Baru
            </button>
            <button
              onClick={handleResetAllChaptersToDefault}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Muat Kurikulum Bawaan
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChapters.map((ch) => (
            <div
              key={ch.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row group"
            >
              {/* Left Cover Image (Authentic layout with quick "Ganti Sampul" action) */}
              <div className="md:w-72 md:h-56 w-full h-52 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-950 relative group/cover">
                <img
                  src={ch.cover_image || '/assets/aistudio/image_802beb1e.png'}
                  alt={ch.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/aistudio/image_802beb1e.png';
                  }}
                />

                {/* Bab badge over image */}
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-sm text-white font-black text-[11px] shadow">
                  BAB {ch.chapter_number} &bull; KELAS {ch.grade_level}
                </div>

                {/* Quick "Ganti Sampul" Overlay Button directly on image */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCoverModal(ch);
                  }}
                  className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/80 hover:bg-black text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm hover:scale-105 transition-all cursor-pointer opacity-90 group-hover/cover:opacity-100 ring-1 ring-white/20"
                  title="Ganti atau ubah gambar sampul bab ini"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ubah Gambar</span>
                </button>
              </div>

              {/* Right Content Details */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  {/* Top Category Tag (Red/Coral 'PMM' tag in user's image) */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[#e53e3e] font-extrabold text-xs uppercase tracking-wider">
                      {ch.tag || 'PMM'}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Semester {ch.semester}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                    {renderFormatBadge(ch)}
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-amber-500 dark:group-hover:text-amber-300 transition-colors mb-2">
                    {ch.title}
                  </h3>

                  {/* Description excerpt */}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {ch.description}
                  </p>

                  {/* Uploaded file attachment indicator */}
                  {ch.file_name && (
                    <div className="mt-3 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between font-mono">
                      <span className="truncate max-w-md">📎 Berkas Buku: {ch.file_name}</span>
                      {ch.file_size && (
                        <span className="text-slate-400 shrink-0 text-[11px]">
                          {(ch.file_size / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 1. Baca Buku / Buka Dokumen (in-app reader) */}
                    <button
                      type="button"
                      onClick={() => handleReadChapter(ch)}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm shadow-amber-400/20 transition-all hover:scale-102 cursor-pointer"
                      title="Buka dan baca isi buku bab ini langsung di aplikasi"
                    >
                      <BookOpen className="w-3.5 h-3.5 font-bold" />
                      <span>Baca Buku</span>
                    </button>

                    {/* 2. Upload / Ganti Berkas Buku */}
                    <button
                      type="button"
                      onClick={() => handleDirectChapterUpload(ch.id)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Upload berkas Word (.docx), PDF (.pdf), Excel (.xlsx), atau Gambar (.png)"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{ch.file_name ? 'Ganti Berkas' : 'Upload Buku (Word/PDF/Excel/PNG)'}</span>
                    </button>

                    {/* 3. Ubah Gambar Sampul Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenCoverModal(ch)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Ubah atau ganti gambar sampul bab ini"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                      <span>Ganti Gambar</span>
                    </button>

                    {/* 4. Unduh berkas */}
                    <button
                      type="button"
                      onClick={() => handleDownloadChapter(ch)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Unduh Berkas Buku"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(ch)}
                      className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Detail Bab"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ch.id, ch.title)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Hapus Bab"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==============================================================
          MODAL: UBAH / GANTI GAMBAR SAMPUL BAB (DEDICATED MODAL)
          - Upload from computer (.png, .jpg, .webp)
          - Gallery of curated educational/Islamic illustrations
          - Custom URL input
          - Reset to curriculum default cover
      ============================================================== */}
      {coverModalChapter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl my-auto text-slate-900 dark:text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-500" />
                  <span>Ubah Gambar Sampul Bab</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bab {coverModalChapter.chapter_number}: {coverModalChapter.title}
                </p>
              </div>
              <button
                onClick={() => setCoverModalChapter(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Preview Current / Selected Cover */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pratinjau Sampul Terpilih:
                </label>
                <div className="w-full h-44 rounded-xl overflow-hidden border-2 border-amber-400/50 bg-slate-950 relative shadow-inner">
                  <img
                    src={tempCoverImage || '/assets/aistudio/image_802beb1e.png'}
                    alt="Pratinjau Sampul"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/aistudio/image_802beb1e.png';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/80 text-white font-bold text-[11px]">
                    BAB {coverModalChapter.chapter_number} &bull; KELAS {coverModalChapter.grade_level}
                  </div>
                </div>
              </div>

              {/* Action 1: Upload from user device */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => coverFileInputRef.current?.click()}
                  className="p-4 rounded-xl border-2 border-dashed border-amber-400/60 hover:border-amber-400 bg-amber-500/5 dark:bg-amber-400/5 hover:bg-amber-500/10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
                >
                  <Upload className="w-6 h-6 text-amber-500" />
                  <p className="font-bold text-slate-900 dark:text-white text-xs">
                    Unggah Gambar dari Komputer
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Mendukung JPG, PNG, WEBP, GIF
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col justify-between gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Atau Masukkan URL Gambar Web:
                    </label>
                    <input
                      type="url"
                      placeholder="https://contoh.com/gambar.jpg"
                      value={customCoverUrl}
                      onChange={(e) => {
                        setCustomCoverUrl(e.target.value);
                        if (e.target.value.trim()) setTempCoverImage(e.target.value.trim());
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToCurriculumCover}
                    className="text-left text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Kembalikan ke Sampul Bawaan Kurikulum</span>
                  </button>
                </div>
              </div>

              {/* Action 2: Gallery of Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Atau Pilih dari Galeri Ilustrasi Edukasi &amp; Islami:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {PRESET_COVER_GALLERY.map((item) => {
                    const isSelected = tempCoverImage === item.url;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setTempCoverImage(item.url);
                          setCustomCoverUrl('');
                        }}
                        className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all p-1 text-center ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-400/10 scale-102'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 hover:scale-101'
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.label}
                          className="w-full h-16 object-cover rounded-lg"
                        />
                        <p className="text-[10px] font-bold truncate mt-1 text-slate-700 dark:text-slate-300">
                          {item.label}
                        </p>
                        <span className="text-[9px] text-slate-400 block truncate">
                          {item.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCoverModalChapter(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveCoverImage}
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-400/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 font-black" />
                  <span>Terapkan Gambar Sampul Ini</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: INPUT / EDIT CHAPTER & UPLOAD BUKU
      ============================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl my-auto text-slate-900 dark:text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span>
                  {editingChapterId
                    ? `Edit Bab Buku Pelajaran (Kelas ${activeGrade})`
                    : `Input Bab Baru (Kelas ${activeGrade}) & Upload Berkas`}
                </span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* File upload area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Upload Berkas Buku (Word, PDF, Excel, PNG/Gambar)</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    Bisa dibaca langsung di aplikasi
                  </span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files[0]) handleFileSelected(files[0]);
                    e.target.value = '';
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*,.txt"
                  className="hidden"
                />

                {fileName ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-500 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 font-bold" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate text-xs">{fileName}</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          Format: {fileType?.toUpperCase()} &bull; {fileSize ? (fileSize / 1024).toFixed(0) : 0} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFileData(null);
                        setFileName(null);
                        setFileType(null);
                        setFileSize(null);
                      }}
                      className="text-slate-400 hover:text-rose-500 text-xs px-2 py-1 rounded-lg cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-slate-50 dark:bg-slate-950/60 text-center cursor-pointer transition-all group"
                  >
                    <Upload className="w-7 h-7 text-slate-400 group-hover:text-amber-500 mx-auto mb-1.5 transition-colors" />
                    <p className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-amber-500 text-xs">
                      Klik untuk Pilih Berkas Buku
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Mendukung <strong>.docx (Word)</strong>, <strong>.pdf</strong>, <strong>.xlsx (Excel)</strong>, atau <strong>.png/.jpg (Gambar)</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Row 1: Nomor Bab & Judul */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. Bab
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-400 text-center font-mono"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Bab / Materi Pokok <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bab 1: Al-Qur'an dan Sunnah sebagai Pedoman Hidup"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Row 2: Semester & Tag */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tag / Label (seperti di gambar)
                  </label>
                  <input
                    type="text"
                    placeholder="PMM / Kurikulum Merdeka"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400 font-bold"
                  />
                </div>
              </div>

              {/* Row 3: Ringkasan / Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi / Ringkasan Materi Bab
                </label>
                <textarea
                  rows={3}
                  placeholder="Ringkasan isi bab yang akan ditampilkan pada kartu buku..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              {/* Row 4: Pilihan Cover Gambar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Pilih Gambar Sampul / Ilustrasi:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_COVER_GALLERY.slice(0, 8).map((cov, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCoverImage(cov.url)}
                      className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all p-1 ${
                        coverImage === cov.url
                          ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-400/10 scale-102'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={cov.url}
                        alt={cov.label}
                        className="w-full h-14 object-cover rounded-lg"
                      />
                      <p className="text-[9px] text-center font-medium truncate mt-1 text-slate-600 dark:text-slate-400">
                        {cov.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-400/20 cursor-pointer"
                >
                  {editingChapterId ? 'Simpan Perubahan' : 'Tambahkan ke Buku Siswa'}
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
