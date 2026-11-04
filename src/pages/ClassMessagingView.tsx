import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Bell,
  Settings,
  Send,
  Paperclip,
  Smile,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Folder,
  Users,
  Check,
  Plus,
  X,
  FileText,
  UserCheck,
  GraduationCap,
  Sparkles,
  RefreshCw,
  User,
  Shield,
  BookOpen,
} from 'lucide-react';
import { ClassQnAMessage, ClassQnAReply } from '../types';
import {
  DEFAULT_CLASS_QNA_MESSAGES,
  DEFAULT_STUDENT_CONTACTS,
  StudentContact,
} from '../data/defaultClassMessages';
import { useAuth } from '../contexts/AuthContext';

interface ClassMessagingViewProps {
  isStudentView?: boolean;
  onSelectMenu?: (menuId: string) => void;
}

export const ClassMessagingView: React.FC<ClassMessagingViewProps> = ({
  isStudentView = false,
  onSelectMenu,
}) => {
  const { profile, schoolSettings } = useAuth();

  // Active Grade Level (7, 8, or 9)
  const [selectedGrade, setSelectedGrade] = useState<number>(7);

  // Role simulation toggle (Guru vs Siswa) for realistic testing
  const [activeRole, setActiveRole] = useState<'guru' | 'siswa'>(isStudentView ? 'siswa' : 'guru');

  // Search filter for students
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string | null>(null);

  // Messages list state with localStorage persistence
  const [messages, setMessages] = useState<ClassQnAMessage[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_CLASS_QNA_MESSAGES;
    try {
      const stored = localStorage.getItem('pai_class_qna_messages_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_CLASS_QNA_MESSAGES;
  });

  // Student contacts state
  const [students] = useState<StudentContact[]>(DEFAULT_STUDENT_CONTACTS);

  // Bottom Composer State
  const [newMessageText, setNewMessageText] = useState('');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline reply input states per message (mapping messageId => reply text)
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // Notification alert toast
  const [alertToast, setAlertToast] = useState<string | null>(null);

  // Save messages to localStorage
  const saveMessages = (newMsgs: ClassQnAMessage[]) => {
    setMessages(newMsgs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pai_class_qna_messages_v1', JSON.stringify(newMsgs));
    }
  };

  // Filter messages by active grade and optional student filter
  const gradeMessages = messages.filter((m) => {
    const matchGrade = m.grade_level === selectedGrade;
    const matchStudent = selectedStudentFilter
      ? m.sender_name.toLowerCase().includes(selectedStudentFilter.toLowerCase())
      : true;
    return matchGrade && matchStudent;
  });

  // Filter student contacts by grade and search text
  const filteredStudents = students.filter((s) => {
    const matchGrade = s.grade_level === selectedGrade;
    const matchSearch =
      !studentSearch ||
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.short_name.toLowerCase().includes(studentSearch.toLowerCase());
    return matchGrade && matchSearch;
  });

  // Helper get initials for text badge
  const getInitials = (name: string): string => {
    if (!name) return 'S';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Handle send new Question / Message from bottom composer
  const handleSendMessage = () => {
    if (!newMessageText.trim() && !attachedFileName) return;

    const currentTeacherName = profile?.full_name || 'Salim Arsad, S.Pd.I.';
    const currentStudentName = 'Alaiqul Miftahudin';

    const senderName = activeRole === 'guru' ? currentTeacherName : currentStudentName;
    const senderRole = activeRole;

    const nextQuestionNumber =
      gradeMessages.length > 0 ? Math.max(...gradeMessages.map((m) => m.question_number || 1)) + 1 : 1;

    const newMsg: ClassQnAMessage = {
      id: `msg-k${selectedGrade}-${Date.now()}`,
      grade_level: selectedGrade,
      question_number: nextQuestionNumber,
      title: `Question ${nextQuestionNumber}`,
      sender_id: activeRole === 'guru' ? 'teacher-current' : 'student-current',
      sender_name: senderName,
      sender_role: senderRole,
      content: newMessageText.trim(),
      status: activeRole === 'guru' ? 'ANSWERED' : 'PENDING',
      created_at: 'Baru saja',
      attachment_name: attachedFileName || undefined,
      replies: [],
    };

    saveMessages([newMsg, ...messages]);
    setNewMessageText('');
    setAttachedFileName(null);
    setShowEmojiPicker(false);
    setAlertToast(
      activeRole === 'guru'
        ? 'Pesan / Pengumuman kelas berhasil dikirimkan.'
        : 'Pertanyaan baru berhasil dikirim ke guru!'
    );
  };

  // Handle send inline reply to a specific question
  const handleSendReply = (messageId: string) => {
    const text = replyInputs[messageId];
    if (!text || !text.trim()) return;

    const currentTeacherName = profile?.full_name || 'Salim Arsad, S.Pd.I.';
    const currentStudentName = 'Saniai Anindita';

    const senderName = activeRole === 'guru' ? currentTeacherName : currentStudentName;

    const newReply: ClassQnAReply = {
      id: `rep-${Date.now()}`,
      message_id: messageId,
      sender_id: activeRole === 'guru' ? 'teacher-current' : 'student-current',
      sender_name: senderName,
      sender_role: activeRole,
      content: text.trim(),
      created_at: 'Baru saja',
    };

    const updated = messages.map((m) => {
      if (m.id === messageId) {
        return {
          ...m,
          status: activeRole === 'guru' ? ('ANSWERED' as const) : m.status,
          replies: [...(m.replies || []), newReply],
        };
      }
      return m;
    });

    saveMessages(updated);
    setReplyInputs((prev) => ({ ...prev, [messageId]: '' }));
    setAlertToast('Balasan Anda telah terkirim!');
  };

  // Toggle status between ANSWERED and PENDING
  const handleToggleStatus = (messageId: string) => {
    const updated = messages.map((m) => {
      if (m.id === messageId) {
        return {
          ...m,
          status: m.status === 'ANSWERED' ? ('PENDING' as const) : ('ANSWERED' as const),
        };
      }
      return m;
    });
    saveMessages(updated);
  };

  // Reset to default data
  const handleResetDefaults = () => {
    if (confirm('Kembalikan pesan dan tanya jawab kelas ke data percontohan bawaan?')) {
      saveMessages(DEFAULT_CLASS_QNA_MESSAGES);
      setAlertToast('Data percontohan pesan berhasil dipulihkan.');
    }
  };

  // Quick Emoji choices
  const EMOJIS = ['👍', '📚', '🤲', '💡', '⭐', '✨', '👏', '✅', '🙏', '📖'];

  return (
    <div className="min-h-[85vh] bg-[#f0fdf4] dark:bg-[#0b1319] p-2 sm:p-4 md:p-6 rounded-3xl transition-colors font-sans flex flex-col justify-between">
      {/* Toast Notification */}
      {alertToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{alertToast}</span>
          <button onClick={() => setAlertToast(null)} className="ml-2 text-emerald-200 hover:text-white cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Main 2-Pane Tablet & Desktop Layout (Clean without the right-side widgets) */}
      <div className="bg-[#f7fbf8] dark:bg-[#111c24] border border-[#d2e9dc] dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row flex-1">
        {/* ====================================================================
            PANE 1: LEFT SIDEBAR (School, Profile, My Classes, Subjects, Students)
        ==================================================================== */}
        <div className="w-full lg:w-72 bg-white/80 dark:bg-[#132029]/80 border-r border-[#e0f0e7] dark:border-slate-800/80 p-5 flex flex-col justify-between shrink-0">
          <div className="space-y-5">
            {/* School Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-[#e5f3eb] dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 font-black">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight truncate">
                  {schoolSettings?.school_name || 'UPT SMPN 2'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Rebang Tangkas
                </p>
              </div>
            </div>

            {/* User Profile Card (Initials Badge without photo image) */}
            <div className="bg-[#f2f9f5] dark:bg-[#182833] border border-[#d6ede0] dark:border-slate-700/60 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-xs group hover:border-emerald-400 transition-all cursor-pointer">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm ring-2 ring-emerald-400/40">
                  {activeRole === 'guru' ? 'SA' : 'AM'}
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-xs text-slate-900 dark:text-white truncate">
                    {activeRole === 'guru' ? profile?.full_name || 'Sadiqul Alim' : 'Alaiqul Miftahudin'}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {activeRole === 'guru' ? 'S.Pd.I., M.Pd., Gr.' : 'Siswa Kelas 7 - PAI'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
            </div>

            {/* Role Simulation Switcher Badge */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                Mode Uji:
              </span>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveRole('guru')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    activeRole === 'guru'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Guru
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRole('siswa')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    activeRole === 'siswa'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Siswa
                </button>
              </div>
            </div>

            {/* Section: My Classes */}
            <div>
              <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                My Classes
              </div>
              <div className="space-y-1">
                {[7, 8, 9].map((grade) => {
                  const isSelected = selectedGrade === grade;
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => {
                        setSelectedGrade(grade);
                        setSelectedStudentFilter(null);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
                        isSelected
                          ? 'bg-white dark:bg-[#1a2b36] text-slate-950 dark:text-white shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>Kelas {grade}</span>
                      </div>
                      {isSelected && (
                        <div className="w-1.5 h-5 rounded-full bg-[#10b981] absolute right-0 shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section: Subjects */}
            <div>
              <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Subjects
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Folder className="w-4 h-4 text-amber-500" />
                <span className="truncate">Pendidikan Agama Islam</span>
              </div>
            </div>

            {/* Section: Students with search & clean typography initials badge */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Students ({filteredStudents.length})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedStudentFilter(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  title="Lihat Semua Siswa"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Student Search Input */}
              <div className="relative mb-2.5">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full bg-[#f4faf6] dark:bg-slate-900 border border-[#d8ece0] dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none focus:border-emerald-500 placeholder-slate-400 font-medium"
                />
              </div>

              {/* Student List with clean initials (No photos) */}
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {filteredStudents.map((st) => {
                  const isFiltered = selectedStudentFilter === st.short_name;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() =>
                        setSelectedStudentFilter(isFiltered ? null : st.short_name)
                      }
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                        isFiltered
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 font-bold text-emerald-900 dark:text-emerald-200'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-[10px] shrink-0">
                          {getInitials(st.name)}
                        </div>
                        <span className="truncate text-[11px] font-semibold">{st.short_name}</span>
                      </div>
                      {/* Active Status Dot */}
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          st.status === 'online'
                            ? 'bg-[#10b981] ring-2 ring-emerald-300/40'
                            : 'bg-[#f59e0b]'
                        }`}
                        title={st.status === 'online' ? 'Online' : 'Away'}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom helper */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>UPT SMPN 2 Rebang Tangkas</span>
            <button
              onClick={handleResetDefaults}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              title="Reset contoh pesan"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* ====================================================================
            PANE 2: CENTER Q&A & MESSAGING FEED (Full Width, Questions, Answers, Composer)
        ==================================================================== */}
        <div className="flex-1 flex flex-col justify-between bg-white dark:bg-[#0f171e] min-w-0">
          {/* Top Header Bar */}
          <div className="p-4 sm:p-5 border-b border-[#e5f3eb] dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onSelectMenu?.('beranda')}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Kembali ke Beranda"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Class Q&amp;A &amp; Messaging</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold font-mono">
                    Kelas {selectedGrade}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Ruang interaksi, konsultasi materi, dan tanya jawab santri secara langsung.
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                {gradeMessages.length} Percakapan
              </span>
            </div>
          </div>

          {/* Active Filter Pill if Student Selected */}
          {selectedStudentFilter && (
            <div className="px-5 py-2 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <span>
                Menampilkan pertanyaan dari: <strong>{selectedStudentFilter}</strong>
              </span>
              <button
                onClick={() => setSelectedStudentFilter(null)}
                className="font-bold underline text-[11px] cursor-pointer"
              >
                Tampilkan Semua
              </button>
            </div>
          )}

          {/* Scrollable Questions Feed (Typography initials badges instead of photos) */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 max-h-[calc(100vh-280px)]">
            {gradeMessages.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-500" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Belum ada percakapan di Kelas {selectedGrade}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  Gunakan kolom pesan di bawah untuk mengajukan pertanyaan materi atau menyapa siswa.
                </p>
              </div>
            ) : (
              gradeMessages.map((msg) => {
                const isAnswered = msg.status === 'ANSWERED';
                return (
                  <div
                    key={msg.id}
                    className={`rounded-2xl p-4 sm:p-5 transition-all border ${
                      isAnswered
                        ? 'bg-[#f4fbf7] dark:bg-[#12222a] border-[#bbf0d2] dark:border-emerald-900/50'
                        : 'bg-[#fffdf5] dark:bg-[#1e1e19] border-[#fde68a] dark:border-amber-900/50'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Student Initials Avatar Badge (No photo) */}
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-black text-xs flex items-center justify-center shrink-0 ring-2 ring-slate-200 dark:ring-slate-700 shadow-xs">
                        {getInitials(msg.sender_name)}
                      </div>

                      {/* Question Details */}
                      <div className="flex-1 min-w-0">
                        {/* Title & Status Badge Row */}
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-sm text-slate-900 dark:text-white">
                              {msg.title || `Question ${msg.question_number}`}
                            </h3>
                            <span className="text-[11px] text-slate-400 font-medium">
                              &bull; {msg.sender_name}
                            </span>
                          </div>

                          {/* Pill Badge (Green ANSWERED / Yellow PENDING) */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(msg.id)}
                              className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                                isAnswered
                                  ? 'bg-[#d1fae5] text-[#065f46] border border-[#6ee7b7] shadow-xs'
                                  : 'bg-[#fef3c7] text-[#b45309] border border-[#fcd34d] shadow-xs'
                              }`}
                              title="Klik untuk ubah status ANSWERED / PENDING"
                            >
                              {msg.status}
                            </button>
                          </div>
                        </div>

                        {/* Question Content Text */}
                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                          {msg.content}
                        </p>

                        {/* Attached file if any */}
                        {msg.attachment_name && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-mono">
                            <Paperclip className="w-3 h-3" />
                            <span>{msg.attachment_name}</span>
                          </div>
                        )}

                        {/* Timestamp & Question Label */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 mb-3">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                            Question
                          </span>
                          <span>{msg.created_at}</span>
                        </div>

                        {/* Existing Thread Replies from Teacher or Students */}
                        {msg.replies && msg.replies.length > 0 && (
                          <div className="space-y-2.5 mb-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                            {msg.replies.map((rep) => (
                              <div
                                key={rep.id}
                                className="bg-white/90 dark:bg-[#162732] border border-[#cbeada] dark:border-slate-700/80 rounded-xl p-3 flex items-start gap-2.5 shadow-xs"
                              >
                                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 ring-1 ring-emerald-400">
                                  {rep.sender_role === 'guru' ? 'G' : getInitials(rep.sender_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between text-[11px] mb-1">
                                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                      {rep.sender_name}
                                      {rep.sender_role === 'guru' && (
                                        <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider">
                                          GURU
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {rep.created_at}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {rep.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline Reply Input Row */}
                        <div className="flex items-center gap-2 bg-white/80 dark:bg-[#162732] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-inner">
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                            {activeRole === 'guru' ? 'G' : 'S'}
                          </div>
                          <input
                            type="text"
                            placeholder="Reply..."
                            value={replyInputs[msg.id] || ''}
                            onChange={(e) =>
                              setReplyInputs({ ...replyInputs, [msg.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSendReply(msg.id);
                              }
                            }}
                            className="flex-1 bg-transparent text-xs text-slate-800 dark:text-white outline-none placeholder-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendReply(msg.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            title="Kirim Balasan"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ====================================================================
              BOTTOM COMPOSER
          ==================================================================== */}
          <div className="p-4 sm:p-5 border-t border-[#e5f3eb] dark:border-slate-800 bg-[#f9fdfa] dark:bg-[#111e27]">
            {/* Attached file chip */}
            {attachedFileName && (
              <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-mono">
                <Paperclip className="w-3.5 h-3.5" />
                <span>{attachedFileName}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFileName(null)}
                  className="hover:text-rose-500 font-bold ml-1 cursor-pointer"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setAttachedFileName(f.name);
                e.target.value = '';
              }}
              className="hidden"
            />

            {/* Input Card Container */}
            <div className="bg-white dark:bg-[#14232d] border border-[#cbe6d6] dark:border-slate-700/90 rounded-2xl p-3 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
              <textarea
                rows={2}
                placeholder={
                  activeRole === 'guru'
                    ? `Kirim pesan / pengumuman kepada siswa Kelas ${selectedGrade}...`
                    : `Tulis pertanyaan untuk guru PAI Kelas ${selectedGrade}...`
                }
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full bg-transparent text-xs text-slate-800 dark:text-white outline-none resize-none placeholder-slate-400 leading-relaxed font-normal"
              />

              {/* Action Toolbar (Attach File, Emoji, Send button) */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-1">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <span>Attach File</span>
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <Smile className="w-4 h-4 text-slate-400" />
                      <span>Emoji</span>
                    </button>

                    {/* Popover Emoji Picker */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-8 left-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 shadow-xl flex gap-1.5">
                        {EMOJIS.map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => {
                              setNewMessageText((prev) => prev + ' ' + em);
                              setShowEmojiPicker(false);
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-base cursor-pointer"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!newMessageText.trim() && !attachedFileName}
                  className="px-5 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/25 transition-all hover:scale-102 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 font-bold" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
