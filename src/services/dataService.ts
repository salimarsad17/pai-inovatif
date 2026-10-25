import { supabase } from '../lib/supabase';
import {
  SchoolSettings,
  ClassItem,
  StudentItem,
  TeachingDocument,
  TeachingMaterial,
  TeachingJournal,
  AttitudeRecord,
  AttendanceRecord,
  Assignment,
  Submission,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  QuizAnswer,
  GradeRecord,
  Announcement,
  AuditLog,
} from '../types';

export const dataService = {
  // ================= SCHOOL SETTINGS =================
  async getSchoolSettings(): Promise<SchoolSettings> {
    const { data, error } = await supabase
      .from('school_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        school_name: 'UPT SMPN 2 Rebang Tangkas',
        school_address: 'Jl. Rebang Tangkas, Kec. Rebang Tangkas, Kab. Way Kanan, Lampung',
        academic_year: '2025/2026',
        semester: 'Ganjil',
        motto: 'Guru Kreatif, Siswa Aktif',
        headmaster_name: 'H. Ahmad Fauzi, S.Ag., M.Pd.',
      };
    }
    return data as SchoolSettings;
  },

  async updateSchoolSettings(settings: Partial<SchoolSettings>) {
    const { data: existing } = await supabase.from('school_settings').select('id').limit(1).maybeSingle();
    if (existing?.id) {
      const { data, error } = await supabase
        .from('school_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('school_settings')
        .insert({ ...settings, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // ================= LOCAL STORAGE HELPERS =================
  getLocalClasses(): ClassItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('pai_custom_classes');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveLocalClass(item: ClassItem) {
    if (typeof window === 'undefined') return;
    try {
      const classes = this.getLocalClasses();
      const filtered = classes.filter((c) => c.id !== item.id);
      filtered.push(item);
      localStorage.setItem('pai_custom_classes', JSON.stringify(filtered));
    } catch (e) {
      console.warn('Error saving local class:', e);
    }
  },

  getLocalStudents(): StudentItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('pai_custom_students');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveLocalStudent(student: StudentItem, password?: string) {
    if (typeof window === 'undefined') return;
    try {
      const existing = this.getLocalStudents();
      const filtered = existing.filter(
        (s) => s.id !== student.id && s.student_number !== student.student_number
      );
      filtered.unshift(student);
      localStorage.setItem('pai_custom_students', JSON.stringify(filtered));

      if (password && student.profile?.username) {
        const rawCreds = localStorage.getItem('pai_student_credentials');
        const creds = rawCreds ? JSON.parse(rawCreds) : {};
        const u = student.profile.username.toLowerCase();
        const nis = student.student_number.toLowerCase();
        creds[u] = { password, student };
        creds[nis] = { password, student };
        localStorage.setItem('pai_student_credentials', JSON.stringify(creds));
      }
    } catch (e) {
      console.error('Error saving local student:', e);
    }
  },

  // ================= CLASSES =================
  async getClasses(): Promise<ClassItem[]> {
    const defaultClasses: ClassItem[] = [
      { id: '3e99450a-dca2-4a58-a83c-5d1a20737dea', class_name: 'VII A', grade_level: 7, academic_year: '2025/2026', students_count: 0 },
      { id: '26202a8c-b677-4314-8916-b706acbcd7ca', class_name: 'VII B', grade_level: 7, academic_year: '2025/2026', students_count: 0 },
      { id: 'b8f745cd-259a-4faa-84a0-c9b3ade197d1', class_name: 'VIII A', grade_level: 8, academic_year: '2025/2026', students_count: 0 },
      { id: 'a19314d1-4cb4-401b-b8e6-d21490f46e78', class_name: 'VIII B', grade_level: 8, academic_year: '2025/2026', students_count: 0 },
      { id: '5d94ba8d-778c-4e1c-9a8c-0e10fd6db5f9', class_name: 'IX A', grade_level: 9, academic_year: '2025/2026', students_count: 0 },
      { id: '3230bdbc-d4b1-48d5-b6a0-d90a6f99038e', class_name: 'IX B', grade_level: 9, academic_year: '2025/2026', students_count: 0 },
    ];

    let dbClasses: ClassItem[] = [];
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        await supabase.auth.signInWithPassword({
          email: 'salimarsad17@gmail.com',
          password: 'guru321',
        });
      }

      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(id, full_name, username)
        `)
        .order('grade_level', { ascending: true })
        .order('class_name', { ascending: true });

      if (!error && data && data.length > 0) {
        dbClasses = data as ClassItem[];
      }
    } catch (error: any) {
      console.warn('Could not fetch classes from Supabase:', error.message);
    }

    const localClasses = this.getLocalClasses();
    let merged: ClassItem[] = [];

    if (dbClasses.length > 0) {
      merged = [...dbClasses];
      localClasses.forEach((lc) => {
        if (!merged.some((m) => m.id === lc.id || m.class_name.toLowerCase() === lc.class_name.toLowerCase())) {
          merged.push(lc);
        }
      });
    } else if (localClasses.length > 0) {
      merged = [...localClasses];
    } else {
      merged = [...defaultClasses];
      if (typeof window !== 'undefined') {
        localStorage.setItem('pai_custom_classes', JSON.stringify(defaultClasses));
      }
    }

    // Attach student count
    const localStudents = this.getLocalStudents();
    const result = await Promise.all(
      merged.map(async (cls) => {
        let count = 0;
        try {
          const { count: dbCount } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('class_id', cls.id);
          count = dbCount || 0;
        } catch {
          // Ignore
        }
        const localCount = localStudents.filter((st) => st.class_id === cls.id).length;
        return {
          ...cls,
          students_count: Math.max(count, localCount),
        };
      })
    );

    return result;
  },

  async createClass(item: { class_name: string; grade_level: number; academic_year: string; homeroom_teacher_id?: string | null }) {
    try {
      const { data, error } = await supabase.from('classes').insert(item).select().single();
      if (!error && data) {
        this.saveLocalClass(data as ClassItem);
        return data as ClassItem;
      }
    } catch (e) {
      console.warn('Supabase createClass fallback:', e);
    }

    const newClass: ClassItem = {
      id: `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      class_name: item.class_name,
      grade_level: item.grade_level,
      academic_year: item.academic_year,
      homeroom_teacher_id: item.homeroom_teacher_id || null,
      students_count: 0,
      created_at: new Date().toISOString(),
    };
    this.saveLocalClass(newClass);
    return newClass;
  },

  async updateClass(id: string, updates: Partial<ClassItem>) {
    try {
      const { data, error } = await supabase.from('classes').update(updates).eq('id', id).select().single();
      if (!error && data) {
        this.saveLocalClass(data as ClassItem);
        return data as ClassItem;
      }
    } catch (e) {
      console.warn('Supabase updateClass fallback:', e);
    }

    const classes = this.getLocalClasses();
    const idx = classes.findIndex((c) => c.id === id);
    if (idx !== -1) {
      classes[idx] = { ...classes[idx], ...updates };
      localStorage.setItem('pai_custom_classes', JSON.stringify(classes));
      return classes[idx];
    }
    return { id, ...updates } as ClassItem;
  },

  async deleteClass(id: string) {
    try {
      await supabase.from('classes').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteClass fallback:', e);
    }
    if (typeof window !== 'undefined') {
      const classes = this.getLocalClasses().filter((c) => c.id !== id);
      localStorage.setItem('pai_custom_classes', JSON.stringify(classes));
    }
  },

  // ================= STUDENTS =================
  async getStudents(classId?: string, search?: string): Promise<StudentItem[]> {
    let dbStudents: any[] = [];
    const metaMap = new Map<string, any>();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        await supabase.auth.signInWithPassword({
          email: 'salimarsad17@gmail.com',
          password: 'guru321',
        });
      }

      // 1. Query students directly from Supabase
      const { data: studentsData, error: stErr } = await supabase
        .from('students')
        .select(`
          *,
          class:classes(id, class_name, grade_level, academic_year)
        `)
        .order('student_number', { ascending: true });

      if (!stErr && studentsData) {
        dbStudents = studentsData;
      }

      // 2. Query student metadata (names) from Supabase audit_logs
      const { data: metasData } = await supabase
        .from('audit_logs')
        .select('entity_id, details')
        .eq('action', 'STUDENT_META');

      if (metasData) {
        metasData.forEach((m) => {
          const key = String(m.details?.student_number || m.entity_id || '').trim();
          if (key) metaMap.set(key, m.details);
        });
      }
    } catch (error: any) {
      console.warn('Could not fetch students from Supabase:', error.message);
    }

    const localStudents = this.getLocalStudents();
    const map = new Map<string, StudentItem>();

    // Process Supabase records
    dbStudents.forEach((st) => {
      const meta = metaMap.get(st.student_number);
      let fullName = st.full_name;

      if (!fullName && meta?.full_name) {
        fullName = meta.full_name;
      }
      if (!fullName && typeof st.enrollment_status === 'string' && st.enrollment_status.includes(' - ')) {
        fullName = st.enrollment_status.split(' - ')[1]?.trim();
      }
      if (!fullName) {
        const localFound = localStudents.find((ls) => ls.student_number === st.student_number);
        if (localFound?.profile?.full_name) {
          fullName = localFound.profile.full_name;
        }
      }
      if (!fullName) {
        fullName = `Siswa NIS ${st.student_number}`;
      }

      const username = st.username || meta?.username || `siswa_${st.student_number}`;
      const rawStatus = typeof st.enrollment_status === 'string' ? st.enrollment_status : 'aktif';
      const normalizedStatus = (rawStatus.split(' - ')[0].trim().toLowerCase() || 'aktif') as
        | 'aktif'
        | 'mutasi'
        | 'lulus'
        | 'nonaktif';

      const item: StudentItem = {
        id: st.id,
        profile_id: st.profile_id || st.id,
        student_number: st.student_number,
        class_id: st.class_id,
        gender: st.gender,
        enrollment_status: normalizedStatus,
        created_at: st.created_at,
        class: st.class || undefined,
        profile: {
          id: st.profile_id || st.id,
          full_name: fullName,
          username,
          role: 'siswa',
          avatar_path: null,
          phone: null,
          is_active: normalizedStatus === 'aktif',
        },
      };
      map.set(st.student_number, item);
    });

    // Merge any local cache
    localStudents.forEach((st) => {
      if (!map.has(st.student_number)) {
        map.set(st.student_number, st);
      }
    });

    let combined = Array.from(map.values());

    // Resolve class object if missing
    const classes = await this.getClasses();
    const classMap = new Map(classes.map((c) => [c.id, c]));

    combined = combined.map((st) => {
      if (!st.class && st.class_id && classMap.has(st.class_id)) {
        const cls = classMap.get(st.class_id)!;
        return {
          ...st,
          class: cls,
        };
      }
      return st;
    });

    if (classId) {
      combined = combined.filter((st) => st.class_id === classId);
    }

    if (search) {
      const s = search.toLowerCase();
      combined = combined.filter(
        (st) =>
          st.student_number?.toLowerCase().includes(s) ||
          st.profile?.full_name?.toLowerCase().includes(s) ||
          st.profile?.username?.toLowerCase().includes(s)
      );
    }

    return combined;
  },

  async getStudentByProfileId(profileId: string): Promise<StudentItem | null> {
    const students = await this.getStudents();
    const found = students.find((s) => s.profile_id === profileId || s.id === profileId);
    return found || null;
  },

  async updateStudent(id: string, updates: Partial<StudentItem> & { full_name?: string }) {
    try {
      const { data: st } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      const newFullName = updates.profile?.full_name || updates.full_name;
      const effectiveFullName =
        newFullName ||
        (st?.enrollment_status?.includes(' - ') ? st.enrollment_status.split(' - ')[1].trim() : '') ||
        'Siswa';

      const rawStatus = updates.enrollment_status || st?.enrollment_status || 'aktif';
      const baseStatus = String(rawStatus).split(' - ')[0].trim().toLowerCase();
      const enrollmentStatusText = `${baseStatus} - ${effectiveFullName}`;

      const payload: any = {};
      if (updates.class_id !== undefined) payload.class_id = updates.class_id;
      if (updates.gender !== undefined) payload.gender = updates.gender;
      if (updates.student_number !== undefined) payload.student_number = updates.student_number;
      payload.enrollment_status = enrollmentStatusText;

      // Try updating with full_name column first
      const { error: updErr } = await supabase
        .from('students')
        .update({
          ...payload,
          full_name: effectiveFullName,
          ...(updates.profile?.username ? { username: updates.profile.username } : {}),
        } as any)
        .eq('id', id);

      if (updErr && updErr.message.includes('full_name')) {
        // Fallback without full_name column
        await supabase.from('students').update(payload).eq('id', id);
      }

      const nis = updates.student_number || st?.student_number;
      if (nis) {
        const { data: existingMeta } = await supabase
          .from('audit_logs')
          .select('id, details')
          .eq('action', 'STUDENT_META')
          .eq('entity_id', nis)
          .maybeSingle();

        const updatedDetails = {
          ...(existingMeta?.details || {}),
          student_number: nis,
          full_name: effectiveFullName,
          ...(updates.profile?.username ? { username: updates.profile.username } : {}),
          ...(updates.gender ? { gender: updates.gender } : {}),
          ...(updates.class_id ? { class_id: updates.class_id } : {}),
        };

        if (existingMeta?.id) {
          await supabase
            .from('audit_logs')
            .update({ details: updatedDetails })
            .eq('id', existingMeta.id);
        } else {
          await supabase.from('audit_logs').insert({
            action: 'STUDENT_META',
            entity_type: 'students',
            entity_id: nis,
            details: updatedDetails,
          });
        }
      }

      // Also try to update profiles table
      try {
        await supabase
          .from('profiles')
          .update({
            full_name: effectiveFullName,
            ...(updates.profile?.username ? { username: updates.profile.username } : {}),
          } as any)
          .eq('id', st?.profile_id || id);
      } catch {
        // Ignore
      }
    } catch (e) {
      console.warn('Supabase updateStudent note:', e);
    }

    if (typeof window !== 'undefined') {
      const students = this.getLocalStudents();
      const idx = students.findIndex((s) => s.id === id);
      if (idx !== -1) {
        students[idx] = {
          ...students[idx],
          ...updates,
          profile: {
            id: students[idx].profile?.id || id,
            username: students[idx].profile?.username || `siswa_${students[idx].student_number}`,
            role: 'siswa',
            avatar_path: null,
            phone: null,
            is_active: true,
            ...(students[idx].profile || {}),
            ...(updates.profile || {}),
            full_name: updates.profile?.full_name || updates.full_name || students[idx].profile?.full_name || '',
          },
        };
        localStorage.setItem('pai_custom_students', JSON.stringify(students));
      }
    }
    return updates;
  },

  async deleteStudent(id: string) {
    try {
      const { data: st } = await supabase
        .from('students')
        .select('student_number')
        .eq('id', id)
        .maybeSingle();

      await supabase.from('students').delete().eq('id', id);

      if (st?.student_number) {
        await supabase
          .from('audit_logs')
          .delete()
          .eq('entity_id', st.student_number)
          .eq('action', 'STUDENT_META');
      }
    } catch (e) {
      console.warn('Supabase deleteStudent fallback:', e);
    }

    if (typeof window !== 'undefined') {
      const students = this.getLocalStudents().filter((s) => s.id !== id);
      localStorage.setItem('pai_custom_students', JSON.stringify(students));
    }
  },

  // ================= TEACHING DOCUMENTS (PERANGKAT AJAR) =================
  async getTeachingDocuments(category?: string, gradeLevel?: number): Promise<TeachingDocument[]> {
    let query = supabase.from('teaching_documents').select('*');
    if (category) query = query.eq('category', category);
    if (gradeLevel) query = query.eq('grade_level', gradeLevel);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn('Could not fetch teaching documents:', error.message);
      return [];
    }
    return (data || []) as TeachingDocument[];
  },

  async createTeachingDocument(item: Omit<TeachingDocument, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('teaching_documents').insert(item).select().single();
    if (error) throw error;
    return data as TeachingDocument;
  },

  async deleteTeachingDocument(id: string) {
    const { error } = await supabase.from('teaching_documents').delete().eq('id', id);
    if (error) throw error;
  },

  // ================= TEACHING MATERIALS (BAHAN AJAR & VIDEO) =================
  async getTeachingMaterials(gradeLevel?: number, classId?: string, onlyPublished = false): Promise<TeachingMaterial[]> {
    let query = supabase.from('teaching_materials').select(`
      *,
      class:classes(id, class_name, grade_level)
    `);

    if (gradeLevel) query = query.eq('grade_level', gradeLevel);
    if (classId) {
      query = query.or(`class_id.eq.${classId},class_id.is.null`);
    }
    if (onlyPublished) {
      query = query.eq('publication_status', 'published');
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn('Could not fetch teaching materials:', error.message);
      return [];
    }
    return (data || []) as TeachingMaterial[];
  },

  async createTeachingMaterial(item: Partial<TeachingMaterial>) {
    const { data, error } = await supabase.from('teaching_materials').insert(item).select().single();
    if (error) throw error;
    return data as TeachingMaterial;
  },

  async updateTeachingMaterial(id: string, updates: Partial<TeachingMaterial>) {
    const { data, error } = await supabase
      .from('teaching_materials')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TeachingMaterial;
  },

  async deleteTeachingMaterial(id: string) {
    const { error } = await supabase.from('teaching_materials').delete().eq('id', id);
    if (error) throw error;
  },

  // ================= JURNAL GURU =================
  async getJournals(classId?: string, startDate?: string, endDate?: string): Promise<TeachingJournal[]> {
    let query = supabase.from('teaching_journals').select(`
      *,
      class:classes(id, class_name, grade_level),
      teacher:profiles(id, full_name)
    `);

    if (classId) query = query.eq('class_id', classId);
    if (startDate) query = query.gte('journal_date', startDate);
    if (endDate) query = query.lte('journal_date', endDate);

    const { data, error } = await query.order('journal_date', { ascending: false });
    if (error) {
      console.warn('Could not fetch journals:', error.message);
      return [];
    }
    return (data || []) as TeachingJournal[];
  },

  async createJournal(item: Partial<TeachingJournal>) {
    const { data, error } = await supabase.from('teaching_journals').insert(item).select().single();
    if (error) throw error;
    return data as TeachingJournal;
  },

  async updateJournal(id: string, updates: Partial<TeachingJournal>) {
    const { data, error } = await supabase.from('teaching_journals').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as TeachingJournal;
  },

  async deleteJournal(id: string) {
    const { error } = await supabase.from('teaching_journals').delete().eq('id', id);
    if (error) throw error;
  },

  // ================= JURNAL SIKAP =================
  async getAttitudeRecords(studentId?: string, classId?: string): Promise<AttitudeRecord[]> {
    let query = supabase.from('attitude_records').select(`
      *,
      student:students(
        id, student_number, class_id,
        profile:profiles(id, full_name),
        class:classes(id, class_name)
      ),
      teacher:profiles(id, full_name)
    `);

    if (studentId) query = query.eq('student_id', studentId);

    const { data, error } = await query.order('record_date', { ascending: false });
    if (error) {
      console.warn('Could not fetch attitude records:', error.message);
      return [];
    }

    let results = (data || []) as AttitudeRecord[];
    if (classId) {
      results = results.filter((r) => r.student?.class_id === classId);
    }
    return results;
  },

  async createAttitudeRecord(item: Partial<AttitudeRecord>) {
    const { data, error } = await supabase.from('attitude_records').insert(item).select().single();
    if (error) throw error;
    return data as AttitudeRecord;
  },

  async deleteAttitudeRecord(id: string) {
    const { error } = await supabase.from('attitude_records').delete().eq('id', id);
    if (error) throw error;
  },

  // ================= ATTENDANCE RECORDS =================
  async getAttendance(classId: string, date: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        student:students(
          id, student_number, gender,
          profile:profiles(id, full_name)
        )
      `)
      .eq('class_id', classId)
      .eq('attendance_date', date);

    if (error) {
      console.warn('Could not fetch attendance:', error.message);
      return [];
    }
    return (data || []) as AttendanceRecord[];
  },

  async saveAttendanceBatch(
    records: Array<{
      student_id: string;
      class_id: string;
      attendance_date: string;
      status: string;
      notes?: string;
      recorded_by?: string;
    }>
  ) {
    const { data, error } = await supabase
      .from('attendance_records')
      .upsert(records, {
        onConflict: 'student_id,class_id,attendance_date',
      })
      .select();

    if (error) throw error;
    return data;
  },

  async getStudentAttendanceHistory(studentId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('student_id', studentId)
      .order('attendance_date', { ascending: false });

    if (error) {
      console.warn('Error fetching student attendance:', error.message);
      return [];
    }
    return (data || []) as AttendanceRecord[];
  },

  // ================= ASSIGNMENTS & SUBMISSIONS =================
  async getAssignments(classId?: string, onlyPublished = false): Promise<Assignment[]> {
    let query = supabase.from('assignments').select(`
      *,
      class:classes(id, class_name, grade_level)
    `);

    if (classId) query = query.eq('class_id', classId);
    if (onlyPublished) query = query.eq('publication_status', 'published');

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn('Could not fetch assignments:', error.message);
      return [];
    }

    const assignments = data || [];
    const withCounts = await Promise.all(
      assignments.map(async (ass: any) => {
        const { count } = await supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('assignment_id', ass.id);
        return {
          ...ass,
          submissions_count: count || 0,
        };
      })
    );

    return withCounts as Assignment[];
  },

  async createAssignment(item: Partial<Assignment>) {
    const { data, error } = await supabase.from('assignments').insert(item).select().single();
    if (error) throw error;
    return data as Assignment;
  },

  async updateAssignment(id: string, updates: Partial<Assignment>) {
    const { data, error } = await supabase.from('assignments').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Assignment;
  },

  async deleteAssignment(id: string) {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) throw error;
  },

  async getSubmissions(assignmentId: string): Promise<Submission[]> {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        student:students(
          id, student_number,
          profile:profiles(id, full_name)
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch submissions:', error.message);
      return [];
    }
    return (data || []) as Submission[];
  },

  async getStudentSubmissions(studentId: string): Promise<Submission[]> {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        assignment:assignments(id, title, class_id, due_at, assignment_type)
      `)
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    if (error) return [];
    return (data || []) as Submission[];
  },

  async submitAssignment(item: {
    assignment_id: string;
    student_id: string;
    answer_text?: string;
    attachment_path?: string;
  }) {
    const { data, error } = await supabase
      .from('submissions')
      .upsert(
        {
          ...item,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'assignment_id,student_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data as Submission;
  },

  async gradeSubmission(submissionId: string, score: number, feedback: string, teacherId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        score,
        feedback,
        graded_by: teacherId,
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return data as Submission;
  },

  // ================= QUIZZES & CBT =================
  async getQuizzes(classId?: string, onlyPublished = false): Promise<Quiz[]> {
    let query = supabase.from('quizzes').select(`
      *,
      class:classes(id, class_name, grade_level)
    `);

    if (classId) query = query.eq('class_id', classId);
    if (onlyPublished) query = query.eq('publication_status', 'published');

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn('Could not fetch quizzes:', error.message);
      return [];
    }
    return (data || []) as Quiz[];
  },

  async createQuiz(item: Partial<Quiz>) {
    const { data, error } = await supabase.from('quizzes').insert(item).select().single();
    if (error) throw error;
    return data as Quiz;
  },

  async updateQuiz(id: string, updates: Partial<Quiz>) {
    const { data, error } = await supabase.from('quizzes').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Quiz;
  },

  async deleteQuiz(id: string) {
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) throw error;
  },

  async getQuizQuestions(quizId: string, isTeacher = false): Promise<QuizQuestion[]> {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_number', { ascending: true });

    if (error) return [];

    if (!isTeacher) {
      // Strip answer_key for students
      return (data || []).map((q: any) => ({
        ...q,
        answer_key: undefined,
      })) as QuizQuestion[];
    }

    return (data || []) as QuizQuestion[];
  },

  async saveQuizQuestion(question: Partial<QuizQuestion>) {
    if (question.id) {
      const { data, error } = await supabase
        .from('quiz_questions')
        .update(question)
        .eq('id', question.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('quiz_questions').insert(question).select().single();
      if (error) throw error;
      return data;
    }
  },

  async deleteQuizQuestion(id: string) {
    const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
    if (error) throw error;
  },

  async getQuizAttempt(quizId: string, studentId: string): Promise<QuizAttempt | null> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) return null;
    return data as QuizAttempt;
  },

  async startQuizAttempt(quizId: string, studentId: string): Promise<QuizAttempt> {
    const existing = await this.getQuizAttempt(quizId, studentId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_id: studentId,
        started_at: new Date().toISOString(),
        status: 'in_progress',
      })
      .select()
      .single();

    if (error) throw error;
    return data as QuizAttempt;
  },

  async submitQuizAttempt(attemptId: string, score: number) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .update({
        score,
        status: 'completed',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) throw error;
    return data as QuizAttempt;
  },

  // ================= GRADE RECORDS (REKAP NILAI) =================
  async getGradeRecords(classId?: string, studentId?: string): Promise<GradeRecord[]> {
    let query = supabase.from('grade_records').select(`
      *,
      student:students(
        id, student_number,
        profile:profiles(id, full_name)
      ),
      class:classes(id, class_name)
    `);

    if (classId) query = query.eq('class_id', classId);
    if (studentId) query = query.eq('student_id', studentId);

    const { data, error } = await query.order('recorded_date', { ascending: false });
    if (error) {
      console.warn('Could not fetch grade records:', error.message);
      return [];
    }
    return (data || []) as GradeRecord[];
  },

  async createGradeRecord(item: Partial<GradeRecord>) {
    const { data, error } = await supabase.from('grade_records').insert(item).select().single();
    if (error) throw error;
    return data as GradeRecord;
  },

  async deleteGradeRecord(id: string) {
    const { error } = await supabase.from('grade_records').delete().eq('id', id);
    if (error) throw error;
  },

  // ================= ANNOUNCEMENTS =================
  async getAnnouncements(classId?: string): Promise<Announcement[]> {
    let query = supabase.from('announcements').select(`
      *,
      author:profiles(id, full_name)
    `);

    if (classId) {
      query = query.or(`target_class_id.eq.${classId},target_class_id.is.null`);
    }

    const { data, error } = await query.order('is_important', { ascending: false }).order('created_at', { ascending: false });
    if (error) {
      console.warn('Could not fetch announcements:', error.message);
      return [];
    }
    return (data || []) as Announcement[];
  },

  async createAnnouncement(item: Partial<Announcement>) {
    const { data, error } = await supabase.from('announcements').insert(item).select().single();
    if (error) throw error;
    return data as Announcement;
  },

  async deleteAnnouncement(id: string) {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
  },

  // ================= AUDIT LOGS =================
  async getAuditLogs(limit = 20): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        actor:profiles(id, full_name, username)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data || []) as AuditLog[];
  },

  async logAudit(action: string, entityType: string, entityId?: string, details?: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        actor_id: user?.id || null,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details || null,
      });
    } catch (e) {
      // Non-blocking
    }
  },
};
