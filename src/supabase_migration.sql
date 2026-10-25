-- ====================================================================
-- SKEMA DATABASE LENGKAP: PAI INOVATIF
-- Sekolah: UPT SMPN 2 Rebang Tangkas
-- Platform: Supabase PostgreSQL dengan Row Level Security (RLS)
-- ====================================================================

-- ====================================================================
-- SCRIPT PEMBARUAN CEPAT (ALTER TABLE):
-- Jalankan perintah ini di Supabase SQL Editor agar nama siswa langsung
-- memiliki kolom khusus di Supabase Table Editor:
-- ====================================================================
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPE DATA ENUM
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('guru', 'siswa', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('hadir', 'sakit', 'izin', 'alpa');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE publication_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('pilihan_ganda', 'benar_salah', 'uraian');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABEL: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
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

-- 4. TABEL: school_settings
CREATE TABLE IF NOT EXISTS public.school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name TEXT NOT NULL DEFAULT 'UPT SMPN 2 Rebang Tangkas',
    school_address TEXT NOT NULL DEFAULT 'Jl. Rebang Tangkas, Way Kanan, Lampung',
    school_logo_path TEXT,
    academic_year TEXT NOT NULL DEFAULT '2025/2026',
    semester TEXT NOT NULL DEFAULT 'Ganjil',
    motto TEXT NOT NULL DEFAULT 'Guru Kreatif, Siswa Aktif',
    headmaster_name TEXT DEFAULT 'H. Ahmad Fauzi, S.Ag., M.Pd.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABEL: classes
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name TEXT NOT NULL, -- Contoh: VII A, VIII B, IX C
    grade_level INTEGER NOT NULL CHECK (grade_level IN (7, 8, 9)),
    academic_year TEXT NOT NULL DEFAULT '2025/2026',
    homeroom_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. TABEL: students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    student_number TEXT UNIQUE NOT NULL, -- NIS / NISN
    full_name TEXT, -- Nama Lengkap Siswa
    username TEXT, -- Username Login Siswa
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    gender TEXT CHECK (gender IN ('L', 'P')),
    enrollment_status TEXT NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. TABEL: subjects
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_name TEXT NOT NULL DEFAULT 'Pendidikan Agama Islam dan Budi Pekerti',
    description TEXT DEFAULT 'Mata Pelajaran Pendidikan Agama Islam dan Budi Pekerti Kurikulum Merdeka SMP'
);

-- 8. TABEL: teaching_documents (Perangkat Ajar: CP, TP, ATP, Prota, Promes, Modul Ajar)
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

-- 9. TABEL: teaching_materials (Bahan Ajar & Video Pembelajaran)
CREATE TABLE IF NOT EXISTS public.teaching_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level IN (7, 8, 9)),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL, -- Null berarti semua kelas di tingkat tersebut
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

-- 10. TABEL: teaching_journals (Jurnal Guru)
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

-- 11. TABEL: attitude_records (Jurnal Sikap)
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

-- 12. TABEL: attendance_records (Absensi Siswa)
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

-- 13. TABEL: assignments (Tugas & Evaluasi)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.teaching_materials(id) ON DELETE SET NULL,
    due_at TIMESTAMPTZ NOT NULL,
    assignment_type TEXT NOT NULL DEFAULT 'uraian', -- 'uraian', 'praktik', 'portofolio'
    publication_status publication_status NOT NULL DEFAULT 'published',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. TABEL: submissions (Jawaban & Nilai Tugas)
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

-- 15. TABEL: quizzes (Kuis & CBT)
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

-- 16. TABEL: quiz_questions (Pertanyaan Kuis)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL DEFAULT 'pilihan_ganda',
    options JSONB, -- Array of string or objects {id, label, text}
    answer_key JSONB, -- Protected answer key
    points NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    order_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 17. TABEL: quiz_attempts (Sesi Pengerjaan Siswa)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    submitted_at TIMESTAMPTZ,
    score NUMERIC(5, 2),
    status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed'
    CONSTRAINT unique_quiz_student_attempt UNIQUE (quiz_id, student_id)
);

-- 18. TABEL: quiz_answers (Jawaban Siswa per Soal)
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    answer JSONB,
    points_awarded NUMERIC(5, 2) DEFAULT 0,
    CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id)
);

-- 19. TABEL: grade_records (Rekap Nilai Siswa)
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

-- 20. TABEL: announcements (Pengumuman)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL, -- NULL berarti semua kelas
    is_important BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 21. TABEL: audit_logs (Log Aktivitas)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Aktifkan RLS di semua tabel
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
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function: Dapatkan role pengguna yang sedang login
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper Function: Dapatkan student_id milik user login jika role siswa
CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS UUID AS $$
    SELECT id FROM public.students WHERE profile_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper Function: Dapatkan class_id milik user login jika role siswa
CREATE OR REPLACE FUNCTION public.get_current_student_class_id()
RETURNS UUID AS $$
    SELECT class_id FROM public.students WHERE profile_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS: profiles
CREATE POLICY "Public profiles can be viewed by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Teachers and admins can insert profiles"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (
    public.get_current_role() IN ('guru', 'admin') OR auth.uid() = id
);

-- RLS: school_settings
CREATE POLICY "Everyone can read school settings"
ON public.school_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only teachers/admin can update school settings"
ON public.school_settings FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin')
);

-- RLS: classes
CREATE POLICY "Everyone can view classes"
ON public.classes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers and admin can manage classes"
ON public.classes FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin')
);

-- RLS: students
CREATE POLICY "Everyone authenticated can view student list"
ON public.students FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers and admin can manage students"
ON public.students FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin')
);

-- RLS: teaching_documents
CREATE POLICY "Everyone can view teaching documents"
ON public.teaching_documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can manage teaching documents"
ON public.teaching_documents FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin')
);

-- RLS: teaching_materials
CREATE POLICY "Materials readable by class or grade level"
ON public.teaching_materials FOR SELECT TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin') OR
    (
        publication_status = 'published' AND
        (class_id IS NULL OR class_id = public.get_current_student_class_id())
    )
);

CREATE POLICY "Teachers can manage teaching materials"
ON public.teaching_materials FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin')
);

-- RLS: teaching_journals
CREATE POLICY "Teachers can manage their journals"
ON public.teaching_journals FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin')
);

-- RLS: attitude_records (Jurnal Sikap)
CREATE POLICY "Teachers can manage attitude records"
ON public.attitude_records FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin')
);

-- RLS: attendance_records
CREATE POLICY "Teachers can manage attendance"
ON public.attendance_records FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin')
);

CREATE POLICY "Students can only read their own attendance"
ON public.attendance_records FOR SELECT TO authenticated USING (
    public.get_current_role() = 'siswa' AND student_id = public.get_current_student_id()
);

-- RLS: assignments
CREATE POLICY "Read assignments"
ON public.assignments FOR SELECT TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin') OR
    (publication_status = 'published' AND class_id = public.get_current_student_class_id())
);

CREATE POLICY "Teachers can manage assignments"
ON public.assignments FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin')
);

-- RLS: submissions
CREATE POLICY "Students can view and create their own submissions"
ON public.submissions FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin') OR
    student_id = public.get_current_student_id()
);

-- RLS: quizzes
CREATE POLICY "Read quizzes"
ON public.quizzes FOR SELECT TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin') OR
    (publication_status = 'published' AND class_id = public.get_current_student_class_id())
);

CREATE POLICY "Teachers can manage quizzes"
ON public.quizzes FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin')
);

-- RLS: quiz_questions (Protect answer_key from students!)
CREATE POLICY "Teachers can manage all quiz questions"
ON public.quiz_questions FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin')
);

CREATE POLICY "Students can view questions without leaking"
ON public.quiz_questions FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = quiz_questions.quiz_id
        AND q.publication_status = 'published'
        AND q.class_id = public.get_current_student_class_id()
    )
);

-- RLS: quiz_attempts
CREATE POLICY "Manage quiz attempts"
ON public.quiz_attempts FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin') OR
    student_id = public.get_current_student_id()
);

-- RLS: quiz_answers
CREATE POLICY "Manage quiz answers"
ON public.quiz_answers FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin') OR
    EXISTS (
        SELECT 1 FROM public.quiz_attempts a
        WHERE a.id = quiz_answers.attempt_id
        AND a.student_id = public.get_current_student_id()
    )
);

-- RLS: grade_records
CREATE POLICY "Teachers can manage grade records"
ON public.grade_records FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin')
);

CREATE POLICY "Students can view their own grades"
ON public.grade_records FOR SELECT TO authenticated USING (
    student_id = public.get_current_student_id()
);

-- RLS: announcements
CREATE POLICY "Read announcements"
ON public.announcements FOR SELECT TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin') OR
    target_class_id IS NULL OR
    target_class_id = public.get_current_student_class_id()
);

CREATE POLICY "Teachers can manage announcements"
ON public.announcements FOR ALL TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin')
);

-- RLS: audit_logs
CREATE POLICY "Teachers and admin can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated USING (
    public.get_current_role() IN ('guru', 'admin')
);

CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ====================================================================
-- INITIAL SEED / DEFAULT SETTINGS
-- ====================================================================

INSERT INTO public.school_settings (school_name, school_address, academic_year, semester, motto)
VALUES ('UPT SMPN 2 Rebang Tangkas', 'Jl. Rebang Tangkas, Kec. Rebang Tangkas, Kab. Way Kanan, Lampung', '2025/2026', 'Ganjil', 'Guru Kreatif, Siswa Aktif')
ON CONFLICT DO NOTHING;

INSERT INTO public.subjects (subject_name, description)
VALUES ('Pendidikan Agama Islam dan Budi Pekerti', 'Mata Pelajaran Utama PAI dan Budi Pekerti Kurikulum Merdeka SMP')
ON CONFLICT DO NOTHING;

-- TRIGGER: Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, username, role, is_active)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'guru'::user_role),
        true
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
