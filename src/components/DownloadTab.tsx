import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DownloadCloud,
  KeyRound,
  Check,
  AlertCircle,
  File,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { FileTransferMeta, FileInfoResponse } from '../types';
import { formatBytes, formatCode, getFileTypeInfo } from '../utils/formatters';
import { ExpirationTimer } from './ExpirationTimer';

import { transferService } from '../services/transferService';

interface DownloadTabProps {
  initialCode?: string;
  onDownloadSuccess?: (fileMeta: FileTransferMeta) => void;
}

export const DownloadTab: React.FC<DownloadTabProps> = ({
  initialCode = '',
  onDownloadSuccess,
}) => {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<FileTransferMeta | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (initialCode) {
      const clean = initialCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      setCode(clean);
      if (clean.length === 6) {
        fetchFileInfo(clean);
      }
    }
  }, [initialCode]);

  const fetchFileInfo = async (targetCode: string) => {
    const cleanCode = targetCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (cleanCode.length < 6) {
      setErrorMsg('Please enter a valid 6-character transfer code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setFileMeta(null);

    try {
      const data = await transferService.getFileInfo(cleanCode);

      if (data.success && data.file) {
        setFileMeta(data.file);
      } else {
        setErrorMsg(data.error || 'File not found or code expired.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error fetching file details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    setCode(val);
    setErrorMsg(null);
    if (val.length === 6) {
      fetchFileInfo(val);
    }
  };

  const triggerDownload = async () => {
    if (!fileMeta) return;

    setDownloading(true);
    setDownloadProgress(10);

    try {
      const res = await transferService.getDownloadUrl(fileMeta.code);
      if (!res.success || !res.url) {
        setDownloading(false);
        setErrorMsg(res.error || 'Could not fetch download URL.');
        return;
      }

      setDownloadProgress(60);

      // Create hidden link element for downloading
      const a = document.createElement('a');
      a.href = res.url;
      a.download = fileMeta.originalName;
      a.target = '_blank';
      document.body.appendChild(a);
      
      setDownloadProgress(100);

      setTimeout(() => {
        a.click();
        document.body.removeChild(a);
        setDownloading(false);
        if (onDownloadSuccess) onDownloadSuccess(fileMeta);
      }, 400);
    } catch (err: any) {
      setDownloading(false);
      setErrorMsg(err?.message || 'Failed downloading file.');
    }
  };

  const resetForm = () => {
    setCode('');
    setFileMeta(null);
    setErrorMsg(null);
    setDownloading(false);
    setDownloadProgress(0);
  };

  const fileTypeInfo = fileMeta
    ? getFileTypeInfo(fileMeta.mimeType, fileMeta.originalName)
    : null;
  const TypeIcon = fileTypeInfo ? fileTypeInfo.Icon : File;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 p-6 sm:p-8 space-y-6">
      {!fileMeta ? (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-2">
              <KeyRound className="w-6 h-6 stroke-[2]" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Enter Transfer Code
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              Enter the 6-character code from your sending device to receive your file.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 6-character code input presentation */}
          <div className="space-y-4">
            <div className="relative max-w-xs mx-auto">
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={handleCodeChange}
                placeholder="X7KP9M"
                className="w-full text-center font-mono text-3xl font-extrabold uppercase tracking-[0.3em] py-4 px-4 rounded-2xl border-2 border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300 placeholder:tracking-[0.2em] bg-slate-50/50"
              />
            </div>

            <button
              onClick={() => fetchFileInfo(code)}
              disabled={code.length < 6 || loading}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                code.length === 6 && !loading
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25'
                  : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Locating File...</span>
                </>
              ) : (
                <>
                  <span>Find File</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* File Ready View */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-2">
              <DownloadCloud className="w-6 h-6 stroke-[2]" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              File Ready for Download
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Transfer Code: <strong className="font-mono text-slate-800">{formatCode(fileMeta.code)}</strong>
            </p>
          </div>

          {/* Detailed File Card */}
          <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={`p-3 rounded-xl border ${fileTypeInfo?.color}`}>
                <TypeIcon className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {fileMeta.originalName}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {formatBytes(fileMeta.size)} • {fileTypeInfo?.badge}
                </p>
              </div>
            </div>
          </div>

          {/* Expiration Timer */}
          <ExpirationTimer
            expiresAt={fileMeta.expiresAt}
            onExpired={() => {
              setErrorMsg('This file link has expired.');
              setFileMeta(null);
            }}
          />

          {/* Download progress */}
          {downloading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Preparing Download...</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-150 rounded-full"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Download Action Button */}
          {!downloading && (
            <button
              onClick={triggerDownload}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <DownloadCloud className="w-5 h-5 stroke-[2.2]" />
              <span>Download File ({formatBytes(fileMeta.size)})</span>
            </button>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
            <button
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Enter another code
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
