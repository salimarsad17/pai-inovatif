import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardTeacher } from './pages/DashboardTeacher';
import { DashboardStudent } from './pages/DashboardStudent';
import { ClassManagementView } from './pages/ClassManagementView';
import { StudentManagementView } from './pages/StudentManagementView';
import { AttendanceView } from './pages/AttendanceView';
import { TeacherJournalView } from './pages/TeacherJournalView';
import { AttitudeJournalView } from './pages/AttitudeJournalView';
import { AssignmentView } from './pages/AssignmentView';
import { GradeRecapView } from './pages/GradeRecapView';
import { TeachingDocumentsView } from './pages/TeachingDocumentsView';
import { AITeachingMaterialView } from './pages/AITeachingMaterialView';
import { SchoolAndTeacherProfileView } from './pages/SchoolAndTeacherProfileView';
import { ReportsView } from './pages/ReportsView';
import { HomeroomView } from './pages/HomeroomView';
import { MasterDataView } from './pages/MasterDataView';
import { StudentPortalViews } from './pages/StudentPortalViews';
import { SetupGuideModal } from './pages/SetupGuideModal';
import { dataService } from './services/dataService';
import { Announcement } from './types';
import { BookOpen, Sparkles } from 'lucide-react';

function AppContent() {
  const { user, profile, role, loading } = useAuth();

  const [currentMenu, setCurrentMenu] = useState<string>('beranda');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (role === 'siswa') {
      setCurrentMenu('siswa_beranda');
    } else {
      setCurrentMenu('beranda');
    }
  }, [role]);

  useEffect(() => {
    async function loadGlobalAnnouncements() {
      try {
        const anns = await dataService.getAnnouncements();
        setAnnouncements(anns);
      } catch (e) {
        // Non-blocking
      }
    }
    if (user) {
      loadGlobalAnnouncements();
    }
  }, [user]);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-amber-500 flex items-center justify-center shadow-xl border border-amber-400/30 mb-4 animate-bounce">
          <BookOpen className="w-8 h-8 text-amber-100" />
        </div>
        <div className="font-extrabold text-xl tracking-wide flex items-center gap-1.5 mb-2">
          <span>PAI</span>
          <span className="text-amber-400">INOVATIF</span>
        </div>
        <p className="text-xs text-slate-400 font-medium">UPT SMPN 2 Rebang Tangkas</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-amber-300">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Menghubungkan ke database Supabase...</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <>
        <LoginPage onOpenMigrationGuide={() => setShowSetupGuide(true)} />
        <SetupGuideModal
          isOpen={showSetupGuide}
          onClose={() => setShowSetupGuide(false)}
        />
      </>
    );
  }

  // Handle menu selection
  const handleSelectMenu = (menuId: string) => {
    if (menuId === 'panduan_setup') {
      setShowSetupGuide(true);
      return;
    }
    setCurrentMenu(menuId);
  };

  // Render view for Guru
  const renderTeacherView = () => {
    switch (currentMenu) {
      case 'beranda':
        return <DashboardTeacher onSelectMenu={handleSelectMenu} />;
      case 'profil_sekolah':
        return <SchoolAndTeacherProfileView mode="school" />;
      case 'profil_guru':
        return <SchoolAndTeacherProfileView mode="teacher" />;
      case 'data_kelas':
        return <ClassManagementView />;
      case 'data_siswa':
        return <StudentManagementView />;
      case 'perangkat_ajar':
        return <TeachingDocumentsView />;
      case 'bahan_ajar_ai':
        return <AITeachingMaterialView />;
      case 'jurnal_guru':
        return <TeacherJournalView />;
      case 'jurnal_sikap':
        return <AttitudeJournalView />;
      case 'absensi_siswa':
        return <AttendanceView />;
      case 'tugas_penilaian':
        return <AssignmentView />;
      case 'rekap_nilai':
        return <GradeRecapView />;
      case 'guru_wali':
        return <HomeroomView />;
      case 'laporan':
        return <ReportsView />;
      case 'master_data':
        return <MasterDataView onOpenSetupGuide={() => setShowSetupGuide(true)} />;
      default:
        return <DashboardTeacher onSelectMenu={handleSelectMenu} />;
    }
  };

  // Render view for Siswa
  const renderStudentView = () => {
    if (currentMenu === 'siswa_beranda') {
      return <DashboardStudent onSelectMenu={handleSelectMenu} />;
    }
    return (
      <StudentPortalViews
        viewType={
          (currentMenu as any) || 'siswa_beranda'
        }
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        announcements={announcements}
        onSelectMenu={handleSelectMenu}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentMenu={currentMenu}
          onSelectMenu={handleSelectMenu}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950/70">
          <div className="max-w-7xl mx-auto pb-12">
            {role === 'guru' || role === 'admin'
              ? renderTeacherView()
              : renderStudentView()}
          </div>
        </main>
      </div>

      {/* Setup Guide & Migration Modal */}
      <SetupGuideModal
        isOpen={showSetupGuide}
        onClose={() => setShowSetupGuide(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
