import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DownloadCloud,
  File,
  Check,
  AlertCircle,
  Search,
  Lock,
  ArrowRight,
  RefreshCw,
  HardDrive,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { formatBytes, formatCode, getFileTypeInfo } from '../utils/formatters';
import { ExpirationTimer } from './ExpirationTimer';
import { FileTransferMeta } from '../types';
import { transferService } from '../services/transferService';
import { useToast } from './Toast';

interface DownloadTabProps {
  initialCode?: string;
  onDownloadSuccess?: (fileMeta: FileTransferMeta) => void;
}

export const DownloadTab: React.FC<DownloadTabProps> = ({
  initialCode = '',
  onDownloadSuccess,
}) => {
  const { showToast } = useToast();
  const [code, setCode] = useState(initialCode);
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [fileMeta, setFileMeta] = useState<FileTransferMeta | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadComplete, setDownloadComplete] = useState(false);

  // Auto-search if code is pre-filled from link
  useEffect(() => {
    if (initialCode && initialCode.length >= 6) {
      setCode(initialCode.toUpperCase());
      fetchFileMeta(initialCode.toUpperCase());
    }
  }, [initialCode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    setCode(raw);
    setErrorMsg(null);
    setFileMeta(null);
    setDownloadComplete(false);

    if (raw.length === 6) {
      fetchFileMeta(raw);
    }
  };

  const fetchFileMeta = async (targetCode: string) => {
    const cleanCode = targetCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMsg('Please enter a valid 6-character code.');
      showToast('Invalid Code', 'Please enter a 6-character transfer code.', 'warning');
      return;
    }

    setIsSearching(true);
    setErrorMsg(null);
    setFileMeta(null);

    try {
      const res = await transferService.getTransferMeta(cleanCode);
      setIsSearching(false);

      if (res.success && res.meta) {
        setFileMeta(res.meta);
        showToast('File Found!', res.meta.originalName, 'success');
      } else {
        const msg = res.error || 'Transfer code not found or expired.';
        setErrorMsg(msg);
        showToast('Lookup Failed', msg, 'error');
      }
    } catch (err: any) {
      setIsSearching(false);
      const msg = err?.message || 'Failed to locate file.';
      setErrorMsg(msg);
      showToast('Error', msg, 'error');
    }
  };

  const executeDownload = async () => {
    if (!fileMeta || isDownloading) return;

    setIsDownloading(true);
    setDownloadProgress(20);
    setErrorMsg(null);

    try {
      showToast('Starting Download', `Downloading ${fileMeta.originalName}...`, 'info');
      const res = await transferService.downloadFile(fileMeta.code, (percentage) => {
        setDownloadProgress(percentage);
      });

      setIsDownloading(false);

      if (res.success) {
        setDownloadComplete(true);
        showToast('Download Completed!', fileMeta.originalName, 'success');
        if (onDownloadSuccess) onDownloadSuccess(fileMeta);
      } else {
        const msg = res.error || 'Failed to download file.';
        setErrorMsg(msg);
        showToast('Download Failed', msg, 'error');
      }
    } catch (err: any) {
      setIsDownloading(false);
      const msg = err?.message || 'Error occurred during download.';
      setErrorMsg(msg);
      showToast('Download Error', msg, 'error');
    }
  };

  const resetForm = () => {
    setCode('');
    setFileMeta(null);
    setErrorMsg(null);
    setDownloadComplete(false);
    setIsDownloading(false);
    setDownloadProgress(0);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 p-6 sm:p-8 space-y-6">
      {!fileMeta ? (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-2 shadow-xs ring-4 ring-indigo-50/60">
              <DownloadCloud className="w-6 h-6 stroke-[2]" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Enter Transfer Code
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              Enter the 6-character code from your sending device to receive your file.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Code Input Box */}
          <div className="space-y-4">
            <div className="relative max-w-xs mx-auto">
              <input
                type="text"
                maxLength={7}
                value={formatCode(code)}
                onChange={handleCodeChange}
                placeholder="X7K-P9M"
                disabled={isSearching}
                className="w-full text-center font-mono text-3xl font-black uppercase tracking-[0.2em] py-4 px-4 rounded-2xl border-2 border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300 placeholder:tracking-[0.2em] bg-slate-50/50 text-slate-900"
                aria-label="6-character transfer code input"
              />
            </div>

            <button
              onClick={() => fetchFileMeta(code)}
              disabled={isSearching || code.length < 6}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer focus:ring-4 focus:ring-indigo-100 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching Code...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Locate File</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* File Found Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 mb-2 shadow-xs ring-4 ring-indigo-50">
              <File className="w-6 h-6 stroke-[2]" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              File Available for Download
            </h2>
            <p className="text-xs text-slate-500">
              Code: <span className="font-mono font-bold text-slate-800">{formatCode(fileMeta.code)}</span>
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Detailed File Info Card */}
          {(() => {
            const fileTypeInfo = getFileTypeInfo(fileMeta.mimeType, fileMeta.originalName);
            const TypeIcon = fileTypeInfo.Icon;

            return (
              <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 rounded-3xl border border-slate-200/90 p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`p-3.5 rounded-2xl border ${fileTypeInfo.color}`}>
                    <TypeIcon className="w-7 h-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-extrabold text-slate-900 truncate">
                      {fileMeta.originalName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{formatBytes(fileMeta.size)}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">{fileTypeInfo.badge}</span>
                      {fileMeta.downloadCount !== undefined && (
                        <>
                          <span>•</span>
                          <span>{fileMeta.downloadCount} download{fileMeta.downloadCount === 1 ? '' : 's'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expiration Timer */}
                <ExpirationTimer
                  expiresAt={fileMeta.expiresAt}
                  onExpired={() => {
                    setErrorMsg('This transfer has expired.');
                    showToast('Expired', 'This transfer has expired.', 'warning');
                  }}
                />
              </div>
            );
          })()}

          {/* Download Progress Bar */}
          {isDownloading && (
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>Downloading file...</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-200 rounded-full"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Complete Banner */}
          {downloadComplete && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                <span>File saved to your device downloads!</span>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="space-y-3 pt-2">
            {!isDownloading && !downloadComplete && (
              <button
                onClick={executeDownload}
                className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer focus:ring-4 focus:ring-indigo-100 focus:outline-none"
              >
                <DownloadCloud className="w-5 h-5" />
                <span>Download File Now</span>
              </button>
            )}

            <button
              onClick={resetForm}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-slate-300 focus:outline-none"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Receive Another File</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
