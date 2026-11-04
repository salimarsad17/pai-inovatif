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
import { DEFAULT_TEACHING_DOCUMENTS } from '../data/defaultTeachingDocuments';
import { documentStorage } from './documentStorage';

// Fast timeout utility to prevent any network latency from freezing the UI
export async function withTimeout<T>(promise: Promise<T>, ms = 2500, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return result;
  } catch {
    clearTimeout(timer);
    return fallback;
  }
}

// In-memory cache for sub-millisecond page switching & instant response
const memoryCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL_MS = 25000; // 25 seconds cache

function getCached<T>(key: string): T | null {
  const entry = memoryCache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
  return entry.data as T;
}

function setCached(key: string, data: any) {
  memoryCache[key] = { data, timestamp: Date.now() };
}

function clearCache(prefix?: string) {
  if (!prefix) {
    Object.keys(memoryCache).forEach((k) => delete memoryCache[k]);
  } else {
    Object.keys(memoryCache).forEach((k) => {
      if (k.startsWith(prefix)) delete memoryCache[k];
    });
  }
}

export const dataService = {
  withTimeout,
  // Clear cache helper for manual refresh
  clearDataCache(prefix?: string) {
    clearCache(prefix);
  },

  // ================= SCHOOL SETTINGS =================
  async getSchoolSettings(): Promise<SchoolSettings> {
    const cached = getCached<SchoolSettings>('school_settings');
    if (cached) return cached;

    const defaultSettings: SchoolSettings = {
      school_name: 'UPT SMPN 2 Rebang Tangkas',
      school_address: 'Jl. Rebang Tangkas, Kec. Rebang Tangkas, Kab. Way Kanan, Lampung',
      academic_year: '2025/2026',
      semester: 'Ganjil',
      motto: 'Guru Kreatif, Siswa Aktif',
      headmaster_name: 'H. Ahmad Fauzi, S.Ag., M.Pd.',
    };

    // Check localStorage first for instant response
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('pai_school_settings');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed?.school_name) {
            setCached('school_settings', parsed);
            // Revalidate in background without blocking
            this._fetchRemoteSettings();
            return parsed;
          }
        }
      } catch {}
    }

    const res = await withTimeout(
      (async () => {
        try {
          const { data, error } = await supabase
            .from('school_settings')
            .select('*')
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            return data as SchoolSettings;
          }
        } catch {}
        return defaultSettings;
      })(),
      2000,
      defaultSettings
    );

    setCached('school_settings', res);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pai_school_settings', JSON.stringify(res));
    }
    return res;
  },

  async _fetchRemoteSettings() {
    try {
      const { data, error } = await supabase.from('school_settings').select('*').limit(1).maybeSingle();
      if (!error && data) {
        setCached('school_settings', data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('pai_school_settings', JSON.stringify(data));
        }
      }
    } catch {}
  },

  async updateSchoolSettings(settings: Partial<SchoolSettings>) {
    clearCache('school_settings');
    const { data: existing } = await supabase.from('school_settings').select('id').limit(1).maybeSingle();
    let res: any;
    if (existing?.id) {
      const { data, error } = await supabase
        .from('school_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      res = data;
    } else {
      const { data, error } = await supabase
        .from('school_settings')
        .insert({ ...settings, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      res = data;
    }
    if (res && typeof window !== 'undefined') {
      localStorage.setItem('pai_school_settings', JSON.stringify(res));
      setCached('school_settings', res);
    }
    return res;
  },

  // ================= TEACHER METRICS (PROFIL PENGGUNA) =================
  getTeacherCount(): number {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pai_total_teachers');
      if (saved) return Math.max(1, parseInt(saved, 10));
    }
    return 1;
  },

  async fetchTeacherCount(): Promise<number> {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pai_total_teachers');
      if (saved) return Math.max(1, parseInt(saved, 10));
    }
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'guru');
      if (!error && count && count > 0) {
        return count;
      }
    } catch {}
    return 1;
  },

  saveTeacherCount(count: number) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pai_total_teachers', String(Math.max(1, count)));
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
    const cached = getCached<ClassItem[]>('classes');
    if (cached) return cached;

    const defaultClasses: ClassItem[] = [
      { id: '3e99450a-dca2-4a58-a83c-5d1a20737dea', class_name: 'VII A', grade_level: 7, academic_year: '2025/2026', students_count: 0 },
      { id: '26202a8c-b677-4314-8916-b706acbcd7ca', class_name: 'VII B', grade_level: 7, academic_year: '2025/2026', students_count: 0 },
      { id: 'b8f745cd-259a-4faa-84a0-c9b3ade197d1', class_name: 'VIII A', grade_level: 8, academic_year: '2025/2026', students_count: 0 },
      { id: 'a19314d1-4cb4-401b-b8e6-d21490f46e78', class_name: 'VIII B', grade_level: 8, academic_year: '2025/2026', students_count: 0 },
      { id: '5d94ba8d-778c-4e1c-9a8c-0e10fd6db5f9', class_name: 'IX A', grade_level: 9, academic_year: '2025/2026', students_count: 0 },
      { id: '3230bdbc-d4b1-48d5-b6a0-d90a6f99038e', class_name: 'IX B', grade_level: 9, academic_year: '2025/2026', students_count: 0 },
    ];

    const localClasses = this.getLocalClasses();
    const fallbackList = localClasses.length > 0 ? localClasses : defaultClasses;

    const fetchClassesPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select(`
            *,
            homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(id, full_name, username)
          `)
          .order('grade_level', { ascending: true })
          .order('class_name', { ascending: true });

        if (!error && data && data.length > 0) {
          return data as ClassItem[];
        }
      } catch (e: any) {
        console.warn('Could not fetch classes from Supabase:', e?.message);
      }
      return [];
    })();

    const dbClasses = await withTimeout(fetchClassesPromise, 2000, []);

    let merged: ClassItem[] = [];
    if (dbClasses.length > 0) {
      merged = [...dbClasses];
      localClasses.forEach((lc) => {
        if (!merged.some((m) => m.id === lc.id || m.class_name.toLowerCase() === lc.class_name.toLowerCase())) {
          merged.push(lc);
        }
      });
    } else {
      merged = [...fallbackList];
    }

    // Attach student counts using localStudents in memory (sub-millisecond)
    const localStudents = this.getLocalStudents();
    const result = merged.map((cls) => {
      const localCount = localStudents.filter((st) => st.class_id === cls.id).length;
      return {
        ...cls,
        students_count: Math.max(cls.students_count || 0, localCount),
      };
    });

    setCached('classes', result);
    return result;
  },

  async createClass(item: { class_name: string; grade_level: number; academic_year: string; homeroom_teacher_id?: string | null }) {
    clearCache('classes');
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
    clearCache('classes');
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
    clearCache('classes');
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
    const cachedAll = getCached<StudentItem[]>('students_all');
    let combined: StudentItem[] = [];

    if (cachedAll) {
      combined = cachedAll;
    } else {
      let dbStudents: any[] = [];
      const metaMap = new Map<string, any>();

      const fetchStudentsPromise = (async () => {
        try {
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
          console.warn('Could not fetch students from Supabase:', error?.message);
        }
      })();

      await withTimeout(fetchStudentsPromise, 2500, undefined);

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

      // Merge local cache
      localStudents.forEach((st) => {
        if (!map.has(st.student_number)) {
          map.set(st.student_number, st);
        }
      });

      combined = Array.from(map.values());

      // Resolve class object if missing from cache
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

      setCached('students_all', combined);
    }

    let filtered = combined;
    if (classId) {
      filtered = filtered.filter((st) => st.class_id === classId);
    }

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (st) =>
          st.student_number?.toLowerCase().includes(s) ||
          st.profile?.full_name?.toLowerCase().includes(s) ||
          st.profile?.username?.toLowerCase().includes(s)
      );
    }

    return filtered;
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
    clearCache('students_all');
    clearCache('classes');
    return updates;
  },

  async deleteStudent(id: string) {
    clearCache('students_all');
    clearCache('classes');
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
  getLocalTeachingDocuments(): TeachingDocument[] {
    if (typeof window === 'undefined') return DEFAULT_TEACHING_DOCUMENTS;
    try {
      const stored = localStorage.getItem('pai_custom_teaching_docs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_TEACHING_DOCUMENTS;
  },

  saveLocalTeachingDocument(item: TeachingDocument) {
    if (typeof window === 'undefined') return;
    try {
      const list = this.getLocalTeachingDocuments();
      // Strip heavy file_data from localStorage; it is stored in IndexedDB via documentStorage
      const sanitizedItem = { ...item };
      delete sanitizedItem.file_data;

      const idx = list.findIndex((d) => d.id === item.id);
      if (idx >= 0) {
        list[idx] = sanitizedItem;
      } else {
        list.unshift(sanitizedItem);
      }
      localStorage.setItem('pai_custom_teaching_docs', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed saving local teaching document to localStorage:', e);
    }
  },

  deleteLocalTeachingDocument(id: string) {
    if (typeof window === 'undefined') return;
    const list = this.getLocalTeachingDocuments().filter((d) => d.id !== id);
    localStorage.setItem('pai_custom_teaching_docs', JSON.stringify(list));
    documentStorage.deleteFile(id).catch(() => {});
  },

  async getTeachingDocuments(category?: string, gradeLevel?: number): Promise<TeachingDocument[]> {
    const cacheKey = `teaching_docs_${category || 'all'}_${gradeLevel || 'all'}`;
    const cached = getCached<TeachingDocument[]>(cacheKey);
    if (cached) return cached;

    const fetchPromise = (async () => {
      let dbDocs: TeachingDocument[] = [];
      try {
        let query = supabase.from('teaching_documents').select('*');
        if (category) query = query.eq('category', category);
        if (gradeLevel) query = query.eq('grade_level', gradeLevel);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) {
          dbDocs = data as TeachingDocument[];
        }
      } catch (err: any) {
        console.warn('Fetch teaching documents timeout/error:', err?.message);
      }

      // Merge with local documents
      const localDocs = this.getLocalTeachingDocuments();
      let combined = [...dbDocs];
      localDocs.forEach((ld) => {
        if (!combined.some((cd) => cd.id === ld.id)) {
          combined.push(ld);
        }
      });

      // Filter
      let filtered = combined;
      if (category) filtered = filtered.filter((d) => d.category === category);
      if (gradeLevel && gradeLevel > 0) filtered = filtered.filter((d) => d.grade_level === gradeLevel);

      return filtered;
    })();

    const result = await withTimeout(fetchPromise, 2500, this.getLocalTeachingDocuments());
    setCached(cacheKey, result);
    return result;
  },

  async createTeachingDocument(item: Omit<TeachingDocument, 'id' | 'created_at' | 'updated_at'> & { id?: string }) {
    clearCache('teaching_docs');
    const newId = item.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullDoc: TeachingDocument = {
      ...item,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store large file data in IndexedDB to preserve localStorage quota
    if (item.file_data) {
      await documentStorage.saveFile(newId, item.file_data);
    }

    // Try Supabase insert
    try {
      const sanitized = { ...fullDoc };
      delete (sanitized as any).file_data; // Avoid payload size limits on basic postgres table
      await supabase.from('teaching_documents').insert(sanitized);
    } catch (e: any) {
      console.warn('Supabase createTeachingDocument fallback:', e?.message);
    }

    // Save locally
    this.saveLocalTeachingDocument(fullDoc);
    return fullDoc;
  },

  async deleteTeachingDocument(id: string) {
    clearCache('teaching_docs');
    try {
      await supabase.from('teaching_documents').delete().eq('id', id);
    } catch (error) {
      console.warn('Supabase deleteTeachingDocument fallback:', error);
    }
    this.deleteLocalTeachingDocument(id);
  },

  // ================= TEACHING MATERIALS (BAHAN AJAR & VIDEO) =================
  async getTeachingMaterials(gradeLevel?: number, classId?: string, onlyPublished = false): Promise<TeachingMaterial[]> {
    const cacheKey = `materials_${gradeLevel || 'all'}_${classId || 'all'}_${onlyPublished}`;
    const cached = getCached<TeachingMaterial[]>(cacheKey);
    if (cached) return cached;

    const fetchPromise = (async () => {
      try {
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
      } catch (err: any) {
        console.warn('Fetch teaching materials timeout/error:', err?.message);
        return [];
      }
    })();

    const result = await withTimeout(fetchPromise, 2500, []);
    setCached(cacheKey, result);
    return result;
  },

  async createTeachingMaterial(item: Partial<TeachingMaterial>) {
    clearCache('materials');
    const { data, error } = await supabase.from('teaching_materials').insert(item).select().single();
    if (error) throw error;
    return data as TeachingMaterial;
  },

  async updateTeachingMaterial(id: string, updates: Partial<TeachingMaterial>) {
    clearCache('materials');
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
    clearCache('materials');
    const { error } = await supabase.from('teaching_materials').delete().eq('id', id);
    if (error) throw error;
  },

  // ================= JURNAL GURU =================
  getLocalJournals(): TeachingJournal[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('pai_custom_journals');
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore
    }
    return [];
  },

  saveLocalJournal(item: TeachingJournal) {
    if (typeof window === 'undefined') return;
    const list = this.getLocalJournals();
    const idx = list.findIndex((j) => j.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem('pai_custom_journals', JSON.stringify(list));
  },

  deleteLocalJournal(id: string) {
    if (typeof window === 'undefined') return;
    const list = this.getLocalJournals().filter((j) => j.id !== id);
    localStorage.setItem('pai_custom_journals', JSON.stringify(list));
  },

  _parseJournal(jrn: any): TeachingJournal {
    let teaching_hour = jrn.teaching_hour || '';
    let attendance_h = jrn.attendance_h !== undefined ? jrn.attendance_h : 28;
    let attendance_s = jrn.attendance_s ?? 0;
    let attendance_i = jrn.attendance_i ?? 0;
    let attendance_a = jrn.attendance_a ?? 0;
    let notes = jrn.notes || '';
    let reflection = jrn.reflection || '';

    // If metadata encoded in reflection
    if (reflection && reflection.includes('[JRN_META:')) {
      const match = reflection.match(/\[JRN_META:(\{.*?\})\]/);
      if (match) {
        try {
          const meta = JSON.parse(match[1]);
          if (!teaching_hour && meta.jam) teaching_hour = meta.jam;
          if (meta.h !== undefined) attendance_h = meta.h;
          if (attendance_s === undefined || attendance_s === 0) attendance_s = meta.s ?? 0;
          if (attendance_i === undefined || attendance_i === 0) attendance_i = meta.i ?? 0;
          if (attendance_a === undefined || attendance_a === 0) attendance_a = meta.a ?? 0;
          if (!notes && meta.ket) notes = meta.ket;
          reflection = reflection.replace(/\[JRN_META:(\{.*?\})\]/, '').trim();
        } catch {
          // Ignore
        }
      }
    }

    if (!teaching_hour) teaching_hour = 'Jam 1 - 2 (07.30 - 08.50)';
    if (!notes) {
      notes = [reflection, jrn.obstacles, jrn.follow_up].filter(Boolean).join(' | ') || 'KBM terlaksana dengan baik dan tertib';
    }

    return {
      ...jrn,
      teaching_hour,
      attendance_h,
      attendance_s,
      attendance_i,
      attendance_a,
      notes,
      reflection,
    };
  },

  async getJournals(classId?: string, startDate?: string, endDate?: string): Promise<TeachingJournal[]> {
    const cacheKey = `journals_${classId || 'all'}_${startDate || 'all'}_${endDate || 'all'}`;
    const cached = getCached<TeachingJournal[]>(cacheKey);
    if (cached) return cached;

    const fetchPromise = (async () => {
      let dbJournals: TeachingJournal[] = [];
      try {
        let query = supabase.from('teaching_journals').select(`
          *,
          class:classes(id, class_name, grade_level),
          teacher:profiles(id, full_name)
        `);

        if (classId) query = query.eq('class_id', classId);
        if (startDate) query = query.gte('journal_date', startDate);
        if (endDate) query = query.lte('journal_date', endDate);

        const { data, error } = await query.order('journal_date', { ascending: false });
        if (!error && data) {
          dbJournals = data.map((item: any) => this._parseJournal(item));
        }
      } catch (e: any) {
        console.warn('Could not fetch journals from Supabase:', e.message);
      }

      // Combine with local journals
      const localJournals = this.getLocalJournals().map((item: any) => this._parseJournal(item));
      let combined = [...dbJournals];
      localJournals.forEach((lj) => {
        if (!combined.some((cj) => cj.id === lj.id)) {
          if (!classId || lj.class_id === classId) {
            combined.push(lj);
          }
        }
      });

      // If completely empty, generate sample agenda entries for realistic preview
      if (combined.length === 0) {
        const classes = this.getLocalClasses();
        const c1 = classes[0]?.id || 'cls-7a';
        const c2 = classes[1]?.id || classes[0]?.id || 'cls-7b';
        const sampleJournals: TeachingJournal[] = [
          {
            id: 'sample-jrn-1',
            teacher_id: 'sample-teacher',
            class_id: c1,
            journal_date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
            teaching_hour: 'Jam ke 1 - 2 (07.30 - 08.50)',
            topic: 'Bab 1: Menghadirkan Salat dan Zikir dalam Kehidupan',
            learning_objectives: 'Peserta didik mampu memahami hakikat salat dan zikir untuk ketenteraman jiwa.',
            methods: 'Diskusi Kelompok, Ceramah Interaktif, Tanya Jawab',
            activities: '1. Pembukaan: Tadarus Al-Qur’an QS An-Nisa: 103.\n2. Inti: Analisis dampak zikir terhadap ketenangan hati & diskusi kelompok.\n3. Penutup: Pengambilan kesimpulan bersama & refleksi.',
            attendance_h: 31,
            attendance_s: 1,
            attendance_i: 0,
            attendance_a: 0,
            notes: 'KBM berjalan lancar dan tuntas. 1 siswa sakit (surat terlampir).',
            class: classes[0] || { id: c1, class_name: 'VII A', grade_level: 7, academic_year: '2025/2026' },
          },
          {
            id: 'sample-jrn-2',
            teacher_id: 'sample-teacher',
            class_id: c2,
            journal_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
            teaching_hour: 'Jam ke 3 - 4 (09.05 - 10.25)',
            topic: 'Bab 2: Meneladani Nama dan Sifat Allah untuk Kebaikan Hidup',
            learning_objectives: 'Peserta didik mampu mengamalkan makna Asmaul Husna Al-Alim, Al-Khabir, As-Sami, Al-Bashir.',
            methods: 'Problem Based Learning, Diskusi, Analisis Kasus',
            activities: '1. Pembukaan: Membaca Asmaul Husna bersama.\n2. Inti: Diskusi kelompok menghubungkan sifat Al-Alim dan kejujuran saat ujian.\n3. Penutup: Evaluasi pemahaman mandiri dan tindak lanjut.',
            attendance_h: 31,
            attendance_s: 0,
            attendance_i: 1,
            attendance_a: 0,
            notes: 'Peserta didik sangat antusias. 1 siswa izin menghadiri acara keluarga.',
            class: classes[1] || { id: c2, class_name: 'VII B', grade_level: 7, academic_year: '2025/2026' },
          },
          {
            id: 'sample-jrn-3',
            teacher_id: 'sample-teacher',
            class_id: c1,
            journal_date: new Date().toISOString().slice(0, 10),
            teaching_hour: 'Jam ke 5 - 6 (10.40 - 12.00)',
            topic: 'Praktik Bersuci: Tata Cara Tayammum dan Wudhu Sesuai Sunnah',
            learning_objectives: 'Peserta didik mampu mempraktikkan rukun dan syarat tayammum secara tartil.',
            methods: 'Demonstrasi Langsung, Praktik Berkelompok',
            activities: '1. Pembukaan: Doa bersama dan apersepsi sebab-sebab diperbolehkannya tayammum.\n2. Inti: Demonstrasi tayammum di musala sekolah dan praktik bergantian antarkelompok.\n3. Penutup: Koreksi gerakan dan penilaian performa siswa.',
            attendance_h: 32,
            attendance_s: 0,
            attendance_i: 0,
            attendance_a: 0,
            notes: 'Semua siswa hadir 100%. Target keterampilan wudhu dan tayammum tercapai.',
            class: classes[0] || { id: c1, class_name: 'VII A', grade_level: 7, academic_year: '2025/2026' },
          },
        ];
        return sampleJournals;
      }

      return combined.sort((a, b) => (b.journal_date > a.journal_date ? 1 : -1));
    })();

    const result = await withTimeout(fetchPromise, 2500, []);
    setCached(cacheKey, result);
    return result;
  },

  async createJournal(item: Partial<TeachingJournal>) {
    clearCache('journals');
    const metaTag = `\n[JRN_META:${JSON.stringify({
      jam: item.teaching_hour || '',
      h: item.attendance_h ?? 0,
      s: item.attendance_s ?? 0,
      i: item.attendance_i ?? 0,
      a: item.attendance_a ?? 0,
      ket: item.notes || '',
    })}]`;

    const packedReflection = ((item.reflection || '') + metaTag).trim();

    // 1. Try directly inserting with all fields
    try {
      const { data, error } = await supabase.from('teaching_journals').insert(item).select(`
        *,
        class:classes(id, class_name, grade_level),
        teacher:profiles(id, full_name)
      `).single();
      if (!error && data) {
        const parsed = this._parseJournal(data);
        this.saveLocalJournal(parsed);
        return parsed;
      }
    } catch {
      // Continue to sanitized attempt
    }

    // 2. Try sanitized base fields with metadata in reflection
    try {
      const sanitized = {
        teacher_id: item.teacher_id,
        class_id: item.class_id,
        journal_date: item.journal_date,
        topic: item.topic,
        learning_objectives: item.learning_objectives || item.topic,
        methods: item.methods || '',
        activities: item.activities,
        reflection: packedReflection,
        obstacles: item.obstacles || '',
        follow_up: item.follow_up || '',
      };

      const { data, error } = await supabase.from('teaching_journals').insert(sanitized).select(`
        *,
        class:classes(id, class_name, grade_level),
        teacher:profiles(id, full_name)
      `).single();

      if (!error && data) {
        const parsed = this._parseJournal(data);
        this.saveLocalJournal(parsed);
        return parsed;
      }
    } catch (e: any) {
      console.warn('Supabase createJournal fallback:', e?.message);
    }

    // 3. Local storage fallback
    const newJournal: TeachingJournal = {
      id: `jrn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      teacher_id: item.teacher_id || 'guru-1',
      class_id: item.class_id || '',
      journal_date: item.journal_date || new Date().toISOString().slice(0, 10),
      teaching_hour: item.teaching_hour || 'Jam 1 - 2 (07.30 - 08.50)',
      topic: item.topic || '',
      learning_objectives: item.learning_objectives || '',
      methods: item.methods || '',
      activities: item.activities || '',
      attendance_h: item.attendance_h ?? 0,
      attendance_s: item.attendance_s ?? 0,
      attendance_i: item.attendance_i ?? 0,
      attendance_a: item.attendance_a ?? 0,
      notes: item.notes || '',
      reflection: item.reflection || '',
      obstacles: item.obstacles || '',
      follow_up: item.follow_up || '',
      created_at: new Date().toISOString(),
    };
    this.saveLocalJournal(newJournal);
    return newJournal;
  },

  async updateJournal(id: string, updates: Partial<TeachingJournal>) {
    clearCache('journals');
    const metaTag = `\n[JRN_META:${JSON.stringify({
      jam: updates.teaching_hour || '',
      h: updates.attendance_h ?? 0,
      s: updates.attendance_s ?? 0,
      i: updates.attendance_i ?? 0,
      a: updates.attendance_a ?? 0,
      ket: updates.notes || '',
    })}]`;

    const packedReflection = ((updates.reflection || '') + metaTag).trim();

    try {
      const { data, error } = await supabase.from('teaching_journals').update(updates).eq('id', id).select(`
        *,
        class:classes(id, class_name, grade_level),
        teacher:profiles(id, full_name)
      `).single();
      if (!error && data) {
        const parsed = this._parseJournal(data);
        this.saveLocalJournal(parsed);
        return parsed;
      }
    } catch {
      // Continue
    }

    try {
      const sanitized: any = { ...updates };
      delete sanitized.teaching_hour;
      delete sanitized.attendance_h;
      delete sanitized.attendance_s;
      delete sanitized.attendance_i;
      delete sanitized.attendance_a;
      delete sanitized.notes;
      delete sanitized.class;
      delete sanitized.teacher;
      sanitized.reflection = packedReflection;

      const { data, error } = await supabase.from('teaching_journals').update(sanitized).eq('id', id).select(`
        *,
        class:classes(id, class_name, grade_level),
        teacher:profiles(id, full_name)
      `).single();

      if (!error && data) {
        const parsed = this._parseJournal(data);
        this.saveLocalJournal(parsed);
        return parsed;
      }
    } catch (e: any) {
      console.warn('Supabase updateJournal fallback:', e?.message);
    }

    // Local update
    const list = this.getLocalJournals();
    const idx = list.findIndex((j) => j.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      localStorage.setItem('pai_custom_journals', JSON.stringify(list));
      return list[idx];
    }
    return { id, ...updates } as TeachingJournal;
  },

  async deleteJournal(id: string) {
    clearCache('journals');
    try {
      await supabase.from('teaching_journals').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteJournal fallback:', e);
    }
    this.deleteLocalJournal(id);
  },

  // ================= JURNAL SIKAP =================
  getLocalAttitudeRecords(): AttitudeRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('pai_custom_attitude_records');
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore
    }
    return [];
  },

  saveLocalAttitudeRecord(item: AttitudeRecord) {
    if (typeof window === 'undefined') return;
    const list = this.getLocalAttitudeRecords();
    const idx = list.findIndex((r) => r.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem('pai_custom_attitude_records', JSON.stringify(list));
  },

  deleteLocalAttitudeRecord(id: string) {
    if (typeof window === 'undefined') return;
    const list = this.getLocalAttitudeRecords().filter((r) => r.id !== id);
    localStorage.setItem('pai_custom_attitude_records', JSON.stringify(list));
  },

  async getAttitudeRecords(studentId?: string, classId?: string): Promise<AttitudeRecord[]> {
    const cacheKey = `attitude_${studentId || 'all'}_${classId || 'all'}`;
    const cached = getCached<AttitudeRecord[]>(cacheKey);
    if (cached) return cached;

    const fetchPromise = (async () => {
      let dbRecords: AttitudeRecord[] = [];
      try {
        let query = supabase.from('attitude_records').select(`
          *,
          student:students(
            id, student_number, class_id,
            profile:profiles(id, full_name),
            class:classes(id, class_name, grade_level)
          ),
          teacher:profiles(id, full_name)
        `);

        if (studentId) query = query.eq('student_id', studentId);

        const { data, error } = await query.order('record_date', { ascending: false });
        if (!error && data) {
          dbRecords = data as AttitudeRecord[];
        }
      } catch {
        // Non-blocking
      }

      // Merge with local records
      const localRecords = this.getLocalAttitudeRecords();
      let combined = [...dbRecords];
      localRecords.forEach((lr) => {
        if (!combined.some((cr) => cr.id === lr.id)) {
          combined.push(lr);
        }
      });

      // Filter by student / class if provided
      let filtered = combined;
      if (studentId) {
        filtered = filtered.filter((r) => r.student_id === studentId || r.student?.id === studentId);
      }
      if (classId) {
        filtered = filtered.filter((r) => r.student?.class_id === classId);
      }

      // If completely empty, generate realistic sample records for UPT SMPN 2 Rebang Tangkas
      if (filtered.length === 0 && !studentId) {
        const students = this.getLocalStudents();
        const classes = this.getLocalClasses();
        const s1 = students[0] || {
          id: 'std-sample-1',
          student_number: '202407001',
          class_id: classes[0]?.id || 'cls-7a',
          profile: { id: 'p1', full_name: 'Ahmad Fauzi Ramadhan', username: 'ahmad_fauzi' },
          class: classes[0] || { id: 'cls-7a', class_name: 'VII A', grade_level: 7 },
        };
        const s2 = students[1] || {
          id: 'std-sample-2',
          student_number: '202407002',
          class_id: classes[1]?.id || classes[0]?.id || 'cls-7b',
          profile: { id: 'p2', full_name: 'Nur Aisyah Azzahra', username: 'aisyah_azzahra' },
          class: classes[1] || classes[0] || { id: 'cls-7b', class_name: 'VII B', grade_level: 7 },
        };
        const s3 = students[2] || {
          id: 'std-sample-3',
          student_number: '202407003',
          class_id: classes[0]?.id || 'cls-7a',
          profile: { id: 'p3', full_name: 'Muhammad Rizki Pratama', username: 'rizki_pratama' },
          class: classes[0] || { id: 'cls-7a', class_name: 'VII A', grade_level: 7 },
        };

        const sampleRecords: AttitudeRecord[] = [
          {
            id: 'sample-att-1',
            student_id: s1.id,
            teacher_id: 'sample-teacher',
            record_date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
            category: 'Spiritual',
            description: 'Secara sukarela mengumandangkan adzan Dhuhur tepat waktu di musala sekolah dan memimpin kerapihan shaf jamaah.',
            coaching_notes: 'Beriman, Bertakwa kepada Tuhan YME dan Berakhlak Mulia',
            follow_up: 'Diberikan apresiasi di depan kelas dan ditunjuk sebagai koordinator tadarus.',
            student: s1 as any,
          },
          {
            id: 'sample-att-2',
            student_id: s2.id,
            teacher_id: 'sample-teacher',
            record_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
            category: 'Kejujuran',
            description: 'Menemukan uang tunai di musala sekolah dan langsung menyerahkannya kepada guru piket untuk diumumkan kepada pemiliknya.',
            coaching_notes: 'Kejujuran dan Integritas Diri',
            follow_up: 'Diberikan penghargaan bintang kejujuran sekolah pada apel pagi.',
            student: s2 as any,
          },
          {
            id: 'sample-att-3',
            student_id: s3.id,
            teacher_id: 'sample-teacher',
            record_date: new Date().toISOString().slice(0, 10),
            category: 'Sosial',
            description: 'Membantu teman sekelas yang kesulitan membaca huruf hijaiyah bertajwid dengan sabar saat jam tadarus pagi.',
            coaching_notes: 'Gotong Royong & Kepedulian Sesama (Tolong Menolong)',
            follow_up: 'Diapresiasi dan dijadikan tutor sebaya baca Al-Qur’an di kelas.',
            student: s3 as any,
          },
        ];

        return sampleRecords.filter((r) => !classId || r.student?.class_id === classId);
      }

      return filtered.sort((a, b) => (b.record_date > a.record_date ? 1 : -1));
    })();

    const result = await withTimeout(fetchPromise, 2500, []);
    setCached(cacheKey, result);
    return result;
  },

  async createAttitudeRecord(item: Partial<AttitudeRecord>) {
    clearCache('attitude');

    // 1. Try Supabase
    try {
      const { data, error } = await supabase.from('attitude_records').insert(item).select(`
        *,
        student:students(
          id, student_number, class_id,
          profile:profiles(id, full_name),
          class:classes(id, class_name)
        ),
        teacher:profiles(id, full_name)
      `).single();
      if (!error && data) {
        this.saveLocalAttitudeRecord(data as AttitudeRecord);
        return data as AttitudeRecord;
      }
    } catch {
      // Fallback
    }

    // 2. Local fallback
    const newRecord: AttitudeRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      student_id: item.student_id || '',
      teacher_id: item.teacher_id || 'guru-1',
      record_date: item.record_date || new Date().toISOString().slice(0, 10),
      category: item.category || 'Spiritual',
      description: item.description || '',
      coaching_notes: item.coaching_notes || '',
      follow_up: item.follow_up || '',
      created_at: new Date().toISOString(),
      student: item.student,
    };
    this.saveLocalAttitudeRecord(newRecord);
    return newRecord;
  },

  async updateAttitudeRecord(id: string, updates: Partial<AttitudeRecord>) {
    clearCache('attitude');
    try {
      const { data, error } = await supabase.from('attitude_records').update(updates).eq('id', id).select(`
        *,
        student:students(
          id, student_number, class_id,
          profile:profiles(id, full_name),
          class:classes(id, class_name)
        ),
        teacher:profiles(id, full_name)
      `).single();
      if (!error && data) {
        this.saveLocalAttitudeRecord(data as AttitudeRecord);
        return data as AttitudeRecord;
      }
    } catch {
      // Fallback
    }

    const list = this.getLocalAttitudeRecords();
    const idx = list.findIndex((r) => r.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      localStorage.setItem('pai_custom_attitude_records', JSON.stringify(list));
      return list[idx];
    }
    return { id, ...updates } as AttitudeRecord;
  },

  async deleteAttitudeRecord(id: string) {
    clearCache('attitude');
    try {
      await supabase.from('attitude_records').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteAttitudeRecord fallback:', e);
    }
    this.deleteLocalAttitudeRecord(id);
  },

  // ================= ATTENDANCE RECORDS =================
  getLocalAttendanceRecords(): AttendanceRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('pai_custom_attendance_records');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveLocalAttendanceBatch(
    records: Array<{
      student_id: string;
      class_id: string;
      attendance_date: string;
      status: string;
      notes?: string;
      recorded_by?: string;
    }>
  ) {
    if (typeof window === 'undefined') return;
    try {
      const existing = this.getLocalAttendanceRecords();
      const map = new Map<string, AttendanceRecord>();
      existing.forEach((r) => {
        map.set(`${r.student_id}_${r.attendance_date}`, r);
      });

      records.forEach((rec) => {
        const key = `${rec.student_id}_${rec.attendance_date}`;
        map.set(key, {
          id: map.get(key)?.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          student_id: rec.student_id,
          class_id: rec.class_id,
          attendance_date: rec.attendance_date,
          status: rec.status as any,
          notes: rec.notes || undefined,
          recorded_by: rec.recorded_by || undefined,
          created_at: map.get(key)?.created_at || new Date().toISOString(),
        });
      });

      localStorage.setItem('pai_custom_attendance_records', JSON.stringify(Array.from(map.values())));
    } catch (e) {
      console.warn('Error saving local attendance batch:', e);
    }
  },

  async getAttendance(classId: string, date: string): Promise<AttendanceRecord[]> {
    let remoteRecords: AttendanceRecord[] = [];
    try {
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

      if (!error && data) {
        remoteRecords = data as AttendanceRecord[];
      }
    } catch (err: any) {
      console.warn('Could not fetch attendance from Supabase:', err?.message);
    }

    const local = this.getLocalAttendanceRecords().filter(
      (l) => l.class_id === classId && l.attendance_date === date
    );

    const map = new Map<string, AttendanceRecord>();
    remoteRecords.forEach((r) => map.set(r.student_id, r));
    local.forEach((l) => map.set(l.student_id, l));

    return Array.from(map.values());
  },

  async getAttendanceRange(classId: string, startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    let remoteRecords: AttendanceRecord[] = [];
    try {
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
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);

      if (!error && data) {
        remoteRecords = data as AttendanceRecord[];
      }
    } catch (err: any) {
      console.warn('Could not fetch attendance range:', err?.message);
    }

    const local = this.getLocalAttendanceRecords().filter(
      (l) => l.class_id === classId && l.attendance_date >= startDate && l.attendance_date <= endDate
    );

    const map = new Map<string, AttendanceRecord>();
    remoteRecords.forEach((r) => map.set(`${r.student_id}_${r.attendance_date}`, r));
    local.forEach((l) => map.set(`${l.student_id}_${l.attendance_date}`, l));

    return Array.from(map.values());
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
    this.saveLocalAttendanceBatch(records);

    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .upsert(records, {
          onConflict: 'student_id,class_id,attendance_date',
        })
        .select();

      if (!error) return data;
    } catch (e: any) {
      console.warn('Supabase upsert attendance fallback to local:', e?.message);
    }

    return records;
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
    const cacheKey = `assignments_${classId || 'all'}_${onlyPublished}`;
    const cached = getCached<Assignment[]>(cacheKey);
    if (cached) return cached;

    const fetchPromise = (async () => {
      try {
        let query = supabase.from('assignments').select(`
          *,
          class:classes(id, class_name, grade_level)
        `);

        if (classId) query = query.eq('class_id', classId);
        if (onlyPublished) query = query.eq('publication_status', 'published');

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error || !data) return [];

        const assignments = data;
        if (assignments.length === 0) return [];

        // Batch count submissions in a single query
        const assignmentIds = assignments.map((a: any) => a.id);
        const { data: subData } = await supabase
          .from('submissions')
          .select('assignment_id')
          .in('assignment_id', assignmentIds);

        const countMap = new Map<string, number>();
        if (subData) {
          subData.forEach((s: any) => {
            countMap.set(s.assignment_id, (countMap.get(s.assignment_id) || 0) + 1);
          });
        }

        return assignments.map((ass: any) => ({
          ...ass,
          submissions_count: countMap.get(ass.id) || 0,
        })) as Assignment[];
      } catch (err: any) {
        console.warn('Could not fetch assignments:', err?.message);
        return [];
      }
    })();

    const result = await withTimeout(fetchPromise, 2500, []);
    setCached(cacheKey, result);
    return result;
  },

  async createAssignment(item: Partial<Assignment>) {
    clearCache('assignments');
    const { data, error } = await supabase.from('assignments').insert(item).select().single();
    if (error) throw error;
    return data as Assignment;
  },

  async updateAssignment(id: string, updates: Partial<Assignment>) {
    clearCache('assignments');
    const { data, error } = await supabase.from('assignments').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Assignment;
  },

  async deleteAssignment(id: string) {
    clearCache('assignments');
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
    const cacheKey = `quizzes_${classId || 'all'}_${onlyPublished}`;
    const cached = getCached<Quiz[]>(cacheKey);
    if (cached) return cached;

    const fetchPromise = (async () => {
      try {
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
      } catch {
        return [];
      }
    })();

    const result = await withTimeout(fetchPromise, 2500, []);
    setCached(cacheKey, result);
    return result;
  },

  async createQuiz(item: Partial<Quiz>) {
    clearCache('quizzes');
    const { data, error } = await supabase.from('quizzes').insert(item).select().single();
    if (error) throw error;
    return data as Quiz;
  },

  async updateQuiz(id: string, updates: Partial<Quiz>) {
    clearCache('quizzes');
    const { data, error } = await supabase.from('quizzes').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Quiz;
  },

  async deleteQuiz(id: string) {
    clearCache('quizzes');
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
    const cacheKey = `announcements_${classId || 'all'}`;
    const cached = getCached<Announcement[]>(cacheKey);
    if (cached) return cached;

    const fetchPromise = (async () => {
      try {
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
      } catch {
        return [];
      }
    })();

    const result = await withTimeout(fetchPromise, 2500, []);
    setCached(cacheKey, result);
    return result;
  },

  async createAnnouncement(item: Partial<Announcement>) {
    clearCache('announcements');
    const { data, error } = await supabase.from('announcements').insert(item).select().single();
    if (error) throw error;
    return data as Announcement;
  },

  async deleteAnnouncement(id: string) {
    clearCache('announcements');
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
