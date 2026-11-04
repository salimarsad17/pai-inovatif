import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Upload,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Search,
  Bell,
  Settings,
  X,
  Check,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Sparkles,
  Gamepad2,
  Video,
  BookOpen,
  GraduationCap,
  Layers,
  Eye,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  FolderOpen,
  Download,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { MediaAjarItem, MediaAjarCategory, TeachingDocument } from '../types';
import { DEFAULT_MEDIA_AJAR_ITEMS } from '../data/defaultMediaAjar';
import { documentStorage } from '../services/documentStorage';
import { DocumentReaderModal } from '../components/DocumentReaderModal';
import { useAuth } from '../contexts/AuthContext';

interface MediaAjarViewProps {
  initialGradeLevel?: number;
  onSelectMenu?: (menuId: string) => void;
}

export const MediaAjarView: React.FC<MediaAjarViewProps> = ({
  initialGradeLevel = 7,
  onSelectMenu,
}) => {
  const { profile } = useAuth();

  // Active Grade Level Filter (Semua, 7, 8, 9)
  const [selectedGrade, setSelectedGrade] = useState<number>(initialGradeLevel);

  // Items State with localStorage persistence
  const [mediaItems, setMediaItems] = useState<MediaAjarItem[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_MEDIA_AJAR_ITEMS;
    try {
      const stored = localStorage.getItem('pai_media_ajar_items_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_MEDIA_AJAR_ITEMS;
  });

  // Search keyword state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Alert message toast
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [showInputModal, setShowInputModal] = useState(false);
  const [modalCategory, setModalCategory] = useState<MediaAjarCategory>('video');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formGrade, setFormGrade] = useState<number>(7);
  const [formTag, setFormTag] = useState('');
  const [formFileName, setFormFileName] = useState<string | null>(null);
  const [formFileData, setFormFileData] = useState<string | null>(null);
  const [formFileType, setFormFileType] = useState<string | null>(null);
  const [formFileSize, setFormFileSize] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // In-app Video Player Modal
  const [playingVideo, setPlayingVideo] = useState<MediaAjarItem | null>(null);

  // In-app Game Player Modal
  const [playingGame, setPlayingGame] = useState<MediaAjarItem | null>(null);

  // In-app Document Reader Modal
  const [readingDoc, setReadingDoc] = useState<TeachingDocument | null>(null);

  // Save to state and localStorage (safely stripping heavy base64 file_data)
  const saveMediaItems = (items: MediaAjarItem[]) => {
    setMediaItems(items);
    if (typeof window !== 'undefined') {
      try {
        // Strip heavy base64 file_data from localStorage; binary data is stored safely in IndexedDB
        const lightItems = items.map((item) => {
          if (item.file_data) {
            const { file_data, ...rest } = item;
            return rest;
          }
          return item;
        });
        localStorage.setItem('pai_media_ajar_items_v1', JSON.stringify(lightItems));
      } catch (err) {
        console.warn('Could not persist media items to localStorage:', err);
      }
    }
  };

  // Clean up any oversized legacy items from localStorage on mount to immediately recover quota
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('pai_media_ajar_items_v1');
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
          localStorage.setItem('pai_media_ajar_items_v1', JSON.stringify(sanitized));
        }
      }
    } catch (e) {
      console.warn('Failed to sanitize media items localStorage:', e);
    }
  }, []);

  // Filter items by grade and search
  const filteredVideos = mediaItems.filter(
    (item) =>
      item.category === 'video' &&
      (selectedGrade === 0 || item.grade_level === selectedGrade) &&
      (!searchKeyword ||
        item.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  const filteredGames = mediaItems.filter(
    (item) =>
      item.category === 'game' &&
      (selectedGrade === 0 || item.grade_level === selectedGrade) &&
      (!searchKeyword ||
        item.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  const filteredModuls = mediaItems.filter(
    (item) =>
      item.category === 'lms_modul' &&
      (selectedGrade === 0 || item.grade_level === selectedGrade) &&
      (!searchKeyword ||
        item.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  // Top representative items to display on the 3 hero cards (or first item in category)
  const currentVideo = filteredVideos[0] || mediaItems.find((i) => i.category === 'video');
  const currentGame = filteredGames[0] || mediaItems.find((i) => i.category === 'game');
  const currentModul = filteredModuls[0] || mediaItems.find((i) => i.category === 'lms_modul');

  // Stats calculation
  const totalActiveMedia = mediaItems.length;
  const totalViews = mediaItems.reduce((acc, m) => acc + (m.views_count || 0), 0);
  const totalGamePlays = mediaItems
    .filter((m) => m.category === 'game')
    .reduce((acc, m) => acc + (m.play_count || 0), 0);

  // Helper detect file extension
  const detectFileType = (file: File): string => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
    if (name.endsWith('.docx') || name.endsWith('.doc')) return 'docx';
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) return 'xlsx';
    if (file.type.startsWith('image/') || name.match(/\.(png|jpe?g|webp|gif|svg)$/)) return 'image';
    return 'txt';
  };

  // Open modal to add new item
  const handleOpenAdd = (category: MediaAjarCategory = 'video') => {
    setEditingItemId(null);
    setModalCategory(category);
    setFormTitle('');
    setFormDescription('');
    setFormUrl('');
    setFormGrade(selectedGrade || 7);
    setFormTag(category === 'video' ? 'Video PAI' : category === 'game' ? 'Quiz / Gestures' : 'Modul Utama');
    setFormFileName(null);
    setFormFileData(null);
    setFormFileType(null);
    setFormFileSize(null);
    setShowInputModal(true);
  };

  // Open modal to edit existing item
  const handleOpenEdit = async (item: MediaAjarItem) => {
    setEditingItemId(item.id);
    setModalCategory(item.category);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormUrl(item.url || '');
    setFormGrade(item.grade_level);
    setFormTag(item.tag || '');
    setFormFileName(item.file_name || null);

    let fData = item.file_data || null;
    if (!fData && item.id) {
      fData = await documentStorage.getFile(item.id);
    }
    setFormFileData(fData);
    setFormFileType(item.file_type || null);
    setFormFileSize(item.file_size || null);
    setShowInputModal(true);
  };

  // Handle local file selection
  const handleFileSelected = (file: File) => {
    const fType = detectFileType(file);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormFileData(result);
      setFormFileName(file.name);
      setFormFileType(fType);
      setFormFileSize(file.size);

      if (!formTitle) {
        const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[_\-]/g, ' ');
        setFormTitle(clean);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper convert regular YouTube link to embed link
  const getEmbedUrl = (url: string): string => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
    }
    return url;
  };

  // Handle save (create or update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setAlertMsg({ type: 'error', text: 'Judul Media Ajar wajib diisi.' });
      return;
    }

    const itemId = editingItemId || `media-${modalCategory}-${Date.now()}`;

    if (formFileData) {
      await documentStorage.saveFile(itemId, formFileData);
    }

    const newItem: MediaAjarItem = {
      id: itemId,
      category: modalCategory,
      title: formTitle.trim(),
      description: formDescription.trim(),
      grade_level: Number(formGrade) || 7,
      url: formUrl.trim(),
      embed_url: modalCategory === 'video' ? getEmbedUrl(formUrl.trim()) : formUrl.trim(),
      tag: formTag.trim() || (modalCategory === 'game' ? 'Quiz / Gestures' : 'Media Ajar'),
      file_name: formFileName || undefined,
      file_data: formFileData || undefined,
      file_type: formFileType || undefined,
      file_size: formFileSize || undefined,
      views_count: editingItemId ? mediaItems.find((m) => m.id === editingItemId)?.views_count || 10 : 0,
      play_count: editingItemId ? mediaItems.find((m) => m.id === editingItemId)?.play_count || 5 : 0,
      created_at: editingItemId
        ? mediaItems.find((m) => m.id === editingItemId)?.created_at || new Date().toISOString()
        : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let updated: MediaAjarItem[];
    if (editingItemId) {
      updated = mediaItems.map((m) => (m.id === editingItemId ? newItem : m));
      setAlertMsg({ type: 'success', text: `Media Ajar "${formTitle}" berhasil diperbarui.` });
    } else {
      updated = [newItem, ...mediaItems];
      setAlertMsg({ type: 'success', text: `Media Ajar baru "${formTitle}" berhasil ditambahkan.` });
    }

    saveMediaItems(updated);
    setShowInputModal(false);
  };

  // Handle delete item
  const handleDeleteItem = (item: MediaAjarItem) => {
    if (!confirm(`Hapus "${item.title}" dari daftar Media Ajar?`)) return;
    const updated = mediaItems.filter((m) => m.id !== item.id);
    saveMediaItems(updated);
    documentStorage.deleteFile(item.id).catch(() => {});
    setAlertMsg({ type: 'success', text: `Media "${item.title}" berhasil dihapus.` });
  };

  // Play Video in Modal
  const handlePlayVideo = async (item: MediaAjarItem) => {
    // Increment view count
    const updated = mediaItems.map((m) =>
      m.id === item.id ? { ...m, views_count: (m.views_count || 0) + 1 } : m
    );
    saveMediaItems(updated);

    let activeVideo = item;
    if (!activeVideo.embed_url && !activeVideo.file_data && activeVideo.id) {
      const stored = await documentStorage.getFile(activeVideo.id);
      if (stored) {
        activeVideo = { ...activeVideo, file_data: stored };
      }
    }
    setPlayingVideo(activeVideo);
  };

  // Play Game in Modal
  const handlePlayGame = (item: MediaAjarItem) => {
    // Increment play count
    const updated = mediaItems.map((m) =>
      m.id === item.id ? { ...m, play_count: (m.play_count || 0) + 1 } : m
    );
    saveMediaItems(updated);
    setPlayingGame(item);
  };

  // Open Document in In-App Reader
  const handleOpenDocument = async (item: MediaAjarItem) => {
    let resolvedData = item.file_data;
    if (!resolvedData) {
      const fromStore = await documentStorage.getFile(item.id);
      if (fromStore) resolvedData = fromStore;
    }

    const docAdapter: TeachingDocument = {
      id: item.id,
      title: item.title,
      category: 'Modul Ajar',
      grade_level: item.grade_level,
      semester: 'Ganjil',
      academic_year: '2025/2026',
      file_data: resolvedData,
      file_name: item.file_name || `${item.title}.${item.file_type || 'docx'}`,
      file_type: item.file_type || 'docx',
      file_size: item.file_size,
      content_text: item.description || `# ${item.title}\n\nDokumen Modul Media Ajar PAI Fase D.`,
      description: item.description,
    };

    setReadingDoc(docAdapter);
  };

  // Reset to default data
  const handleResetDefaults = () => {
    if (confirm('Kembalikan data Media Ajar ke percontohan awal?')) {
      saveMediaItems(DEFAULT_MEDIA_AJAR_ITEMS);
      setAlertMsg({ type: 'success', text: 'Data Media Ajar berhasil dipulihkan.' });
    }
  };

  const teacherDisplayName = profile?.full_name || 'Sadiqul Alim, S.Pd.I., M.Pd., Gr.';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Toast Alert */}
      {alertMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between shadow-lg ${
            alertMsg.type === 'success'
              ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-200'
              : 'bg-rose-950/70 border border-rose-800 text-rose-200'
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

      {/* ====================================================================
          TOP HEADER BAR (MATCHING SCREENSHOT)
          - Left: Stylized Gradient Title "Media Ajar"
          - Center/Right: "+ Input / Upload Media", Search icon, Bell with red dot, Settings gear, Profile Pill
      ==================================================================== */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title "Media Ajar" with colorful playful gradient */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight italic bg-gradient-to-r from-[#0d9488] via-[#0284c7] to-[#f59e0b] bg-clip-text text-transparent drop-shadow-xs">
            Media Ajar
          </h1>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            Interaktif PAI
          </span>
        </div>

        {/* Action Controls & Profile Pill */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Primary Action Button: "+ Input / Upload Media" */}
          <button
            type="button"
            onClick={() => handleOpenAdd('video')}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#0d9488] to-[#0ea5e9] hover:from-[#0f766e] hover:to-[#0284c7] text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/25 transition-all hover:scale-102 cursor-pointer"
          >
            <Plus className="w-4 h-4 font-black" />
            <span>+ Input / Upload Media</span>
          </button>

          {/* Search Trigger / Input */}
          <div className="relative">
            {showSearchInput ? (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-1.5 border border-slate-300 dark:border-slate-700">
                <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Cari media ajar..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-36 sm:w-48 bg-transparent text-xs text-slate-800 dark:text-white outline-none"
                />
                <button
                  onClick={() => {
                    setShowSearchInput(false);
                    setSearchKeyword('');
                  }}
                  className="text-slate-400 hover:text-slate-600 ml-1 text-xs"
                >
                  &times;
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSearchInput(true)}
                className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Cari Media"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Bell Icon with Red Dot */}
          <div className="relative">
            <button
              type="button"
              className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Notifikasi Media"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            </button>
          </div>

          {/* Settings Gear */}
          <button
            type="button"
            onClick={handleResetDefaults}
            className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Reset Percontohan Media Ajar"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Profile Pill Card (Exact as in Screenshot) */}
          <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {teacherDisplayName.charAt(0)}
            </div>
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-[200px]">
              {teacherDisplayName}
            </span>
          </div>
        </div>
      </div>

      {/* Grade Level Selector Tabs (Kelas 7, Kelas 8, Kelas 9) */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            Jenjang:
          </span>
          {[0, 7, 8, 9].map((g) => {
            const isSelected = selectedGrade === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGrade(g)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80'
                }`}
              >
                {g === 0 ? 'Semua Jenjang' : `Kelas ${g}`}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Total {mediaItems.length} Sumber Belajar
        </span>
      </div>

      {/* ====================================================================
          3 MAIN CARDS ROW (PIXEL-PERFECT REPRODUCTION OF USER SCREENSHOT)
          Card 1: Video Pembelajaran (Cyan-Blue wave + Monitor Icon + Upload Video + Edit + Delete)
          Card 2: Game Edukasi (Emerald-Gold wave + Gamepad + Quiz/Gestures + Input Game Link + Play + Delete)
          Card 3: LMS & Modul (Gold-Blue wave + Book/Toga + Doc badge + Mock Module Files + Upload + Delete)
      ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {/* ======================= CARD 1: VIDEO PEMBELAJARAN ======================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            {/* Top Wave Graphic Banner with 3D Video Screen Icon */}
            <div className="w-full h-36 rounded-2xl bg-gradient-to-br from-[#06b6d4] via-[#0284c7] to-[#2563eb] relative overflow-hidden flex items-center justify-center p-4 shadow-inner mb-4">
              {/* Decorative wave circles */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xs" />
              <div className="absolute -left-6 -top-6 w-28 h-28 rounded-full bg-cyan-300/20 blur-xs" />

              {/* 3D Monitor / Screen with Play button */}
              <div className="w-20 h-16 rounded-xl bg-gradient-to-b from-cyan-200 to-sky-400 p-1.5 shadow-2xl shadow-sky-950/40 relative flex flex-col items-center justify-between border-2 border-white/50 group-hover:scale-108 transition-transform">
                <div className="flex-1 w-full rounded-lg bg-sky-950/80 flex items-center justify-center relative overflow-hidden">
                  <Play className="w-6 h-6 text-cyan-300 fill-cyan-300 ml-0.5 filter drop-shadow" />
                </div>
                {/* Progress bar line */}
                <div className="w-12 h-1 bg-white/70 rounded-full mt-1" />
              </div>
            </div>

            {/* Title & Badge Row (Miniature Video Monitor Preview on top right) */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                Video
                <br />
                Pembelajaran
              </h3>

              {/* Miniature video badge as seen in screenshot */}
              <div
                onClick={() => currentVideo && handlePlayVideo(currentVideo)}
                className="w-18 h-12 rounded-xl bg-slate-950 border border-sky-400/50 relative overflow-hidden shadow-sm shrink-0 cursor-pointer group/vid"
                title="Klik untuk putar pratinjau video"
              >
                <img
                  src={
                    currentVideo?.thumbnail_url ||
                    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop'
                  }
                  alt="Thumb"
                  className="w-full h-full object-cover opacity-75 group-hover/vid:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow">
                    <Play className="w-2.5 h-2.5 fill-slate-950 ml-0.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Current Selected Video Title & Details */}
            {currentVideo ? (
              <div className="mb-4 bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 rounded-xl p-2.5">
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1">
                  {currentVideo.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-cyan-600 dark:text-cyan-400">
                    Kelas {currentVideo.grade_level}
                  </span>
                  <span>&bull;</span>
                  <span>{currentVideo.views_count || 540} Tayangan</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mb-4">Belum ada video di jenjang ini.</p>
            )}
          </div>

          {/* Action Buttons (Upload Video + Edit + Delete) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Primary Button: Upload Video */}
            <button
              type="button"
              onClick={() => handleOpenAdd('video')}
              className="w-full py-2.5 rounded-xl bg-[#06b6d4] hover:bg-[#0891b2] text-white font-extrabold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-101 cursor-pointer flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 font-bold" />
              <span>Upload Video</span>
            </button>

            {/* Secondary Buttons Row: Edit & Hapus/Delete */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => currentVideo && handleOpenEdit(currentVideo)}
                className="py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-cyan-500" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => currentVideo && handleDeleteItem(currentVideo)}
                className="py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-900/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Hapus / Delete</span>
              </button>
            </div>

            {/* Quick Watch in-app */}
            {currentVideo && (
              <button
                type="button"
                onClick={() => handlePlayVideo(currentVideo)}
                className="w-full py-1.5 text-center text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Buka &amp; Putar Video di Aplikasi</span>
              </button>
            )}
          </div>
        </div>

        {/* ======================= CARD 2: GAME EDUKASI ======================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            {/* Top Wave Graphic Banner with 3D Game Controller Icon */}
            <div className="w-full h-36 rounded-2xl bg-gradient-to-br from-[#10b981] via-[#059669] to-[#d97706] relative overflow-hidden flex items-center justify-center p-4 shadow-inner mb-4">
              {/* Decorative wave circles */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xs" />
              <div className="absolute -left-6 -top-6 w-28 h-28 rounded-full bg-emerald-300/20 blur-xs" />

              {/* 3D Gamepad Controller Icon */}
              <div className="w-20 h-14 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 p-2 shadow-2xl shadow-emerald-950/50 relative flex items-center justify-between border-2 border-emerald-400/40 group-hover:scale-108 transition-transform">
                {/* D-Pad on left */}
                <div className="w-4 h-4 rounded-xs bg-slate-600 relative flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                </div>
                {/* Center LED */}
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {/* Buttons on right */}
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>

            {/* Title & Badge Row (Quiz / Gestures Pill Badge on top right) */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                Game
                <br />
                Edukasi
              </h3>

              {/* "Quiz / Gestures" Colorful pill badge (exact as in screenshot) */}
              <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-teal-500/20 via-emerald-500/20 to-amber-500/20 border border-teal-400/40 text-teal-700 dark:text-teal-300 font-extrabold text-[11px] flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span>Quiz / Gestures</span>
              </div>
            </div>

            {/* Current Selected Game Title & Details */}
            {currentGame ? (
              <div className="mb-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-2.5">
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1">
                  {currentGame.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Kelas {currentGame.grade_level}
                  </span>
                  <span>&bull;</span>
                  <span>{currentGame.play_count || 185} Kali Dimainkan</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mb-4">Belum ada game edukasi di jenjang ini.</p>
            )}
          </div>

          {/* Action Buttons (Input Game Link + Play + Delete) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Primary Button: Input Game Link */}
            <button
              type="button"
              onClick={() => handleOpenAdd('game')}
              className="w-full py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-101 cursor-pointer flex items-center justify-center gap-2"
            >
              <Gamepad2 className="w-4 h-4 font-bold" />
              <span>Input Game Link</span>
            </button>

            {/* Secondary Buttons Row: Play & Delete */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => currentGame && handlePlayGame(currentGame)}
                className="py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </button>

              <button
                type="button"
                onClick={() => currentGame && handleDeleteItem(currentGame)}
                className="py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-900/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete</span>
              </button>
            </div>

            {/* Direct Open Link */}
            {currentGame?.url && (
              <a
                href={currentGame.url}
                target="_blank"
                rel="noreferrer"
                className="w-full py-1.5 text-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Buka di Tab Baru ({currentGame.tag || 'Wordwall/Quizizz'})</span>
              </a>
            )}
          </div>
        </div>

        {/* ======================= CARD 3: LMS & MODUL ======================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            {/* Top Wave Graphic Banner with 3D Book & Graduation Cap Icon */}
            <div className="w-full h-36 rounded-2xl bg-gradient-to-br from-[#f59e0b] via-[#ea580c] to-[#3b82f6] relative overflow-hidden flex items-center justify-center p-4 shadow-inner mb-4">
              {/* Decorative wave circles */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xs" />
              <div className="absolute -left-6 -top-6 w-28 h-28 rounded-full bg-amber-300/20 blur-xs" />

              {/* 3D Open Book with Graduation Cap (Toga) */}
              <div className="relative group-hover:scale-108 transition-transform">
                {/* Toga Cap */}
                <div className="w-10 h-3 bg-slate-900 rounded-xs mx-auto -mb-1 shadow rotate-[-6deg] flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-slate-800 rotate-45" />
                </div>
                {/* Open Book */}
                <div className="w-20 h-13 rounded-lg bg-white dark:bg-slate-100 p-2 shadow-2xl shadow-amber-950/40 border border-amber-300 flex items-center justify-between text-slate-800">
                  <BookOpen className="w-8 h-8 text-amber-500 mx-auto" />
                </div>
              </div>
            </div>

            {/* Title & Document Badge Row (Yellow/Purple document icons) */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                LMS &amp;
                <br />
                Modul
              </h3>

              {/* Format badges: Google Doc & Word/PDF colored icons */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="w-5 h-5 rounded-md bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                  <FileText className="w-3 h-3" />
                </span>
                <span className="w-5 h-5 rounded-md bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Item Preview Card: "Mock Module Files - 220 MB" (Exact as in Screenshot) */}
            <div
              onClick={() => currentModul && handleOpenDocument(currentModul)}
              className="mb-4 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 flex items-center justify-between gap-2 cursor-pointer hover:border-indigo-400 transition-colors shadow-2xs group/mod"
              title="Klik untuk buka dan baca berkas dokumen modul"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover/mod:text-indigo-600">
                    {currentModul?.title || 'Mock Module Files'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {currentModul?.file_size ? `${(currentModul.file_size / (1024 * 1024)).toFixed(0)} MB` : '220 MB'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons (Upload File / Materi + Delete) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Primary Button: Upload File / Materi */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAdd('lms_modul')}
                className="flex-1 py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all hover:scale-101 cursor-pointer flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 font-bold" />
                <span>Upload File / Materi</span>
              </button>

              <button
                type="button"
                onClick={() => currentModul && handleDeleteItem(currentModul)}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Hapus Modul"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
              </button>
            </div>

            {/* Read Document in App */}
            {currentModul && (
              <button
                type="button"
                onClick={() => handleOpenDocument(currentModul)}
                className="w-full py-1.5 text-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3 h-3" />
                <span>Buka &amp; Baca Dokumen Modul di Aplikasi</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          BOTTOM SECTION: QUICK STATS (EXACT REPRODUCTION OF USER SCREENSHOT)
          - Header: "Quick Stats" with "..." action
          - Stat 1: Active Media (cyan/teal icon & progress bar)
          - Stat 2: Total Views (blue eye icon & progress bar)
          - Stat 3: Game Plays (amber gamepad icon & progress bar)
      ==================================================================== */}
      <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
            Quick Stats
          </h4>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* 1. Active Media */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 text-white flex items-center justify-center shadow-xs">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  Active Media
                </span>
              </div>
              <span className="font-mono text-slate-500 text-xs font-bold">
                {totalActiveMedia} Media
              </span>
            </div>
            {/* Progress Bar (Cyan/Teal) */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full"
                style={{ width: `${Math.min(100, totalActiveMedia * 8)}%` }}
              />
            </div>
          </div>

          {/* 2. Total Views */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center shadow-xs">
                  <Eye className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  Total Views
                </span>
              </div>
              <span className="font-mono text-slate-500 text-xs font-bold">
                {totalViews} Tayangan
              </span>
            </div>
            {/* Progress Bar (Blue/Indigo) */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                style={{ width: `${Math.min(100, (totalViews / 2000) * 100)}%` }}
              />
            </div>
          </div>

          {/* 3. Game Plays */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-xs">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  Game Plays
                </span>
              </div>
              <span className="font-mono text-slate-500 text-xs font-bold">
                {totalGamePlays} Sesi
              </span>
            </div>
            {/* Progress Bar (Amber/Orange) */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full"
                style={{ width: `${Math.min(100, (totalGamePlays / 500) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODAL 1: INPUT / UPLOAD MEDIA AJAR
      ==================================================================== */}
      {showInputModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-xl rounded-3xl p-6 shadow-2xl my-auto text-slate-900 dark:text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-500" />
                  <span>{editingItemId ? 'Edit Media Ajar' : 'Input / Upload Media Ajar'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tambahkan video pembelajaran, game edukasi interaktif, atau modul materi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInputModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setModalCategory('video')}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalCategory === 'video'
                    ? 'bg-[#06b6d4] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video</span>
              </button>

              <button
                type="button"
                onClick={() => setModalCategory('game')}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalCategory === 'game'
                    ? 'bg-[#10b981] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Game Edukasi</span>
              </button>

              <button
                type="button"
                onClick={() => setModalCategory('lms_modul')}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalCategory === 'lms_modul'
                    ? 'bg-[#4f46e5] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>LMS &amp; Modul</span>
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              {/* Row 1: Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Media Ajar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    modalCategory === 'video'
                      ? 'Contoh: Video Pembelajaran: Kaidah Tajwid Alif Lam'
                      : modalCategory === 'game'
                      ? 'Contoh: Game Labirin Tajwid & Asmaul Husna (Wordwall)'
                      : 'Contoh: Mock Module Files - Modul Ajar PAI Fase D'
                  }
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500"
                />
              </div>

              {/* Row 2: Grade Level & Tag */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenjang Kelas
                  </label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value={7}>Kelas 7 SMP</option>
                    <option value={8}>Kelas 8 SMP</option>
                    <option value={9}>Kelas 9 SMP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Label / Tag Badge
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Quiz / Gestures, PAI Interaktif"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Row 3: Link URL (for Video & Game) */}
              {(modalCategory === 'video' || modalCategory === 'game') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {modalCategory === 'video' ? 'Link Video (YouTube / MP4 URL)' : 'Link Game Interaktif (Wordwall / Quizizz / Web)'}
                  </label>
                  <input
                    type="url"
                    placeholder={
                      modalCategory === 'video'
                        ? 'https://www.youtube.com/watch?v=...'
                        : 'https://wordwall.net/resource/... atau https://quizizz.com/...'
                    }
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              )}

              {/* Row 4: File Upload (for LMS & Modul or local video) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Unggah Berkas Materi / Modul (Word, PDF, Excel, Video)</span>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400">Bisa dibaca langsung</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelected(f);
                    e.target.value = '';
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*,.mp4,.txt"
                  className="hidden"
                />

                {formFileName ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-500 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 font-bold" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate text-xs">{formFileName}</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          Format: {formFileType?.toUpperCase()} &bull;{' '}
                          {formFileSize ? (formFileSize / (1024 * 1024)).toFixed(1) : 0} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormFileName(null);
                        setFormFileData(null);
                        setFormFileType(null);
                        setFormFileSize(null);
                      }}
                      className="text-slate-400 hover:text-rose-500 text-xs px-2 py-1 cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 bg-slate-50 dark:bg-slate-950/60 text-center cursor-pointer transition-all group"
                  >
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-teal-500 mx-auto mb-1 transition-colors" />
                    <p className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-teal-500 text-xs">
                      Klik untuk Pilih Berkas
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Mendukung Word (.docx), PDF (.pdf), Excel (.xlsx), atau video MP4
                    </p>
                  </div>
                )}
              </div>

              {/* Row 5: Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi / Petunjuk Belajar
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan materi ajar atau cara memainkan game..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInputModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#0d9488] to-[#0ea5e9] text-white font-black cursor-pointer shadow-md shadow-teal-500/20"
                >
                  {editingItemId ? 'Simpan Perubahan' : 'Tambahkan Media Ajar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: IN-APP VIDEO PLAYER MODAL
      ==================================================================== */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl text-white">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white truncate max-w-lg">
                    {playingVideo.title}
                  </h3>
                  <span className="text-[11px] text-cyan-400">
                    Kelas {playingVideo.grade_level} &bull; {playingVideo.tag}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlayingVideo(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Embed / HTML5 */}
            <div className="aspect-video w-full bg-black relative">
              {playingVideo.embed_url ? (
                <iframe
                  src={playingVideo.embed_url}
                  title={playingVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : playingVideo.file_data ? (
                <video src={playingVideo.file_data} controls className="w-full h-full object-contain" autoPlay />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-400">
                  <Video className="w-12 h-12 mb-2 text-cyan-400 opacity-60" />
                  <p className="text-sm font-bold text-white mb-2">{playingVideo.title}</p>
                  <p className="text-xs max-w-md">{playingVideo.description}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
              <span>{playingVideo.description}</span>
              <button
                type="button"
                onClick={() => setPlayingVideo(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: IN-APP GAME PLAYER MODAL (WORDWALL / QUIZIZZ / EMBED)
      ==================================================================== */}
      {playingGame && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col justify-between">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white truncate max-w-lg">
                    {playingGame.title}
                  </h3>
                  <span className="text-[11px] text-emerald-400">
                    Kelas {playingGame.grade_level} &bull; {playingGame.tag || 'Game Edukasi PAI'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {playingGame.url && (
                  <a
                    href={playingGame.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Layar Penuh</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPlayingGame(null)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Game Iframe */}
            <div className="flex-1 w-full bg-slate-900 relative">
              {playingGame.embed_url ? (
                <iframe
                  src={playingGame.embed_url}
                  title={playingGame.title}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-300">
                  <Gamepad2 className="w-16 h-16 text-emerald-400 mb-3 animate-bounce" />
                  <h4 className="text-base font-bold text-white mb-2">{playingGame.title}</h4>
                  <p className="text-xs text-slate-400 max-w-md mb-4">{playingGame.description}</p>
                  {playingGame.url && (
                    <a
                      href={playingGame.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs inline-flex items-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Mulai Permainan di Tab Baru</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span>Gunakan game ini sebagai apersepsi atau asesmen diagnostik interaktif.</span>
              <button
                type="button"
                onClick={() => setPlayingGame(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-bold cursor-pointer"
              >
                Tutup Permainan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 4: IN-APP DOCUMENT READER MODAL (WORD, PDF, EXCEL, PNG)
      ==================================================================== */}
      {readingDoc && (
        <DocumentReaderModal
          document={readingDoc}
          onClose={() => setReadingDoc(null)}
        />
      )}
    </div>
  );
};
