import React, { useState } from 'react';
import {
  School,
  UserCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
  Calendar,
  Phone,
  Mail,
  Shield,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';

interface ProfileViewProps {
  mode: 'school' | 'teacher';
}

export const SchoolAndTeacherProfileView: React.FC<ProfileViewProps> = ({ mode }) => {
  const { profile, schoolSettings, refreshSettings, refreshProfile } = useAuth();

  // School settings states
  const [schoolName, setSchoolName] = useState(
    schoolSettings?.school_name || 'UPT SMPN 2 Rebang Tangkas'
  );
  const [schoolAddress, setSchoolAddress] = useState(
    schoolSettings?.school_address || 'Jl. Rebang Tangkas, Kec. Rebang Tangkas, Kab. Way Kanan, Lampung'
  );
  const [academicYear, setAcademicYear] = useState(schoolSettings?.academic_year || '2025/2026');
  const [semester, setSemester] = useState(schoolSettings?.semester || 'Ganjil');
  const [motto, setMotto] = useState(schoolSettings?.motto || 'Guru Kreatif, Siswa Aktif');
  const [headmaster, setHeadmaster] = useState(
    schoolSettings?.headmaster_name || 'H. Ahmad Fauzi, S.Ag., M.Pd.'
  );

  // Teacher profile states
  const [teacherName, setTeacherName] = useState(profile?.full_name || '');
  const [teacherNip, setTeacherNip] = useState(profile?.nip || '');
  const [teacherPhone, setTeacherPhone] = useState(profile?.phone || '');

  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlertMsg(null);
    try {
      await dataService.updateSchoolSettings({
        school_name: schoolName.trim(),
        school_address: schoolAddress.trim(),
        academic_year: academicYear.trim(),
        semester: semester.trim(),
        motto: motto.trim(),
        headmaster_name: headmaster.trim(),
      });
      await refreshSettings();
      setAlertMsg({ type: 'success', text: 'Profil & pengaturan sekolah berhasil diperbarui di Supabase.' });
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal memperbarui: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setAlertMsg(null);
    try {
      await authService.updateProfile(profile.id, {
        full_name: teacherName.trim(),
        nip: teacherNip.trim() || null,
        phone: teacherPhone.trim() || null,
      });
      await refreshProfile();
      setAlertMsg({ type: 'success', text: 'Profil Guru PAI berhasil disimpan.' });
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal memperbarui: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'school') {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <School className="w-6 h-6 text-amber-400" />
            <span>Profil Satuan Pendidikan</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Informasi identitas resmi sekolah, tahun ajaran aktif, dan motto pembelajaran.
          </p>
        </div>

        {alertMsg && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
              alertMsg.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                : 'bg-rose-950/60 border border-rose-800 text-rose-200'
            }`}
          >
            {alertMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual Identity Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-amber-500 flex items-center justify-center text-white mb-4 shadow-xl border border-amber-400/30">
              <Building className="w-12 h-12 text-amber-200" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">{schoolName}</h3>
            <p className="text-xs text-slate-400 mb-3">{schoolAddress}</p>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
              &ldquo;{motto}&rdquo;
            </span>

            <div className="w-full mt-6 pt-4 border-t border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Kepala Sekolah:</span>
                <span className="text-white font-semibold">{headmaster}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tahun Pelajaran:</span>
                <span className="text-white font-semibold">{academicYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Semester Aktif:</span>
                <span className="text-emerald-400 font-semibold">{semester}</span>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-4">Pengaturan Data Sekolah</h3>

            <form onSubmit={handleSaveSchool} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Resmi Sekolah</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Sekolah</label>
                <input
                  type="text"
                  required
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Kepala Sekolah & Gelar</label>
                <input
                  type="text"
                  value={headmaster}
                  onChange={(e) => setHeadmaster(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tahun Pelajaran</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Motto Sekolah / Slogan</label>
                <input
                  type="text"
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Menyimpan...' : 'Simpan Profil Sekolah'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // mode === 'teacher'
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-blue-400" />
          <span>Profil & Biodata Guru PAI</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Kelola data pendidik, NIP, nomor kontak WhatsApp, dan informasi akun guru.
        </p>
      </div>

      {alertMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            alertMsg.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
              : 'bg-rose-950/60 border border-rose-800 text-rose-200'
          }`}
        >
          {alertMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{alertMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-3xl mb-4 shadow-xl border-4 border-slate-800">
            {profile?.full_name?.charAt(0) || 'G'}
          </div>
          <h3 className="text-base font-bold text-white mb-1">{profile?.full_name}</h3>
          <p className="text-xs text-amber-400 font-semibold mb-1">Guru Pendidikan Agama Islam</p>
          <p className="text-[11px] text-slate-400 font-mono mb-4">NIP: {profile?.nip || 'Belum diisi'}</p>

          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-xs border border-emerald-500/30">
            Akun Guru Aktif
          </span>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-4">Perbarui Biodata Guru</h3>

          <form onSubmit={handleSaveTeacher} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap & Gelar</label>
              <input
                type="text"
                required
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Induk Pegawai (NIP)</label>
              <input
                type="text"
                placeholder="1985..."
                value={teacherNip}
                onChange={(e) => setTeacherNip(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">No. WhatsApp / Kontak</label>
              <input
                type="text"
                placeholder="0812..."
                value={teacherPhone}
                onChange={(e) => setTeacherPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Simpan Profil Guru'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
