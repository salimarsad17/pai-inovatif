export type UserRole = 'guru' | 'siswa' | 'admin';
export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alpa';
export type PublicationStatus = 'draft' | 'published' | 'archived';
export type QuestionType = 'pilihan_ganda' | 'benar_salah' | 'uraian';
export type AttitudeCategory = 'Spiritual' | 'Sosial' | 'Kedisiplinan' | 'Toleransi' | 'Kejujuran';

export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  role: UserRole;
  avatar_path?: string | null;
  nip?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SchoolSettings {
  id?: string;
  school_name: string;
  school_address: string;
  school_logo_path?: string | null;
  academic_year: string;
  semester: string;
  motto: string;
  headmaster_name?: string | null;
  headmaster_nip?: string | null;
  updated_at?: string;
}

export interface ClassItem {
  id: string;
  class_name: string;
  grade_level: number;
  academic_year: string;
  homeroom_teacher_id?: string | null;
  homeroom_teacher?: UserProfile | null;
  students_count?: number;
  created_at?: string;
}

export interface StudentItem {
  id: string;
  profile_id?: string;
  student_number: string;
  class_id?: string | null;
  gender?: 'L' | 'P';
  enrollment_status: 'aktif' | 'mutasi' | 'lulus' | 'nonaktif';
  created_at?: string;
  profile?: UserProfile;
  class?: ClassItem;
}

export interface TeachingDocument {
  id: string;
  title: string;
  category: 'CP' | 'TP' | 'ATP' | 'Prota' | 'Promes' | 'Modul Ajar' | 'KKTP' | 'Dokumen Pendukung';
  grade_level: number;
  semester: string;
  academic_year: string;
  file_url?: string | null;
  file_data?: string | null; // Base64 data URL
  file_name?: string | null;
  file_type?: string | null; // e.g. 'pdf' | 'docx' | 'xlsx' | 'image' | 'txt'
  file_size?: number | null;
  content_text?: string | null; // Document text/content for instant in-app reading
  description?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeachingMaterial {
  id: string;
  title: string;
  grade_level: number;
  class_id?: string | null;
  subject_id?: string | null;
  semester: string;
  topic: string;
  content: string;
  attachment_path?: string | null;
  video_url?: string | null;
  ai_generated?: boolean;
  publication_status: PublicationStatus;
  created_by?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  class?: ClassItem;
}

export interface TextbookChapter {
  id: string;
  grade_level: number;
  chapter_number: number;
  title: string;
  semester: 'Ganjil' | 'Genap';
  tag: string; // e.g. "PMM", "Buku Siswa Kemendikbud", "Kurikulum Merdeka"
  description: string;
  cover_image: string;
  file_url?: string | null;
  file_data?: string | null; // base64 data url for Word, PDF, Excel, PNG
  file_name?: string | null;
  file_type?: string | null; // 'docx' | 'pdf' | 'xlsx' | 'image' | 'txt'
  file_size?: number | null;
  content_text?: string | null; // Full text / summary of the chapter
  created_at?: string;
  updated_at?: string;
}

export interface TeachingJournal {
  id: string;
  teacher_id: string;
  class_id: string;
  journal_date: string;
  teaching_hour?: string; // Jam (contoh: Jam ke-1 - 2 / 07.30 - 08.50)
  topic: string; // Materi Pokok
  learning_objectives?: string; // Tujuan Pembelajaran
  methods?: string; // Metode
  activities: string; // Kegiatan KBM
  attendance_h?: number | string; // Kehadiran H (Hadir)
  attendance_s?: number | string; // Kehadiran S (Sakit)
  attendance_i?: number | string; // Kehadiran I (Izin)
  attendance_a?: number | string; // Kehadiran A (Alpa)
  notes?: string; // Ket (Keterangan)
  reflection?: string;
  obstacles?: string;
  follow_up?: string;
  created_at?: string;
  class?: ClassItem;
  teacher?: UserProfile;
}

export interface AttitudeRecord {
  id: string;
  student_id: string;
  teacher_id: string;
  record_date: string;
  category: AttitudeCategory;
  description: string;
  coaching_notes?: string;
  follow_up?: string;
  created_at?: string;
  student?: StudentItem;
  teacher?: UserProfile;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  notes?: string;
  recorded_by?: string;
  created_at?: string;
  student?: StudentItem;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  class_id: string;
  material_id?: string | null;
  due_at: string;
  assignment_type: string;
  publication_status: PublicationStatus;
  created_by?: string;
  created_at?: string;
  class?: ClassItem;
  submissions_count?: number;
  my_submission?: Submission;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  answer_text?: string;
  attachment_path?: string;
  submitted_at: string;
  score?: number | null;
  feedback?: string | null;
  graded_by?: string | null;
  graded_at?: string | null;
  student?: StudentItem;
  assignment?: Assignment;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[] | { id: string; label: string; text: string }[];
  answer_key?: any; // Only available to teachers or after grading
  points: number;
  order_number: number;
}

export interface Quiz {
  id: string;
  title: string;
  class_id: string;
  instructions?: string;
  duration_minutes: number;
  passing_grade?: number;
  publication_status: PublicationStatus;
  created_by?: string;
  created_at?: string;
  class?: ClassItem;
  questions?: QuizQuestion[];
  my_attempt?: QuizAttempt;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  started_at: string;
  submitted_at?: string | null;
  score?: number | null;
  status: 'in_progress' | 'completed';
  quiz?: Quiz;
  student?: StudentItem;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  answer: any;
  points_awarded?: number;
}

export interface GradeRecord {
  id: string;
  student_id: string;
  class_id: string;
  category: 'tugas' | 'kuis' | 'praktik' | 'formatif' | 'sumatif';
  title: string;
  score: number;
  max_score: number;
  weight: number;
  recorded_date: string;
  student?: StudentItem;
  class?: ClassItem;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_class_id?: string | null;
  is_important: boolean;
  created_by?: string;
  published_at: string;
  created_at?: string;
  author?: UserProfile;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  created_at: string;
  actor?: UserProfile;
}

// ================= CLASS Q&A & MESSAGING =================
export interface ClassQnAReply {
  id: string;
  message_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'guru' | 'siswa';
  sender_avatar?: string;
  content: string;
  created_at: string;
}

export interface ClassQnAMessage {
  id: string;
  class_id?: string;
  grade_level: number; // 7, 8, 9
  question_number: number;
  title: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'guru' | 'siswa';
  sender_avatar?: string;
  content: string;
  status: 'ANSWERED' | 'PENDING';
  created_at: string;
  replies: ClassQnAReply[];
  attachment_name?: string;
  attachment_url?: string;
  attachment_type?: string;
}

export interface ClassQnAAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  grade_level: number;
  category: string;
}

// ================= MEDIA AJAR =================
export type MediaAjarCategory = 'video' | 'game' | 'lms_modul';

export interface MediaAjarItem {
  id: string;
  category: MediaAjarCategory;
  title: string;
  description?: string;
  grade_level: number;
  url?: string;
  embed_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  file_data?: string;
  views_count?: number;
  play_count?: number;
  tag?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at?: string;
}


