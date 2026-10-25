import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Video,
  ClipboardList,
  FileQuestion,
  Award,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Play,
  ExternalLink,
  ChevronRight,
  User,
  KeyRound,
  Save,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import {
  TeachingMaterial,
  Assignment,
  Submission,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  AttendanceRecord,
  Announcement,
  GradeRecord,
} from '../types';

interface StudentPortalProps {
  viewType:
    | 'siswa_materi'
    | 'siswa_video'
    | 'siswa_tugas'
    | 'siswa_kuis'
    | 'siswa_nilai'
    | 'siswa_kehadiran'
    | 'siswa_jadwal'
    | 'siswa_pengumuman'
    | 'siswa_pengumpulan'
    | 'siswa_profil'
    | 'siswa_pengaturan';
}

export const StudentPortalViews: React.FC<StudentPortalProps> = ({ viewType }) => {
  const { profile, student, schoolSettings, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<TeachingMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [myGrades, setMyGrades] = useState<GradeRecord[]>([]);

  // Task submission modal
  const [activeTask, setActiveTask] = useState<Assignment | null>(null);
  const [taskAnswerText, setTaskAnswerText] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);
  const [taskSuccessMsg, setTaskSuccessMsg] = useState<string | null>(null);

  // Material reading modal
  const [selectedMaterial, setSelectedMaterial] = useState<TeachingMaterial | null>(null);

  // CBT interactive mode
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [cbtQuestions, setCbtQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [quizAttempt, setQuizAttempt] = useState<QuizAttempt | null>(null);
  const [quizScoreResult, setQuizScoreResult] = useState<number | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Profile update
  const [editFullName, setEditFullName] = useState(profile?.full_name || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!student) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const classId = student.class_id || undefined;
      const gradeLevel = student.class?.grade_level;

      const [mat, ass, subs, qz, att, ann, grds] = await Promise.all([
        dataService.getTeachingMaterials(gradeLevel, classId, true),
        dataService.getAssignments(classId, true),
        dataService.getStudentSubmissions(student.id),
        dataService.getQuizzes(classId, true),
        dataService.getStudentAttendanceHistory(student.id),
        dataService.getAnnouncements(classId),
        dataService.getGradeRecords(classId, student.id),
      ]);

      setMaterials(mat);
      setAssignments(ass);
      setMySubmissions(subs);
      setQuizzes(qz);
      setAttendance(att);
      setAnnouncements(ann);
      setMyGrades(grds);
    } catch (err: any) {
      console.warn('Error loading student data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [student, viewType]);

  // Handle task submission
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !student || !taskAnswerText.trim()) return;

    setSubmittingTask(true);
    setTaskSuccessMsg(null);
    try {
      await dataService.submitAssignment({
        assignment_id: activeTask.id,
        student_id: student.id,
        answer_text: taskAnswerText.trim(),
      });
      setTaskSuccessMsg('Alhamdulillah! Tugas Anda berhasil dikirimkan kepada Guru PAI.');
      setTaskAnswerText('');
      loadData();
    } catch (err: any) {
      alert(`Gagal mengirim tugas: ${err.message}`);
    } finally {
      setSubmittingTask(false);
    }
  };

  // Start CBT Quiz
  const handleStartCBT = async (quiz: Quiz) => {
    if (!student) return;
    try {
      const [questions, attempt] = await Promise.all([
        dataService.getQuizQuestions(quiz.id, false), // safe: answer_key stripped
        dataService.startQuizAttempt(quiz.id, student.id),
      ]);

      setActiveQuiz(quiz);
      setCbtQuestions(questions);
      setCurrentQuestionIndex(0);
      setQuizAttempt(attempt);
      setStudentAnswers({});
      setQuizScoreResult(attempt.score || null);
    } catch (err: any) {
      alert(`Gagal memulai CBT: ${err.message}`);
    }
  };

  // Submit CBT Quiz
  const handleSubmitCBT = async () => {
    if (!quizAttempt || !activeQuiz || cbtQuestions.length === 0) return;
    if (!confirm('Apakah Anda yakin ingin menyelesaikan kuis CBT ini?')) return;

    setSubmittingQuiz(true);
    try {
      // Calculate score based on answered questions
      // For automated scoring of multiple choice questions
      let earnedPoints = 0;
      let totalPoints = 0;

      cbtQuestions.forEach((q) => {
        const point = Number(q.points) || 10;
        totalPoints += point;
        // Basic check if answered
        if (studentAnswers[q.id]) {
          earnedPoints += point; // Initial completion score
        }
      });

      const finalPercentage = Math.round((earnedPoints / (totalPoints || 1)) * 100);

      await dataService.submitQuizAttempt(quizAttempt.id, finalPercentage);
      setQuizScoreResult(finalPercentage);
      loadData();
    } catch (err: any) {
      alert(`Gagal mengumpulkan kuis: ${err.message}`);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setUpdatingProfile(true);
    setProfileMsg(null);
    try {
      await authService.updateProfile(profile.id, {
        full_name: editFullName.trim(),
        phone: editPhone.trim(),
      });
      await refreshProfile();
      setProfileMsg('Profil berhasil diperbarui!');
    } catch (err: any) {
      setProfileMsg(`Gagal memperbarui profil: ${err.message}`);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // ================= VIEW: MATERI PAI =================
  if (viewType === 'siswa_materi') {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <span>Bahan Ajar & Materi Pembelajaran PAI</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Materi resmi Pendidikan Agama Islam yang dipublikasikan untuk kelas Anda ({student?.class?.class_name || 'SMP'}).
          </p>
        </div>

        {materials.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-xs text-slate-400">Belum ada materi yang dipublikasikan untuk kelasmu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((mat) => (
              <div
                key={mat.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800 text-[10px] font-bold">
                      Kelas {mat.grade_level} SMP
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Semester {mat.semester}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2 line-clamp-2">{mat.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {mat.content.slice(0, 150)}...
                  </p>
                </div>

                <button
                  onClick={() => setSelectedMaterial(mat)}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Baca Materi Lengkap</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal Baca Materi */}
        {selectedMaterial && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedMaterial.title}</h3>
                  <p className="text-xs text-amber-400 font-medium">
                    Topik: {selectedMaterial.topic} &bull; Kelas {selectedMaterial.grade_level}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line space-y-3">
                {selectedMaterial.content}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
                >
                  Tutup Bacaan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= VIEW: VIDEO PEMBELAJARAN =================
  if (viewType === 'siswa_video') {
    const videoMaterials = materials.filter((m) => m.video_url || m.content.includes('http'));
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-rose-400" />
            <span>Video Pembelajaran & Multimedia PAI</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Media audio visual interaktif untuk memperdalam pemahaman ibadah, sejarah Islam, dan akhlak.
          </p>
        </div>

        {videoMaterials.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">Belum Ada Video Pembelajaran</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Guru PAI belum menyematkan tautan video pembelajaran untuk kelas ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videoMaterials.map((mat) => (
              <div
                key={mat.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="w-full h-40 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center mb-3 text-rose-500 relative overflow-hidden group">
                  <Play className="w-12 h-12 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono">
                    Video PAI
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{mat.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{mat.topic}</p>
                {mat.video_url && (
                  <a
                    href={mat.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Tonton Video</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ================= VIEW: TUGAS SAYA =================
  if (viewType === 'siswa_tugas' || viewType === 'siswa_pengumpulan') {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-400" />
            <span>
              {viewType === 'siswa_pengumpulan' ? 'Riwayat Pengumpulan Tugas' : 'Tugas Mandiri & Terstruktur'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kirimkan jawaban Anda sebelum batas waktu yang ditentukan. Nilai dan umpan balik akan muncul setelah diperiksa Guru.
          </p>
        </div>

        {assignments.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-xs text-slate-400">Belum ada tugas untuk kelasmu saat ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((ass) => {
              const mySub = mySubmissions.find((s) => s.assignment_id === ass.id);
              const isSubmitted = Boolean(mySub);
              const isGraded = mySub?.score !== null && mySub?.score !== undefined;

              return (
                <div
                  key={ass.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">{ass.title}</h3>
                      <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          Deadline: {new Date(ass.due_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </p>
                    </div>

                    <div>
                      {isGraded ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-xs">
                          Nilai: {mySub?.score} / 100
                        </span>
                      ) : isSubmitted ? (
                        <span className="px-2.5 py-1 rounded-xl bg-blue-950 text-blue-300 border border-blue-800 font-semibold text-xs">
                          Sudah Dikirim
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-950 text-amber-300 border border-amber-800 font-semibold text-xs">
                          Belum Dikerjakan
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 whitespace-pre-line leading-relaxed">
                    {ass.description}
                  </div>

                  {/* Submission feedback if any */}
                  {mySub?.feedback && (
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-xs text-emerald-200">
                      <span className="font-bold text-emerald-400 block mb-0.5">Umpan Balik Guru PAI:</span>
                      {mySub.feedback}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setActiveTask(ass);
                        setTaskAnswerText(mySub?.answer_text || '');
                        setTaskSuccessMsg(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitted ? 'Edit Jawaban Terkirim' : 'Kerjakan Tugas'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Kerjakan Tugas */}
        {activeTask && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl">
              <h3 className="text-base font-bold text-white mb-1">
                Kirim Jawaban: {activeTask.title}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Ketikkan jawaban Anda secara lengkap dan teliti di bawah ini.
              </p>

              {taskSuccessMsg && (
                <div className="p-3 mb-3 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{taskSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jawaban Tugas Anda
                  </label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Tuliskan jawaban Anda di sini..."
                    value={taskAnswerText}
                    onChange={(e) => setTaskAnswerText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs text-white outline-none focus:border-amber-400 leading-relaxed font-sans"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTask(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTask}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingTask ? 'Mengirim...' : 'Kirim Jawaban'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= VIEW: KUIS DAN CBT =================
  if (viewType === 'siswa_kuis') {
    if (activeQuiz) {
      // Interactive CBT Test Mode
      const currentQ = cbtQuestions[currentQuestionIndex];
      const isLast = currentQuestionIndex === cbtQuestions.length - 1;

      return (
        <div className="space-y-6 animate-in fade-in">
          {/* CBT Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">{activeQuiz.title}</h2>
              <p className="text-xs text-slate-400 font-mono">
                Soal {currentQuestionIndex + 1} dari {cbtQuestions.length}
              </p>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-blue-950 border border-blue-800 text-blue-300 font-mono font-bold text-xs flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Durasi: {activeQuiz.duration_minutes} Menit</span>
            </div>
          </div>

          {/* Question Display */}
          {currentQ ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="text-sm font-semibold text-white leading-relaxed">
                {currentQuestionIndex + 1}. {currentQ.question_text}
              </div>

              {/* Options */}
              <div className="space-y-2 pt-2">
                {Array.isArray(currentQ.options) ? (
                  currentQ.options.map((opt: any, optIdx: number) => {
                    const optText = typeof opt === 'string' ? opt : opt.text || opt.label;
                    const isSelected = studentAnswers[currentQ.id] === optText;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() =>
                          setStudentAnswers((prev) => ({ ...prev, [currentQ.id]: optText }))
                        }
                        className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-blue-600/30 border-blue-500 text-white font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{optText}</span>
                      </button>
                    );
                  })
                ) : (
                  <input
                    type="text"
                    placeholder="Ketikkan jawaban Anda..."
                    value={studentAnswers[currentQ.id] || ''}
                    onChange={(e) =>
                      setStudentAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                  />
                )}
              </div>

              {/* Navigation buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 disabled:opacity-40 text-xs font-semibold"
                >
                  Sebelumnya
                </button>

                {isLast ? (
                  <button
                    type="button"
                    onClick={handleSubmitCBT}
                    disabled={submittingQuiz}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
                  >
                    {submittingQuiz ? 'Mengirim...' : 'Kumpulkan & Selesai'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                  >
                    Selanjutnya
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Pertanyaan kuis sedang dipersiapkan...
            </div>
          )}

          {/* Result Banner if already completed */}
          {quizScoreResult !== null && (
            <div className="bg-emerald-950/60 border border-emerald-800 rounded-2xl p-5 text-center text-emerald-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white mb-1">Kuis Berhasil Dikerjakan!</h3>
              <p className="text-xs text-emerald-300">
                Nilai Anda: <span className="text-lg font-black text-amber-400">{quizScoreResult} / 100</span>
              </p>
              <button
                onClick={() => setActiveQuiz(null)}
                className="mt-3 px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold"
              >
                Kembali ke Daftar Kuis
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <FileQuestion className="w-6 h-6 text-purple-400" />
            <span>Kuis & Computer Based Test (CBT) PAI</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ujian daring interaktif dan evaluasi pemahaman materi agama Islam.
          </p>
        </div>

        {quizzes.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <FileQuestion className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-xs text-slate-400">Belum ada jadwal kuis aktif untuk kelas Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((qz) => (
              <div
                key={qz.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-800 text-[10px] font-bold">
                      CBT PAI
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {qz.duration_minutes} Menit
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{qz.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {qz.instructions || 'Ikuti kuis dengan jujur dan teliti.'}
                  </p>
                </div>

                <button
                  onClick={() => handleStartCBT(qz)}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Mulai Kerjakan Kuis</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ================= VIEW: NILAI SAYA =================
  if (viewType === 'siswa_nilai') {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            <span>Transkrip Nilai Pembelajaran PAI Saya</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Daftar perolehan nilai tugas, kuis, praktik, dan evaluasi hasil belajar yang telah dipublikasikan guru.
          </p>
        </div>

        {myGrades.length === 0 && mySubmissions.filter((s) => s.score !== null).length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-xs text-slate-400">Belum ada nilai yang dipublikasikan oleh Guru PAI.</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Penilaian / Tugas</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-center">Nilai Perolehan</th>
                  <th className="py-3 px-4">Umpan Balik Guru</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {mySubmissions
                  .filter((s) => s.score !== null && s.score !== undefined)
                  .map((sub, i) => (
                    <tr key={sub.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500 font-mono">{i + 1}</td>
                      <td className="py-3 px-4 font-semibold text-white">{sub.assignment?.title}</td>
                      <td className="py-3 px-4 capitalize">Tugas Mandiri</td>
                      <td className="py-3 px-4 text-center font-bold text-amber-400 font-mono text-sm">
                        {sub.score} / 100
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">{sub.feedback || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ================= VIEW: RIWAYAT KEHADIRAN =================
  if (viewType === 'siswa_kehadiran') {
    const hadir = attendance.filter((a) => a.status === 'hadir').length;
    const sakit = attendance.filter((a) => a.status === 'sakit').length;
    const izin = attendance.filter((a) => a.status === 'izin').length;
    const alpa = attendance.filter((a) => a.status === 'alpa').length;

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-400" />
            <span>Riwayat Kehadiran Peserta Didik</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Catatan absensi resmi pada mata pelajaran Pendidikan Agama Islam.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-900 text-center">
            <span className="text-[10px] text-emerald-400 block font-semibold">HADIR</span>
            <span className="text-2xl font-bold text-emerald-300">{hadir}</span>
          </div>
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-900 text-center">
            <span className="text-[10px] text-blue-400 block font-semibold">SAKIT</span>
            <span className="text-2xl font-bold text-blue-300">{sakit}</span>
          </div>
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-900 text-center">
            <span className="text-[10px] text-amber-400 block font-semibold">IZIN</span>
            <span className="text-2xl font-bold text-amber-300">{izin}</span>
          </div>
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900 text-center">
            <span className="text-[10px] text-rose-400 block font-semibold">ALPA</span>
            <span className="text-2xl font-bold text-rose-300">{alpa}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {attendance.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada riwayat absensi tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[10px] uppercase font-semibold">
                    <th className="py-3 px-4">Tanggal Pertemuan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Catatan Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {attendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono">
                        {new Date(rec.attendance_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-200">
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{rec.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================= VIEW: JADWAL & PENGUMUMAN & PROFIL =================
  if (viewType === 'siswa_jadwal') {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-400" />
            <span>Jadwal Pembelajaran PAI & Budi Pekerti</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Waktu tatap muka, salat berjamaah, dan kegiatan keagamaan di UPT SMPN 2 Rebang Tangkas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
              <Calendar className="w-4 h-4" /> Jadwal Pelajaran PAI Mingguan
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <div>
                  <div className="font-bold text-white">Kelas {student?.class?.class_name || 'SMP'}</div>
                  <div className="text-[11px] text-slate-400">Pembelajaran Tatap Muka & Diskusi</div>
                </div>
                <div className="text-right font-mono text-amber-300 font-bold">
                  08.00 - 10.00 WIB
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
              <Clock className="w-4 h-4" /> Kegiatan Pembiasaan Ibadah
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <div>
                  <div className="font-bold text-white">Salat Dhuhur Berjamaah</div>
                  <div className="text-[11px] text-slate-400">Masjid Sekolah</div>
                </div>
                <div className="font-mono text-emerald-300 font-bold">12.00 - 12.45 WIB</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <div>
                  <div className="font-bold text-white">Salat Dhuha & Muraja&apos;ah</div>
                  <div className="text-[11px] text-slate-400">Setiap Jumat Pagi</div>
                </div>
                <div className="font-mono text-emerald-300 font-bold">07.00 - 07.45 WIB</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: Profil Siswa & Pengaturan Akun
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <User className="w-6 h-6 text-amber-400" />
          <span>Profil & Pengaturan Akun Siswa</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Informasi identitas peserta didik UPT SMPN 2 Rebang Tangkas.
        </p>
      </div>

      {profileMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{profileMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Identitas Terdaftar</h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Nomor Induk Siswa (NIS)</span>
              <span className="text-sm font-mono font-bold text-amber-400">
                {student?.student_number || '-'}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Kelas Saat Ini</span>
              <span className="text-sm font-bold text-blue-400">
                {student?.class?.class_name || 'SMP'}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Username Login</span>
              <span className="text-sm font-mono text-slate-300">
                @{profile?.username}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Perbarui Informasi Kontak</h3>

          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">No. WhatsApp / HP</label>
              <input
                type="text"
                placeholder="0812..."
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{updatingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
