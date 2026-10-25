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
  category: 'CP' | 'TP' | 'ATP' | 'Prota' | 'Promes' | 'Modul Ajar' | 'RPP' | 'Dokumen Pendukung';
  grade_level: number;
  semester: string;
  academic_year: string;
  file_url?: string | null;
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

export interface TeachingJournal {
  id: string;
  teacher_id: string;
  class_id: string;
  journal_date: string;
  topic: string;
  learning_objectives: string;
  methods?: string;
  activities: string;
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
