import React, { useState, useRef } from 'react';
import {
  BookOpen,
  Eye,
  EyeOff,
  LogIn,
  School,
  Sparkles,
  UserCheck,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Lock,
  User,
  ArrowRight,
  Upload,
  Camera,
  ShieldCheck,
  UserPlus,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

interface LoginPageProps {
  onOpenMigrationGuide?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenMigrationGuide }) => {
  const { loginWithEmail, loginWithUsername } = useAuth();

  const [activeTab, setActiveTab] = useState<'guru' | 'siswa'>('guru');
  const [identifier, setIdentifier] = useState('salimarsad17@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Custom Teacher Photo in the top profile card
  const [teacherPhoto, setTeacherPhoto] = useState<string | null>(() => {
    return localStorage.getItem('teacher_card_photo') || null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal bootstrap Guru pertama
  const [showRegisterTeacherModal, setShowRegisterTeacherModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regNip, setRegNip] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setTeacherPhoto(result);
        localStorage.setItem('teacher_card_photo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseDefaultPassword = () => {
    if (activeTab === 'guru') {
      setPassword('123');
      setIdentifier('salimarsad17@gmail.com');
    } else {
      setPassword('123456');
      if (!identifier || identifier.includes('@')) {
        setIdentifier('siswa_101');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const loginId = identifier.trim();
    if (!loginId || !password) {
      setErrorMessage('Harap masukkan username/email dan kata sandi.');
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'guru') {
        if (loginId.includes('@')) {
          await loginWithEmail(loginId, password);
        } else {
          await loginWithUsername(loginId, password, 'guru');
        }
      } else {
        let studentUser = loginId.toLowerCase();
        if (!studentUser.startsWith('siswa_') && !studentUser.includes('@')) {
          studentUser = `siswa_${studentUser}`;
        }
        await loginWithUsername(studentUser, password, 'siswa');
      }
    } catch (err: any) {
      console.warn('Login attempt:', err.message);
      let msg = err.message || 'Gagal masuk. Periksa kembali data Anda.';
      if (msg.includes('Invalid login credentials')) {
        msg =
          activeTab === 'guru'
            ? `Kombinasi email/username atau kata sandi untuk "${loginId}" tidak cocok. Anda dapat mengklik "Gunakan Sandi Default (123)".`
            : `Nomor Induk Siswa (NIS) atau kata sandi tidak cocok untuk "${loginId}". Pastikan akun telah didaftarkan.`;
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regName) {
      setErrorMessage('Nama, email, dan kata sandi wajib diisi.');
      return;
    }

    setRegLoading(true);
    setErrorMessage(null);
    try {
      await authService.signUpTeacher(regEmail, regPassword, regName, regNip, regPhone);
      setSuccessMessage('Akun Guru berhasil didaftarkan! Silakan login dengan akun baru Anda.');
      setShowRegisterTeacherModal(false);
      setIdentifier(regEmail);
      setPassword(regPassword);
    } catch (err: any) {
      console.warn('Register teacher:', err.message);
      setErrorMessage(`Pendaftaran Guru: ${err.message}`);
    } finally {
      setRegLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await authService.resetPassword(forgotEmail);
      setSuccessMessage('Tautan pemulihan kata sandi telah dikirim ke email Anda.');
      setShowForgotModal(false);
    } catch (err: any) {
      setErrorMessage(`Gagal mengirim pemulihan: ${err.message}`);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-5 lg:p-8 font-sans">
      {/* Hidden file input for Teacher Photo */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Main Split-Screen Container Card */}
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* ================= LEFT COLUMN: HERO STUDENT & MOSQUE BANNER (ENLARGED) ================= */}
        <div className="lg:col-span-7 xl:col-span-7 relative bg-slate-900 flex flex-col justify-end p-6 sm:p-8 lg:p-10 overflow-hidden min-h-[420px] lg:min-h-full">
          {/* Authentic Student & Mosque Photo from screenshot */}
          <img
            src="/login-hero-student.png"
            alt="Siswa SMP Negeri 2 Rebang Tangkas Ber-kopyah Hitam"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-95"
          />

          {/* Atmospheric Gradient for pristine text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent pointer-events-none" />

          {/* Content Overlay at Bottom Left */}
          <div className="relative z-10 text-white space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Green Tag Badge */}
            <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-600 text-white font-black text-[11px] tracking-wider uppercase shadow-md border border-emerald-400/40">
              UPT SMP NEGERI 2 REBANG TANGKAS
            </span>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
              Sistem Inovasi Pendidikan Agama Islam
            </h1>

            {/* Subtext */}
            <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed drop-shadow max-w-lg">
              Platform Digital Pembelajaran, Administrasi Guru, Jurnal Sikap &amp; LMS Siswa PAI SMP
            </p>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: LOGIN FORM PANEL (COMPACT & TAILORED) ================= */}
        <div className="lg:col-span-5 xl:col-span-5 bg-white p-5 sm:p-6 lg:p-7 flex flex-col justify-between">
          <div className="w-full max-w-md mx-auto">
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3.5">
              {/* Left Brand Badge */}
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold text-[11px] tracking-wider text-emerald-800 uppercase">
                  PORTAL PAILMS SMP
                </span>
              </div>

              {/* Right Action Switcher: Masuk vs Daftar Akun */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-white text-slate-900 font-bold text-[11px] shadow-xs flex items-center gap-1 border border-slate-200/80 cursor-default"
                >
                  <LogIn className="w-3 h-3 text-emerald-600" />
                  <span>Masuk</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegisterTeacherModal(true)}
                  className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Daftarkan akun Guru baru"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Daftar Akun</span>
                </button>
              </div>
            </div>

            {/* Heading: Masuk ke Akun (diperkecil proporsional) */}
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3">
              Masuk ke Akun
            </h2>

            {/* Banner Guru Pengampu PAI (Dark Green Card) */}
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-emerald-800/80 mb-3 flex items-center gap-3">
              {/* Photo Box with Upload Button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-16 h-18 sm:w-18 sm:h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-xl border-2 border-amber-400/90 shadow-md flex flex-col items-center justify-center cursor-pointer group shrink-0 overflow-hidden transition-transform hover:scale-105"
                title="Klik untuk memilih/mengubah foto guru"
              >
                {teacherPhoto ? (
                  <img
                    src={teacherPhoto}
                    alt="Foto Guru"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-white mb-0.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[9.5px] font-black text-white leading-tight text-center">
                      Pilih Foto
                    </span>
                    <span className="text-[8px] text-amber-200 text-center font-mono font-semibold">
                      FOTOKU.jpg
                    </span>
                  </>
                )}

                {/* Top Right Verified Shield Badge */}
                <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center text-slate-950 shadow">
                  <ShieldCheck className="w-2 h-2" />
                </div>

                {/* Bottom Right Camera Icon Badge */}
                <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center text-slate-950 shadow">
                  <Camera className="w-2 h-2" />
                </div>
              </div>

              {/* Teacher Identity Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-2 h-2" />
                    GURU PENGAMPU PAI
                  </span>
                  <span className="text-emerald-200 text-[11px] font-semibold truncate">
                    UPT SMPN 2 Rebang Tangkas
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  Sadiqul Alim, S.Pd.I., M.Pd.
                </h3>

                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="bg-emerald-800/80 border border-emerald-600/70 text-emerald-200 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                    <UserCheck className="w-2.5 h-2.5 text-emerald-300" />
                    Pendidik Terverifikasi
                  </span>
                  <span className="text-slate-300 text-[10px] font-medium">
                    Sertifikasi Kemenag RI
                  </span>
                </div>
              </div>
            </div>

            {/* Segmented Mode Selector: Guru / Pendidik vs Siswa (LMS) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('guru');
                  setErrorMessage(null);
                  setIdentifier('salimarsad17@gmail.com');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'guru'
                    ? 'bg-emerald-900 text-amber-300 shadow-sm border border-emerald-700'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Guru / Pendidik</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('siswa');
                  setErrorMessage(null);
                  setIdentifier('siswa_101');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'siswa'
                    ? 'bg-emerald-900 text-amber-300 shadow-sm border border-emerald-700'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                <span>Siswa (LMS)</span>
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {activeTab === 'guru' ? (
                /* === TEACHER LOGIN VIEW === */
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    AKUN GURU PENGAMPU
                  </label>

                  {/* Teacher Quick Account Card */}
                  <div
                    onClick={() => setIdentifier('salimarsad17@gmail.com')}
                    className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-2.5 sm:p-3 flex items-center justify-between shadow-2xs cursor-pointer hover:bg-emerald-50 transition-colors mb-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-extrabold flex items-center justify-center text-xs shadow">
                        S
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-[13px] font-bold text-slate-900">
                          Sadiqul Alim, S.Pd.I., M.Pd.
                        </h4>
                        <p className="text-[10.5px] text-emerald-800 font-medium">
                          Guru Pengampu PAI &amp; Budi Pekerti
                        </p>
                      </div>
                    </div>

                    <div className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Siap Masuk</span>
                    </div>
                  </div>

                  {/* Hidden / Custom email input if user wants to change */}
                  <input
                    type="hidden"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              ) : (
                /* === STUDENT (LMS) LOGIN VIEW === */
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    NOMOR INDUK SISWA (NIS) ATAU USERNAME
                  </label>
                  <div className="relative mb-2">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Masukkan NIS (contoh: 101 atau siswa_101)"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-[13px] text-slate-900 font-medium focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[10.5px] text-slate-500">Pilih Cepat:</span>
                    {['siswa_101', 'siswa_102', 'siswa_103'].map((sample) => (
                      <button
                        type="button"
                        key={sample}
                        onClick={() => {
                          setIdentifier(sample);
                          setPassword('123456');
                        }}
                        className="px-2 py-0.5 rounded-md bg-slate-200/80 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 text-[10px] font-semibold cursor-pointer"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    {activeTab === 'guru' ? 'KATA SANDI GURU' : 'KATA SANDI SISWA'}
                  </label>
                  <button
                    type="button"
                    onClick={handleUseDefaultPassword}
                    className="text-[10.5px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                  >
                    Gunakan Sandi Default ({activeTab === 'guru' ? '123' : '123456'})
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={
                      activeTab === 'guru'
                        ? 'Masukkan kata sandi guru'
                        : 'Masukkan kata sandi siswa'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-[13px] text-slate-900 font-medium focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1.5 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Memproses Masuk...</span>
                ) : (
                  <>
                    <span>
                      {activeTab === 'guru' ? 'Masuk Aplikasi Guru' : 'Masuk Portal Siswa (LMS)'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Footer Help Link */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 text-center flex items-center justify-between text-[11px] text-slate-500">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="hover:text-emerald-700 hover:underline cursor-pointer"
              >
                Lupa Kata Sandi?
              </button>
              <span className="text-[10.5px] text-slate-400">
                UPT SMPN 2 Rebang Tangkas &bull; 2026
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Register Teacher / Pendidik */}
      {showRegisterTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <span>Pendaftaran Akun Guru PAI</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Daftarkan akun pendidik baru untuk mengelola kelas dan jurnal mengajar.
            </p>

            <form onSubmit={handleRegisterTeacher} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap &amp; Gelar
                </label>
                <input
                  type="text"
                  required
                  placeholder="Sadiqul Alim, S.Pd.I., M.Pd."
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Pendidik
                </label>
                <input
                  type="email"
                  required
                  placeholder="guru@smpn2rebangtangkas.sch.id"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP (Nomor Induk Pegawai)
                </label>
                <input
                  type="text"
                  placeholder="198507122010011008"
                  value={regNip}
                  onChange={(e) => setRegNip(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="081234567890"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterTeacherModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  {regLoading ? 'Mendaftarkan...' : 'Daftarkan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lupa Password */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>Pemulihan Kata Sandi</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan email terdaftar untuk menerima tautan atur ulang kata sandi.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  {forgotLoading ? 'Mengirim...' : 'Kirim Tautan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
