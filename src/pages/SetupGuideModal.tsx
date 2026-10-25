import React, { useState } from 'react';
import {
  HelpCircle,
  Copy,
  CheckCircle2,
  Database,
  Globe,
  KeyRound,
  ShieldCheck,
  Server,
  UploadCloud,
  ExternalLink,
} from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'steps' | 'deploy' | 'testing'>('sql');

  if (!isOpen) return null;

  const fullSQLMigration = `-- ====================================================================
-- SKEMA DATABASE LENGKAP: PAI INOVATIF
-- Sekolah: UPT SMPN 2 Rebang Tangkas
-- Jalankan skrip ini di SQL Editor Supabase Anda
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('guru', 'siswa', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('hadir', 'sakit', 'izin', 'alpa');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE publication_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('pilihan_ganda', 'benar_salah', 'uraian');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE,
    role user_role NOT NULL DEFAULT 'siswa',
    avatar_path TEXT,
    nip TEXT,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. school_settings
CREATE TABLE IF NOT EXISTS public.school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name TEXT NOT NULL DEFAULT 'UPT SMPN 2 Rebang Tangkas',
    school_address TEXT NOT NULL DEFAULT 'Jl. Rebang Tangkas, Kec. Rebang Tangkas, Kab. Way Kanan, Lampung',
    school_logo_path TEXT,
    academic_year TEXT NOT NULL DEFAULT '2025/2026',
    semester TEXT NOT NULL DEFAULT 'Ganjil',
    motto TEXT NOT NULL DEFAULT 'Guru Kreatif, Siswa Aktif',
    headmaster_name TEXT DEFAULT 'H. Ahmad Fauzi, S.Ag., M.Pd.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. classes
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name TEXT NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level IN (7, 8, 9)),
    academic_year TEXT NOT NULL DEFAULT '2025/2026',
    homeroom_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_number TEXT UNIQUE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    gender TEXT CHECK (gender IN ('L', 'P')),
    enrollment_status TEXT NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. subjects
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_name TEXT NOT NULL DEFAULT 'Pendidikan Agama Islam dan Budi Pekerti',
    description TEXT DEFAULT 'Mata Pelajaran Utama PAI dan Budi Pekerti Kurikulum Merdeka SMP'
);

-- 6. teaching_documents
CREATE TABLE IF NOT EXISTS public.teaching_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('CP', 'TP', 'ATP', 'Prota', 'Promes', 'Modul Ajar', 'RPP', 'Dokumen Pendukung')),
    grade_level INTEGER NOT NULL CHECK (grade_level IN (7, 8, 9)),
    semester TEXT NOT NULL DEFAULT 'Ganjil',
    academic_year TEXT NOT NULL DEFAULT '2025/2026',
    file_url TEXT,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. teaching_materials
CREATE TABLE IF NOT EXISTS public.teaching_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level IN (7, 8, 9)),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    semester TEXT NOT NULL DEFAULT 'Ganjil',
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    attachment_path TEXT,
    video_url TEXT,
    ai_generated BOOLEAN NOT NULL DEFAULT false,
    publication_status publication_status NOT NULL DEFAULT 'published',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. teaching_journals
CREATE TABLE IF NOT EXISTS public.teaching_journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    journal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    topic TEXT NOT NULL,
    learning_objectives TEXT NOT NULL,
    methods TEXT,
    activities TEXT NOT NULL,
    reflection TEXT,
    obstacles TEXT,
    follow_up TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. attitude_records
CREATE TABLE IF NOT EXISTS public.attitude_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL CHECK (category IN ('Spiritual', 'Sosial', 'Kedisiplinan', 'Toleransi', 'Kejujuran')),
    description TEXT NOT NULL,
    coaching_notes TEXT,
    follow_up TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. attendance_records
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status attendance_status NOT NULL DEFAULT 'hadir',
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_student_class_date UNIQUE (student_id, class_id, attendance_date)
);

-- 11. assignments
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.teaching_materials(id) ON DELETE SET NULL,
    due_at TIMESTAMPTZ NOT NULL,
    assignment_type TEXT NOT NULL DEFAULT 'uraian',
    publication_status publication_status NOT NULL DEFAULT 'published',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. submissions
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    answer_text TEXT,
    attachment_path TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    score NUMERIC(5, 2),
    feedback TEXT,
    graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    graded_at TIMESTAMPTZ,
    CONSTRAINT unique_assignment_student UNIQUE (assignment_id, student_id)
);

-- 13. quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    instructions TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    passing_grade NUMERIC(5, 2) DEFAULT 75.00,
    publication_status publication_status NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. quiz_questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL DEFAULT 'pilihan_ganda',
    options JSONB,
    answer_key JSONB,
    points NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    order_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. quiz_attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    submitted_at TIMESTAMPTZ,
    score NUMERIC(5, 2),
    status TEXT NOT NULL DEFAULT 'in_progress',
    CONSTRAINT unique_quiz_student_attempt UNIQUE (quiz_id, student_id)
);

-- 16. grade_records
CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('tugas', 'kuis', 'praktik', 'formatif', 'sumatif')),
    title TEXT NOT NULL,
    score NUMERIC(5, 2) NOT NULL,
    max_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    weight NUMERIC(3, 2) DEFAULT 1.0,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 17. announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    is_important BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 18. audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- AKTIFKAN RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attitude_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "classes_all" ON public.classes FOR ALL TO authenticated USING (true);
CREATE POLICY "students_all" ON public.students FOR ALL TO authenticated USING (true);
CREATE POLICY "materials_all" ON public.teaching_materials FOR ALL TO authenticated USING (true);
CREATE POLICY "journals_all" ON public.teaching_journals FOR ALL TO authenticated USING (true);
CREATE POLICY "attitude_all" ON public.attitude_records FOR ALL TO authenticated USING (true);
CREATE POLICY "attendance_all" ON public.attendance_records FOR ALL TO authenticated USING (true);
CREATE POLICY "assignments_all" ON public.assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "submissions_all" ON public.submissions FOR ALL TO authenticated USING (true);
CREATE POLICY "quizzes_all" ON public.quizzes FOR ALL TO authenticated USING (true);
CREATE POLICY "quiz_questions_all" ON public.quiz_questions FOR ALL TO authenticated USING (true);
CREATE POLICY "quiz_attempts_all" ON public.quiz_attempts FOR ALL TO authenticated USING (true);
CREATE POLICY "grades_all" ON public.grade_records FOR ALL TO authenticated USING (true);
CREATE POLICY "announcements_all" ON public.announcements FOR ALL TO authenticated USING (true);
CREATE POLICY "audit_all" ON public.audit_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "school_all" ON public.school_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "docs_all" ON public.teaching_documents FOR ALL TO authenticated USING (true);

-- INITIAL SEED
INSERT INTO public.school_settings (school_name, school_address, academic_year, semester, motto)
VALUES ('UPT SMPN 2 Rebang Tangkas', 'Jl. Rebang Tangkas, Kec. Rebang Tangkas, Kab. Way Kanan, Lampung', '2025/2026', 'Ganjil', 'Guru Kreatif, Siswa Aktif')
ON CONFLICT DO NOTHING;

INSERT INTO public.subjects (subject_name, description)
VALUES ('Pendidikan Agama Islam dan Budi Pekerti', 'Mata Pelajaran Utama PAI dan Budi Pekerti Kurikulum Merdeka SMP')
ON CONFLICT DO NOTHING;
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullSQLMigration);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Panduan Pemasangan & Skema Supabase PostgreSQL
              </h3>
              <p className="text-xs text-slate-400">
                Langkah menjalankan skema, RLS, Storage, dan deployment Vercel domain sendiri.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl font-bold p-1"
          >
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Skrip SQL Migration</span>
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'steps'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>15 Langkah Pemasangan</span>
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'deploy'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Deploy ke Vercel</span>
          </button>
          <button
            onClick={() => setActiveTab('testing')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'testing'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Checklist Pengujian</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-300">
                  Salin seluruh perintah SQL di bawah, lalu buka <strong>SQL Editor</strong> di dashboard Supabase Anda (
                  <span className="text-amber-400 font-mono">txbdicaqwjpkybhznuzw.supabase.co</span>) dan klik <strong>Run</strong>.
                </p>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin SQL Lengkap'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-emerald-400 max-h-[50vh] overflow-y-auto leading-relaxed select-all">
                  {fullSQLMigration}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white mb-2">Panduan 15 Langkah Pemasangan:</h4>
              <ol className="list-decimal pl-5 space-y-2.5 text-slate-300 leading-relaxed">
                <li>
                  <strong>Buka Proyek Supabase:</strong> Masuk ke <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-amber-400 underline">supabase.com/dashboard</a> proyek Anda (<span className="font-mono text-slate-200">txbdicaqwjpkybhznuzw</span>).
                </li>
                <li>
                  <strong>Ambil Project URL & Key:</strong> Masuk ke menu <em>Project Settings &gt; API</em>. Pastikan URL dan anon key terpasang di <span className="font-mono text-amber-300">.env</span>.
                </li>
                <li>
                  <strong>Jalankan SQL Migration:</strong> Masuk ke <em>SQL Editor</em>, tempel kode SQL dari tab sebelah, lalu klik <strong>Run</strong>.
                </li>
                <li>
                  <strong>Aktifkan RLS:</strong> Skrip SQL telah otomatis mengaktifkan Row Level Security (RLS) di seluruh tabel.
                </li>
                <li>
                  <strong>Buat Storage Bucket:</strong> Di menu <em>Storage</em>, buat bucket bernama <span className="font-mono text-amber-300">materials</span>, <span className="font-mono text-amber-300">avatars</span>, dan <span className="font-mono text-amber-300">submissions</span> (Public read).
                </li>
                <li>
                  <strong>Daftarkan Guru Pertama:</strong> Di halaman login, klik tombol <span className="text-amber-300">&ldquo;Daftarkan Akun Guru PAI Pertama&rdquo;</span>.
                </li>
                <li>
                  <strong>Buat Rombel Kelas:</strong> Masuk ke menu <em>Data Kelas</em>, tambahkan kelas VII A, VII B, dst.
                </li>
                <li>
                  <strong>Buat Akun Siswa:</strong> Masuk ke menu <em>Data Siswa</em> &gt; <em>Tambah Siswa Baru</em>. Sistem otomatis membuat akun login siswa dengan NIS dan sandi default.
                </li>
                <li>
                  <strong>Uji Bahan Ajar AI:</strong> Masuk ke menu <em>Bahan Ajar AI</em> untuk menghasilkan modul ajar, LKPD, dan soal kuis menggunakan Gemini 3.8 Flash.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'deploy' && (
            <div className="space-y-3 leading-relaxed text-slate-300">
              <h4 className="text-sm font-bold text-white">Panduan Deploy ke Vercel & Domain Sendiri:</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>Push ke GitHub:</strong> Unggah source code ini ke repository GitHub Anda (misal: <span className="font-mono text-slate-200">pai-inovatif</span>).
                </li>
                <li>
                  <strong>Import ke Vercel:</strong> Buka <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">vercel.com</a>, klik <em>Add New &gt; Project</em>, lalu pilih repository GitHub Anda.
                </li>
                <li>
                  <strong>Konfigurasi Environment Variables di Vercel:</strong>
                  <div className="mt-1 p-2.5 bg-slate-950 rounded-lg font-mono text-[11px] text-emerald-300 space-y-1">
                    <div>VITE_SUPABASE_URL = https://txbdicaqwjpkybhznuzw.supabase.co</div>
                    <div>VITE_SUPABASE_PUBLISHABLE_KEY = eyJhbGci...</div>
                    <div>GEMINI_API_KEY = [API Key Anda dari Google AI Studio]</div>
                  </div>
                </li>
                <li>
                  <strong>Hubungkan Domain Sendiri:</strong> Di project Vercel Anda, buka <em>Settings &gt; Domains</em>, masukkan domain sekolah (contoh: <span className="font-mono text-amber-300">pai.smpn2rebangtangkas.sch.id</span>), lalu atur CNAME record di DNS Anda.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'testing' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white">Checklist Pengujian Aplikasi:</h4>
              <div className="space-y-2 text-slate-300">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Login Guru berhasil & membuka Dashboard Guru</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Login Siswa berhasil dengan NIS & membuka Dashboard Siswa</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Pembuatan Bahan Ajar AI dengan Gemini 3.8 Flash berfungsi lancar</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Absensi Siswa berhasil batch upsert tanpa error duplikasi</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Pengumpulan tugas & pemberian nilai serta feedback tersimpan di Supabase</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
