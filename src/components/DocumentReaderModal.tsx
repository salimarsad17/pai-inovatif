import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Search,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Copy,
  Check,
  BookOpen,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { TeachingDocument } from '../types';
import { documentStorage } from '../services/documentStorage';

interface DocumentReaderModalProps {
  document: TeachingDocument | null;
  onClose: () => void;
}

export const DocumentReaderModal: React.FC<DocumentReaderModalProps> = ({
  document: doc,
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileData, setFileData] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  // Word (.docx) HTML output
  const [wordHtml, setWordHtml] = useState<string | null>(null);
  const [wordLoading, setWordLoading] = useState(false);

  // Excel (.xlsx) parsed state
  const [workbookSheets, setWorkbookSheets] = useState<{ name: string; data: any[][] }[]>([]);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [excelSearch, setExcelSearch] = useState('');

  // Image viewer state
  const [imgZoom, setImgZoom] = useState(100);
  const [imgRotation, setImgRotation] = useState(0);

  // Determine effective file type
  const effectiveType = React.useMemo(() => {
    if (!doc) return 'txt';
    if (doc.file_type) return doc.file_type.toLowerCase();
    const name = (doc.file_name || doc.file_url || '').toLowerCase();
    if (name.endsWith('.pdf')) return 'pdf';
    if (name.endsWith('.docx') || name.endsWith('.doc')) return 'docx';
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) return 'xlsx';
    if (name.match(/\.(png|jpe?g|webp|gif|svg)$/)) return 'image';
    return 'txt';
  }, [doc]);

  // Load file data (from doc.file_data or documentStorage IndexedDB)
  useEffect(() => {
    if (!doc) {
      setFileData(null);
      setWordHtml(null);
      setWorkbookSheets([]);
      return;
    }

    let isMounted = true;
    const load = async () => {
      setLoadingFile(true);
      try {
        let data = doc.file_data;
        if (!data) {
          data = await documentStorage.getFile(doc.id);
        }
        if (isMounted) {
          setFileData(data);
          if (data) {
            parseFile(data, effectiveType);
          }
        }
      } catch (err) {
        console.warn('Error loading file from storage:', err);
      } finally {
        if (isMounted) setLoadingFile(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [doc, effectiveType]);

  // Helper to convert base64 data url to ArrayBuffer
  const base64ToArrayBuffer = (dataUrl: string): ArrayBuffer => {
    const base64 = dataUrl.split(',')[1] || dataUrl;
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Parse file contents based on type
  const parseFile = async (dataUrl: string, type: string) => {
    try {
      if (type === 'docx') {
        setWordLoading(true);
        const arrayBuffer = base64ToArrayBuffer(dataUrl);
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setWordHtml(result.value);
        setWordLoading(false);
      } else if (type === 'xlsx') {
        const arrayBuffer = base64ToArrayBuffer(dataUrl);
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        const sheets = wb.SheetNames.map((name) => {
          const sheet = wb.Sheets[name];
          const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
          return { name, data };
        });
        setWorkbookSheets(sheets);
        setActiveSheetIdx(0);
      }
    } catch (e) {
      console.warn('File parse warning:', e);
      setWordLoading(false);
    }
  };

  if (!doc) return null;

  const handleCopyText = () => {
    if (doc.content_text) {
      navigator.clipboard.writeText(doc.content_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (fileData) {
      const a = window.document.createElement('a');
      a.href = fileData;
      a.download = doc.file_name || `${doc.title}.${effectiveType === 'image' ? 'png' : effectiveType}`;
      a.click();
    } else if (doc.content_text) {
      const blob = new Blob([doc.content_text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${doc.title}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (doc.file_url) {
      window.open(doc.file_url, '_blank');
    }
  };

  // Badge icon and color by format
  const getFormatBadge = () => {
    switch (effectiveType) {
      case 'docx':
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-900/60 border border-blue-500 text-blue-300 font-bold text-[11px] flex items-center gap-1">
            <FileText className="w-3 h-3 text-blue-400" />
            <span>Microsoft Word (.docx)</span>
          </span>
        );
      case 'xlsx':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-900/60 border border-emerald-500 text-emerald-300 font-bold text-[11px] flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
            <span>Excel Spreadsheet (.xlsx)</span>
          </span>
        );
      case 'pdf':
        return (
          <span className="px-2 py-0.5 rounded-md bg-rose-900/60 border border-rose-500 text-rose-300 font-bold text-[11px] flex items-center gap-1">
            <File className="w-3 h-3 text-rose-400" />
            <span>Dokumen PDF (.pdf)</span>
          </span>
        );
      case 'image':
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-900/60 border border-purple-500 text-purple-300 font-bold text-[11px] flex items-center gap-1">
            <ImageIcon className="w-3 h-3 text-purple-400" />
            <span>Gambar / Foto</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-900/60 border border-amber-500 text-amber-300 font-bold text-[11px] flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-amber-400" />
            <span>Dokumen Kurikulum Merdeka</span>
          </span>
        );
    }
  };

  // Render markdown-like simple tables and headers
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];

    const flushTable = (key: number) => {
      if (tableBuffer.length === 0) return null;
      const rows = tableBuffer.map((r) =>
        r
          .split('|')
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          .map((c) => c.trim())
      );
      tableBuffer = [];
      const isSeparator = (r: string[]) => r.every((cell) => /^[-:]+$/.test(cell));
      const filteredRows = rows.filter((r) => !isSeparator(r));
      if (filteredRows.length === 0) return null;

      const header = filteredRows[0];
      const body = filteredRows.slice(1);

      return (
        <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/90 shadow-inner">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/90 border-b border-slate-700 text-amber-300 font-bold">
                {header.map((col, idx) => (
                  <th key={idx} className="p-2.5 border-r border-slate-700 last:border-r-0">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {body.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-800/50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5 border-r border-slate-800 last:border-r-0 leading-relaxed">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    lines.forEach((line, idx) => {
      if (line.trim().startsWith('|')) {
        tableBuffer.push(line);
      } else {
        if (tableBuffer.length > 0) {
          elements.push(flushTable(idx));
        }

        if (line.startsWith('# ')) {
          elements.push(
            <h1 key={idx} className="text-xl sm:text-2xl font-black text-white mt-6 mb-2 pb-2 border-b border-slate-700">
              {line.replace('# ', '')}
            </h1>
          );
        } else if (line.startsWith('## ')) {
          elements.push(
            <h2 key={idx} className="text-base sm:text-lg font-bold text-amber-300 mt-4 mb-2">
              {line.replace('## ', '')}
            </h2>
          );
        } else if (line.startsWith('### ')) {
          elements.push(
            <h3 key={idx} className="text-sm font-bold text-emerald-400 mt-3 mb-1.5 uppercase tracking-wide">
              {line.replace('### ', '')}
            </h3>
          );
        } else if (line.startsWith('#### ')) {
          elements.push(
            <h4 key={idx} className="text-xs font-bold text-blue-300 mt-2 mb-1">
              {line.replace('#### ', '')}
            </h4>
          );
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          elements.push(
            <li key={idx} className="ml-5 text-xs text-slate-300 list-disc my-1 leading-relaxed">
              {line.substring(2)}
            </li>
          );
        } else if (/^\d+\.\s/.test(line)) {
          elements.push(
            <div key={idx} className="text-xs text-slate-300 my-1 ml-2 leading-relaxed">
              {line}
            </div>
          );
        } else if (line.trim() === '---') {
          elements.push(<hr key={idx} className="my-4 border-slate-700" />);
        } else if (line.trim().length > 0) {
          elements.push(
            <p key={idx} className="text-xs text-slate-300 my-1.5 leading-relaxed">
              {line}
            </p>
          );
        }
      }
    });

    if (tableBuffer.length > 0) {
      elements.push(flushTable(lines.length));
    }

    return elements;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div
        className={`bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col transition-all overflow-hidden ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[92vh]'
        }`}
      >
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              {effectiveType === 'docx' ? (
                <FileText className="w-5 h-5 text-blue-400" />
              ) : effectiveType === 'xlsx' ? (
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              ) : effectiveType === 'image' ? (
                <ImageIcon className="w-5 h-5 text-purple-400" />
              ) : (
                <BookOpen className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-700 text-emerald-400 font-extrabold text-[11px] uppercase">
                  {doc.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Kelas {doc.grade_level} &bull; {doc.semester} &bull; TA {doc.academic_year}
                </span>
                {getFormatBadge()}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-xl mt-0.5">
                {doc.title}
              </h3>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {doc.content_text && (
              <button
                type="button"
                onClick={handleCopyText}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                title="Salin Teks Dokumen"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{copied ? 'Tersalin' : 'Salin Teks'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Unduh Dokumen"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Unduh</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Cetak Dokumen"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 transition-colors"
              title="Tutup Pembaca"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 text-slate-200 print:bg-white print:text-black">
          {loadingFile ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-16">
              <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs">Memuat dokumen ke pembaca...</p>
            </div>
          ) : effectiveType === 'image' && fileData ? (
            /* ================= IMAGE VIEWER ================= */
            <div className="flex flex-col items-center justify-center min-h-full">
              <div className="mb-3 flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 shadow-md">
                <button
                  onClick={() => setImgZoom((z) => Math.max(30, z - 20))}
                  className="p-1 hover:text-white"
                  title="Perkecil"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-amber-300">{imgZoom}%</span>
                <button
                  onClick={() => setImgZoom((z) => Math.min(300, z + 20))}
                  className="p-1 hover:text-white"
                  title="Perbesar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-slate-700 mx-1" />
                <button
                  onClick={() => setImgRotation((r) => (r + 90) % 360)}
                  className="p-1 hover:text-white flex items-center gap-1 text-xs"
                  title="Putar 90°"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Putar</span>
                </button>
                <button
                  onClick={() => {
                    setImgZoom(100);
                    setImgRotation(0);
                  }}
                  className="text-[11px] text-slate-400 hover:text-white ml-1 underline"
                >
                  Reset
                </button>
              </div>
              <div className="max-w-full max-h-[75vh] overflow-auto flex items-center justify-center p-2 bg-black/40 rounded-xl border border-slate-800">
                <img
                  src={fileData}
                  alt={doc.title}
                  style={{
                    transform: `scale(${imgZoom / 100}) rotate(${imgRotation}deg)`,
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-h-[70vh] object-contain rounded-lg shadow-2xl"
                />
              </div>
            </div>
          ) : effectiveType === 'pdf' && (fileData || doc.file_url) ? (
            /* ================= PDF VIEWER ================= */
            <div className="w-full h-full flex flex-col">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs text-slate-400 font-mono">Pratinjau PDF Tersemat</span>
                <a
                  href={fileData || doc.file_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Layar Baru</span>
                </a>
              </div>
              <iframe
                src={fileData || doc.file_url || ''}
                title={doc.title}
                className="w-full flex-1 rounded-xl border border-slate-800 bg-slate-900 min-h-[70vh]"
              />
            </div>
          ) : effectiveType === 'xlsx' && workbookSheets.length > 0 ? (
            /* ================= EXCEL VIEWER ================= */
            <div className="space-y-4">
              {/* Sheet tabs and search toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
                  {workbookSheets.map((sheet, idx) => (
                    <button
                      key={sheet.name}
                      onClick={() => setActiveSheetIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                        activeSheetIdx === idx
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      <span>{sheet.name}</span>
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari dalam lembar Excel..."
                    value={excelSearch}
                    onChange={(e) => setExcelSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Sheet Table */}
              <div className="overflow-x-auto border border-slate-700 rounded-xl bg-slate-900 shadow-xl max-h-[70vh]">
                {(() => {
                  const currentSheet = workbookSheets[activeSheetIdx];
                  if (!currentSheet || !currentSheet.data || currentSheet.data.length === 0) {
                    return (
                      <div className="p-12 text-center text-xs text-slate-400">
                        Lembar kerja ini tidak memiliki data.
                      </div>
                    );
                  }

                  let rows = currentSheet.data;
                  if (excelSearch.trim()) {
                    const q = excelSearch.toLowerCase();
                    rows = rows.filter((r) =>
                      r.some((cell) => String(cell || '').toLowerCase().includes(q))
                    );
                  }

                  return (
                    <table className="w-full text-xs text-left border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-800 border-b border-slate-700 text-amber-300 font-bold sticky top-0 shadow-sm">
                          <th className="p-2 border-r border-slate-700 w-10 text-center font-mono text-slate-400">
                            #
                          </th>
                          {rows[0]?.map((col: any, idx: number) => (
                            <th key={idx} className="p-2.5 border-r border-slate-700 last:border-r-0 whitespace-nowrap">
                              {String(col ?? `Kolom ${idx + 1}`)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200">
                        {rows.slice(1).map((row: any[], rIdx: number) => (
                          <tr key={rIdx} className="hover:bg-slate-800/60 transition-colors">
                            <td className="p-2 border-r border-slate-800 font-mono text-center text-slate-500 bg-slate-950/40">
                              {rIdx + 1}
                            </td>
                            {rows[0]?.map((_: any, cIdx: number) => (
                              <td
                                key={cIdx}
                                className="p-2.5 border-r border-slate-800 last:border-r-0 whitespace-pre-line"
                              >
                                {String(row[cIdx] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          ) : effectiveType === 'docx' && wordHtml ? (
            /* ================= WORD (.DOCX) HTML VIEWER ================= */
            <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-xl p-8 sm:p-12 shadow-2xl font-serif print:p-0 print:shadow-none">
              <div
                className="prose prose-slate max-w-none text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: wordHtml }}
              />
            </div>
          ) : (
            /* ================= FORMATTED TEXT / CURRICULUM READER ================= */
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl">
              {doc.description && (
                <div className="p-3.5 mb-6 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 flex items-center justify-between">
                  <span>{doc.description}</span>
                  <span className="text-[11px] font-mono text-blue-400">Kurikulum Merdeka SMP</span>
                </div>
              )}

              <div className="prose-invert max-w-none">
                {doc.content_text ? (
                  renderFormattedText(doc.content_text)
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-sm">Dokumen ini belum memiliki teks pratinjau langsung.</p>
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Tautan Dokumen</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
