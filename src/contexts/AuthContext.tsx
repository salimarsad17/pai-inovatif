import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';
import { UserProfile, UserRole, StudentItem, SchoolSettings } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  student: StudentItem | null;
  role: UserRole;
  loading: boolean;
  isConfigured: boolean;
  schoolSettings: SchoolSettings | null;
  loginWithEmail: (e: string, p: string) => Promise<any>;
  loginWithUsername: (u: string, p: string, r: UserRole) => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [student, setStudent] = useState<StudentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const isConfigured = isSupabaseConfigured();

  const loadSettings = async () => {
    try {
      const settings = await dataService.getSchoolSettings();
      setSchoolSettings(settings);
    } catch (e) {
      console.warn('Failed loading settings', e);
    }
  };

  const loadProfile = async (currentUser?: User | null) => {
    const targetUser = currentUser !== undefined ? currentUser : await authService.getCurrentUser();
    setUser(targetUser);

    if (targetUser) {
      try {
        const userProfile = await authService.getCurrentProfile();
        setProfile(userProfile);

        if (userProfile?.role === 'siswa') {
          const studentData = await dataService.getStudentByProfileId(userProfile.id);
          setStudent(studentData);
        } else {
          setStudent(null);
        }
      } catch (err) {
        console.warn('Could not load profile:', err);
      }
    } else {
      setProfile(null);
      setStudent(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await loadSettings();
        const initialUser = await authService.getCurrentUser();
        if (mounted) {
          await loadProfile(initialUser);
        }
      } catch (err) {
        console.warn('Init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: authListener } = authService.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        await loadProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setStudent(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const res = await authService.signInWithEmail(email, pass);
    if (res.user) {
      await loadProfile(res.user);
    }
    return res;
  };

  const loginWithUsername = async (username: string, pass: string, preferredRole: UserRole) => {
    const res = await authService.signInWithUsername(username, pass, preferredRole);
    if (res.user) {
      await loadProfile(res.user);
    }
    return res;
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setStudent(null);
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  const currentRole: UserRole = profile?.role || 'guru';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        student,
        role: currentRole,
        loading,
        isConfigured,
        schoolSettings,
        loginWithEmail,
        loginWithUsername,
        logout,
        refreshProfile,
        refreshSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
