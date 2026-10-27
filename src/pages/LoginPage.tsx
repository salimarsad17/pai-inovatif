import React, { useState } from 'react';
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
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Database,
  ExternalLink,
  Maximize2,
  Minimize2,
  Palette,
  Layers,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

export interface BackgroundOption {
  id: string;
  name: string;
  badge: string;
  src: string;
  alt: string;
  desc: string;
  type: 'composite' | 'photo' | 'vector';
  foregroundSrc?: string;
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: 'modern-composite',
    name: 'Siswa & Masjid Raya Modern',
    badge: 'Rekomendasi Utama',
    src: '/masjid-al-jabbar-modern.jpg',
    foregroundSrc: '/pendidikan-santri.jpg',
    alt: "Kemegahan Arsitektur Modern Masjid Raya Al-Jabbar dan Siswa SMP Membaca Al-Qur'an",
    desc: 'Komposisi modern arsitektur masjid raya megah & siswa SMP berpeci membaca Al-Qur’an',
    type: 'composite',
  },
  {
    id: 'santri-belajar',
    name: 'Siswa SMP & Al-Qur’an',
    badge: 'Fotografi HD',
    src: '/pendidikan-santri.jpg',
    alt: "Siswa SMP Berpeci Membaca Mushaf Al-Qur'an dan Menulis",
    desc: 'Fotografi asli siswa berpeci duduk membaca mushaf Al-Qur’an dan menuntut ilmu',
    type: 'photo',
  },
  {
    id: 'masjid-aljabbar',
    name: 'Kemegahan Masjid Modern',
    badge: 'Arsitektur Futuristik',
    src: '/masjid-al-jabbar-modern.jpg',
    alt: 'Masjid Raya Al-Jabbar Arsitektur Modern Monumental dan Kolam Fajar',
    desc: 'Kubah geometris megah dengan pantulan air fajar dan lanskap sekolah',
    type: 'photo',
  },
  {
    id: 'santri-murajaah',
    name: 'Siswa Khusyuk Mengaji',
    badge: 'Khusyuk & Damai',
    src: '/santri-murajaah.jpg',
    alt: "Siswa SMP Duduk Bersila Membaca Kitab Suci Al-Qur'an",
    desc: 'Siswa berseragam rapi duduk khusyuk mengaji ayat suci Al-Qur’an',
    type: 'photo',
  },
  {
    id: 'tadarus-peci',
    name: 'Tadarus Mushaf & Peci',
    badge: 'Sudut Pandang Atas',
    src: '/bg-student-quran.jpg',
    alt: "Siswa Berpeci Hitam Membaca Lembaran Mushaf Al-Qur'an",
    desc: 'Fokus membaca lembaran mushaf Al-Qur’an dengan peci hitam',
    type: 'photo',
  },
  {
    id: 'vektor-artistik',
    name: 'Ilustrasi Artistik Digital',
    badge: 'Vektor Modern',
    src: '/login-background-modern.svg',
    alt: "Ilustrasi Digital Siswa SMP Berpeci di Depan Masjid dan Gedung Sekolah",
    desc: 'Karya seni vektor modern dengan nuansa fajar emas dan siluet sekolah',
    type: 'vector',
  },
];

interface LoginPageProps {
  onOpenMigrationGuide?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenMigrationGuide }) => {
  const { loginWithEmail, loginWithUsername, isConfigured } = useAuth();

  const [activeTab, setActiveTab] = useState<'guru' | 'siswa'>('guru');
  const [identifier, setIdentifier] = useState(''); // Email or username or NIS
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
  const [hideCard, setHideCard] = useState(false);
  const [selectedBg, setSelectedBg] = useState<string>('modern-composite');
  const [cardTransparency, setCardTransparency] = useState<'translucent' | 'ultra' | 'crystal'>('ultra');
  const [showBgSelector, setShowBgSelector] = useState(false);
  const currentBg = BACKGROUND_OPTIONS.find((b) => b.id === selectedBg) || BACKGROUND_OPTIONS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!identifier.trim() || !password) {
      setErrorMessage('Harap masukkan username/email dan kata sandi.');
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'guru') {
        // Teacher login: usually email or username
        if (identifier.includes('@')) {
          await loginWithEmail(identifier, password);
        } else {
          await loginWithUsername(identifier, password, 'guru');
        }
      } else {
        // Student login: NIS or username (e.g., siswa_101 or 101)
        let studentUser = identifier.trim().toLowerCase();
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
            ? `Kombinasi email/username atau kata sandi untuk "${identifier}" tidak cocok, atau akun belum terdaftar di Supabase Auth.`
            : `Nomor Induk Siswa (NIS) atau kata sandi tidak cocok untuk "${identifier}". Pastikan akun telah didaftarkan oleh Guru PAI Anda.`;
      } else if (msg.toLowerCase().includes('rate limit')) {
        msg = 'Batas pengiriman email verifikasi gratis Supabase sedang penuh (kuota 3 email/jam). Anda dapat menambahkan akun langsung di Supabase Dashboard > Authentication > Users > Add user (Auto Confirm).';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Email akun ini belum dikonfirmasi di Supabase Auth settings. Nonaktifkan "Confirm email" di Supabase Dashboard atau centang Auto Confirm saat membuat user.';
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 relative overflow-hidden">
      {/* Background Hero Artwork - Modern Dynamic Switcher */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <img
          key={currentBg.id}
          src={currentBg.src}
          alt={currentBg.alt}
          className="w-full h-full object-cover object-center transform scale-100 transition-all duration-1000 animate-in fade-in"
          referrerPolicy="no-referrer"
        />

        {/* If composite theme, show elegant foreground student studying highlight */}
        {currentBg.type === 'composite' && (
          <div className="absolute bottom-6 left-6 hidden lg:flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-950/70 backdrop-blur-xl border border-white/20 shadow-2xl max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-700 pointer-events-auto">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-amber-400/40 shrink-0 shadow-md">
              <img
                src={currentBg.foregroundSrc || '/bg-student-quran.jpg'}
                alt="Siswa SMP Tadarus Al-Qur'an"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generasi Qur'ani SMP</span>
              </div>
              <p className="text-xs font-bold text-white leading-snug mt-0.5">
                Siswa Berpeci Membaca Al-Qur'an
              </p>
              <p className="text-[10px] text-slate-300">
                UPT SMPN 2 Rebang Tangkas
              </p>
            </div>
          </div>
        )}

        {/* Modern Atmospheric Gradients - Menjaga gambar tetap keren, hidup, dan kontras */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-slate-950/60" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-slate-950/10 to-slate-950/45 backdrop-blur-[0.5px]" />

        {/* Soft Ambient Colorful Mesh Lighting */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Ticker / Running Text Translucent & Modern Controls */}
      <div className="relative z-20 bg-slate-950/50 backdrop-blur-md border-b border-white/10 py-1.5 px-4 text-center">
        <div className="flex flex-wrap items-center justify-between max-w-7xl mx-auto gap-2 text-xs tracking-wider">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/90 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] uppercase shadow-sm">
              Semboyan
            </span>
            <span className="font-semibold text-amber-300 drop-shadow-sm hidden md:inline">
              ✨ &ldquo;Guru Kreatif, Siswa Aktif&rdquo; &bull; Platform Digital PAI UPT SMPN 2 Rebang Tangkas
            </span>
            <span className="font-semibold text-amber-300 drop-shadow-sm md:hidden text-[11px]">
              ✨ PAI Inovatif SMPN 2 Rebang Tangkas
            </span>
          </div>

          {/* Right Action Suite: Pilihan Gambar Latar, Transparansi, & Mode Layar Penuh */}
          <div className="flex items-center gap-1.5">
            {/* Background Selector Dropdown / Popover Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBgSelector(!showBgSelector)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/70 hover:bg-slate-800/80 text-amber-300 border border-amber-500/40 text-[11px] font-semibold backdrop-blur-md transition-all shadow-sm cursor-pointer"
                title="Pilih Tema Gambar Latar Belakang Modern"
              >
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Tema Latar:</span>
                <span className="font-bold text-white">{currentBg.name}</span>
              </button>

              {/* Popover Menu: Pilihan Latar Belakang */}
              {showBgSelector && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-950/95 border border-white/20 rounded-2xl shadow-2xl p-2.5 backdrop-blur-2xl z-50 text-left animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 mb-1 border-b border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400">Pilih Latar Belakang Modern</span>
                    <span className="text-[9px] text-slate-400">{BACKGROUND_OPTIONS.length} Tema HD Modern</span>
                  </div>
                  <div className="space-y-1.5 mt-1">
                    {BACKGROUND_OPTIONS.map((bg) => (
                      <button
                        type="button"
                        key={bg.id}
                        onClick={() => {
                          setSelectedBg(bg.id);
                          setShowBgSelector(false);
                        }}
                        className={`w-full p-2 rounded-xl text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                          selectedBg === bg.id
                            ? 'bg-amber-500/20 border border-amber-400/50 text-white'
                            : 'hover:bg-slate-900/80 text-slate-300 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/20 bg-slate-900">
                          <img src={bg.src} alt={bg.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-bold truncate">{bg.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-amber-300 shrink-0 font-medium">
                              {bg.badge}
                            </span>
                          </div>
                          <p className="text-[9.5px] text-slate-400 line-clamp-1 mt-0.5">{bg.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Tingkat Transparansi Kartu */}
            <button
              type="button"
              onClick={() =>
                setCardTransparency((prev) =>
                  prev === 'translucent' ? 'ultra' : prev === 'ultra' ? 'crystal' : 'translucent'
                )
              }
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md transition-all shadow-sm cursor-pointer border ${
                cardTransparency === 'crystal'
                  ? 'bg-amber-500/30 text-amber-300 border-amber-400/70 ring-1 ring-amber-400/40'
                  : cardTransparency === 'ultra'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                  : 'bg-slate-900/70 hover:bg-slate-800/80 text-slate-300 border-white/15'
              }`}
              title="Ubah tingkat transparansi kartu login"
            >
              <Layers className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Transparansi:</span>
              <span>
                {cardTransparency === 'crystal'
                  ? 'Kristal Bening (25%)'
                  : cardTransparency === 'ultra'
                  ? 'Ultra Bening (40%)'
                  : 'Standar (55%)'}
              </span>
            </button>

            {/* Toggle Tombol Lihat Latar Belakang Penuh */}
            <button
              type="button"
              onClick={() => setHideCard(!hideCard)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/70 hover:bg-slate-800/80 text-amber-300 border border-white/15 text-[11px] font-semibold backdrop-blur-md transition-all shadow-sm cursor-pointer shrink-0"
              title={hideCard ? 'Tampilkan Formulir Login' : 'Lihat Gambar Latar Belakang Penuh'}
            >
              {hideCard ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              <span>{hideCard ? 'Form Login' : 'Latar Penuh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Login Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        {/* Floating Controls when Card is Hidden (Mode Latar Penuh) */}
        {hideCard && (
          <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-500">
            <button
              type="button"
              onClick={() => setHideCard(false)}
              className="cursor-pointer bg-slate-950/80 hover:bg-slate-900/95 border border-amber-400/60 text-amber-200 px-6 py-3 rounded-full backdrop-blur-2xl text-xs font-bold shadow-2xl flex items-center gap-2.5 transition-all animate-bounce hover:scale-105"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Kembali ke Formulir Login</span>
            </button>

            <div className="bg-slate-950/75 border border-white/20 px-5 py-2.5 rounded-2xl backdrop-blur-xl text-[11px] text-slate-200 flex flex-col sm:flex-row items-center gap-2 shadow-2xl max-w-lg text-center">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-amber-400" />
                {currentBg.name}
              </span>
              <span className="hidden sm:inline text-white/30">•</span>
              <span className="text-slate-300 text-[10.5px]">{currentBg.desc}</span>
            </div>
          </div>
        )}

        <div
          className={`w-full max-w-md ${
            cardTransparency === 'crystal'
              ? 'bg-slate-950/25 hover:bg-slate-950/35 backdrop-blur-md'
              : cardTransparency === 'ultra'
              ? 'bg-slate-950/40 hover:bg-slate-950/50 backdrop-blur-xl'
              : 'bg-slate-950/55 hover:bg-slate-950/65 backdrop-blur-2xl'
          } border border-white/25 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] p-6 sm:p-8 relative ring-1 ring-amber-400/25 transition-all duration-300 ${
            hideCard ? 'hidden' : 'block'
          }`}
        >
          {/* Header Bismillah */}
          <div className="text-center mb-6">
            <div className="text-2xl sm:text-3xl font-serif text-amber-400 font-bold mb-2 tracking-wide font-['Amiri',serif] drop-shadow-md">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <p className="text-[11px] text-slate-300 font-sans tracking-wide drop-shadow">
              Dengan nama Allah Yang Maha Pengasih, Maha Penyayang
            </p>
          </div>

          {/* School & Brand Identity */}
          <div className="text-center mb-6 pb-4 border-b border-white/10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-amber-500 shadow-lg shadow-blue-900/40 mb-3 border border-amber-400/30">
              <BookOpen className="w-7 h-7 text-amber-100" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>PAI</span>
              <span className="text-amber-400">INOVATIF</span>
            </h1>
            <p className="text-xs text-slate-200 font-medium mt-1 drop-shadow">
              Platform Digital Pendidikan Agama Islam
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-slate-950/60 border border-white/15 text-[11px] text-slate-200 backdrop-blur-md">
              <School className="w-3.5 h-3.5 text-amber-400" />
              <span>UPT SMPN 2 Rebang Tangkas</span>
            </div>
          </div>

          {/* Tab Selection: Guru / Siswa */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded-xl mb-4 border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                setActiveTab('guru');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'guru'
                  ? 'bg-blue-600/90 text-white shadow-md shadow-blue-900/50 border border-blue-400/30'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4 text-amber-300" />
              <span>Login Guru</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('siswa');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'siswa'
                  ? 'bg-amber-600/90 text-slate-950 shadow-md shadow-amber-900/50 border border-amber-400/30'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Login Siswa</span>
            </button>
          </div>

          {/* Quick Login Badge */}
          {activeTab === 'guru' ? (
            <div className="mb-4 p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-2 text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className="text-[11px]">
                  <span className="text-slate-400">User: </span>
                  <span className="font-mono font-bold text-amber-300">guru</span>
                  <span className="text-slate-400"> &bull; Sandi: </span>
                  <span className="font-mono font-bold text-amber-300">guru321</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('guru');
                  setPassword('guru321');
                }}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] uppercase transition-colors shadow-sm cursor-pointer"
              >
                Isi Otomatis
              </button>
            </div>
          ) : (
            <div className="mb-4 p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-2 text-slate-200">
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <div className="text-[11px]">
                  <span className="text-slate-400">Siswa Demo: </span>
                  <span className="font-mono font-bold text-amber-300">siswa</span>
                  <span className="text-slate-400"> &bull; Sandi: </span>
                  <span className="font-mono font-bold text-amber-300">siswa321</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('siswa');
                  setPassword('siswa321');
                }}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] uppercase transition-colors shadow-sm cursor-pointer"
              >
                Isi Otomatis
              </button>
            </div>
          )}

          {/* Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs space-y-2.5 leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              {activeTab === 'guru' && (
                <div className="pt-2 border-t border-rose-900/60 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRegName(identifier.toLowerCase().includes('salim') ? 'Salim Arsad, S.Pd.I.' : 'Guru PAI');
                      setRegEmail(
                        identifier.includes('@')
                          ? identifier
                          : (identifier.toLowerCase().includes('salim') ? 'salimarsad17@gmail.com' : `${identifier}@gmail.com`)
                      );
                      setRegPassword(password || '');
                      setShowRegisterTeacherModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Daftarkan Akun Guru Sekarang</span>
                  </button>
                  <a
                    href="https://supabase.com/dashboard/project/txbdicaqwjpkybhznuzw/auth/users"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs inline-flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Supabase Users (Add User)</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-start gap-2.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {activeTab === 'guru' ? 'Email atau Username Guru' : 'Nomor Induk Siswa (NIS) / Username'}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  activeTab === 'guru' ? 'guru@sekolah.sch.id atau username' : 'Contoh: 20240101 atau siswa_101'
                }
                className="w-full bg-slate-950/60 hover:bg-slate-950/75 border border-white/20 focus:border-amber-400 focus:bg-slate-950/90 focus:ring-1 focus:ring-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition-all backdrop-blur-md"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Kata Sandi</label>
                {activeTab === 'guru' && (
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Lupa sandi?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi Anda"
                  className="w-full bg-slate-950/60 hover:bg-slate-950/75 border border-white/20 focus:border-amber-400 focus:bg-slate-950/90 focus:ring-1 focus:ring-amber-400 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition-all backdrop-blur-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                activeTab === 'guru'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-900/40'
              } disabled:opacity-50`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk sebagai {activeTab === 'guru' ? 'Guru' : 'Siswa'}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Guidance / Bootstrap Guru */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center space-y-2">
            {activeTab === 'guru' ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowRegisterTeacherModal(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Daftarkan Akun Guru PAI Pertama</span>
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Akun siswa dibuat dan dikelola oleh Guru PAI. Gunakan NIS yang diberikan guru Anda.
              </p>
            )}

            {onOpenMigrationGuide && (
              <div>
                <button
                  onClick={onOpenMigrationGuide}
                  className="text-[11px] text-slate-400 hover:text-blue-400 inline-flex items-center gap-1 transition-colors mt-1"
                >
                  <Database className="w-3 h-3 text-amber-400" />
                  <span>Panduan Skema Supabase & Deployment</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Translucent */}
      <footer className="relative z-10 py-3 text-center text-[11px] text-slate-300 border-t border-white/10 bg-slate-950/40 backdrop-blur-md">
        PAI INOVATIF &copy; {new Date().getFullYear()} UPT SMPN 2 Rebang Tangkas. Dibuat dengan Supabase & Google AI Studio.
      </footer>

      {/* Modal: Daftarkan Guru Pertama */}
      {showRegisterTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" /> Daftarkan Akun Guru PAI
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Buat akun guru utama untuk mengelola kelas, bahan ajar, dan siswa UPT SMPN 2 Rebang Tangkas.
            </p>

            <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-xl mb-3 text-[11px] text-blue-200 flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span>Jika verifikasi email penuh (rate limit), Anda juga bisa membuat user instan di </span>
                <a
                  href="https://supabase.com/dashboard/project/txbdicaqwjpkybhznuzw/auth/users"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-300 font-bold underline inline-flex items-center gap-0.5"
                >
                  Supabase Users <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span> dengan mencentang <em>Auto Confirm</em>.</span>
              </div>
            </div>

            <form onSubmit={handleRegisterTeacher} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Salim Arsad, S.Pd.I."
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Resmi</label>
                <input
                  type="email"
                  required
                  placeholder="guru@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Kata Sandi</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">NIP (Opsional)</label>
                  <input
                    type="text"
                    placeholder="1985..."
                    value={regNip}
                    onChange={(e) => setRegNip(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    placeholder="0812..."
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterTeacherModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {regLoading ? 'Mendaftarkan...' : 'Daftarkan Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lupa Password */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Pemulihan Kata Sandi</h3>
            <p className="text-xs text-slate-400 mb-4">
              Masukkan alamat email terdaftar untuk menerima tautan reset kata sandi.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
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
