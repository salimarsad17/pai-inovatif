import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Shield,
  Bell,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { SUPABASE_URL } from '../lib/supabase';
import { Announcement, AuditLog } from '../types';

interface MasterDataViewProps {
  onOpenSetupGuide: () => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({ onOpenSetupGuide }) => {
  const { profile } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // New announcement modal
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annImportant, setAnnImportant] = useState(false);
  const [annLoading, setAnnLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [annList, logList] = await Promise.all([
        dataService.getAnnouncements(),
        dataService.getAuditLogs(15),
      ]);
      setAnnouncements(annList);
      setAuditLogs(logList);
    } catch (err) {
      console.warn('Master data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    setAnnLoading(true);
    try {
      await dataService.createAnnouncement({
        title: annTitle.trim(),
        content: annContent.trim(),
        is_important: annImportant,
        created_by: profile?.id,
        published_at: new Date().toISOString(),
      });
      setAlertMsg({ type: 'success', text: 'Pengumuman sekolah berhasil dipublikasikan.' });
      setShowAnnModal(false);
      setAnnTitle('');
      setAnnContent('');
      loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `Gagal membuat pengumuman: ${err.message}` });
    } finally {
      setAnnLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await dataService.deleteAnnouncement(id);
      loadData();
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-400" />
            <span>Master Data & Pengaturan Sistem</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pengelolaan pengumuman portal, status database Supabase PostgreSQL, dan audit aktivitas pengguna.
          </p>
        </div>

        <button
          onClick={onOpenSetupGuide}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-102"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Panduan Supabase & Deploy</span>
        </button>
      </div>

      {/* Alert */}
      {alertMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            alertMsg.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
              : 'bg-rose-950/60 border border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Database Connection Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Status Integrasi Supabase PostgreSQL & Auth</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">Project Host URL:</span>
            <span className="font-mono text-emerald-300 font-semibold truncate block">
              {SUPABASE_URL}
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">Autentikasi & RLS:</span>
            <span className="text-amber-400 font-semibold block">
              Supabase Auth (JWT & Roles)
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">AI Engine:</span>
            <span className="text-blue-400 font-semibold block">
              Google Gemini 3.8 Flash (Server-Side)
            </span>
          </div>
        </div>
      </div>

      {/* Announcements Manager */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Pengumuman Informasi Pembelajaran</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Pengumuman akan tampil di header dan dashboard seluruh siswa SMP.
            </p>
          </div>

          <button
            onClick={() => setShowAnnModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pengumuman</span>
          </button>
        </div>

        {announcements.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-400">
            Belum ada pengumuman yang dibuat.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {ann.is_important && (
                      <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px] font-bold">
                        PENTING
                      </span>
                    )}
                    <h4 className="text-xs font-bold text-white">{ann.title}</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">{ann.content}</p>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Diterbitkan: {new Date(ann.published_at).toLocaleDateString('id-ID')}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteAnnouncement(ann.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Add Announcement */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Buat Pengumuman Baru</h3>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jadwal Penilaian Tengah Semester PAI"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Isi Pengumuman</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan isi pengumuman untuk seluruh siswa..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkImportant"
                  checked={annImportant}
                  onChange={(e) => setAnnImportant(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                />
                <label htmlFor="chkImportant" className="text-xs text-slate-300 font-medium">
                  Tandai sebagai Pengumuman Penting (Merah)
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={annLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  {annLoading ? 'Menerbitkan...' : 'Terbitkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
