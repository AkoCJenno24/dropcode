import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  File,
  Check,
  Copy,
  QrCode,
  RefreshCw,
  AlertCircle,
  Share2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Lock,
  Sparkles,
  Smartphone,
  Clock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatBytes, formatCode, getFileTypeInfo } from '../utils/formatters';
import { ExpirationTimer } from './ExpirationTimer';
import { FileTransferMeta } from '../types';
import { validateUploadFile } from '../utils/fileValidation';
import { transferService } from '../services/transferService';
import { useToast } from './Toast';

interface UploadTabProps {
  onUploadSuccess?: (fileMeta: FileTransferMeta) => void;
}

export const UploadTab: React.FC<UploadTabProps> = ({ onUploadSuccess }) => {
  const { showToast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Uploaded state
  const [uploadedFile, setUploadedFile] = useState<FileTransferMeta | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    setErrorMsg(null);
    if (!file) return;

    const validation = validateUploadFile(file);
    if (!validation.valid) {
      const msg = validation.error || 'Invalid file.';
      setErrorMsg(msg);
      showToast(msg, undefined, 'error');
      return;
    }

    setSelectedFile(file);
    showToast('File selected', `${file.name} (${formatBytes(file.size)})`, 'info');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const startUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMsg(null);

    try {
      const res = await transferService.uploadFile(selectedFile, (percentage) => {
        setUploadProgress(percentage);
      });

      setIsUploading(false);

      if (res.success && res.file) {
        setUploadedFile(res.file);
        showToast('Upload Complete!', `Transfer code: ${formatCode(res.file.code)}`, 'success');
        if (onUploadSuccess) onUploadSuccess(res.file);
      } else {
        const msg = res.error || 'Failed to upload file.';
        setErrorMsg(msg);
        showToast('Upload Failed', msg, 'error');
      }
    } catch (err: any) {
      setIsUploading(false);
      const msg = err?.message || 'Error occurred during upload.';
      setErrorMsg(msg);
      showToast('Upload Error', msg, 'error');
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setErrorMsg(null);
    setCopiedCode(false);
    setCopiedLink(false);
    setShowQr(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyCode = () => {
    if (!uploadedFile) return;
    const formatted = formatCode(uploadedFile.code);
    navigator.clipboard.writeText(formatted);
    setCopiedCode(true);
    showToast('Code Copied!', `${formatted} saved to clipboard`, 'success');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const shareUrl = uploadedFile
    ? `${window.location.origin}/#code=${uploadedFile.code}`
    : '';

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    showToast('Link Copied!', 'Direct download URL copied to clipboard', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Render Result view if file is uploaded
  if (uploadedFile) {
    const fileTypeInfo = getFileTypeInfo(uploadedFile.mimeType, uploadedFile.originalName);
    const TypeIcon = fileTypeInfo.Icon;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 p-6 sm:p-8 space-y-6"
      >
        {/* Success Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 mb-2 shadow-sm ring-4 ring-emerald-50">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Your transfer is ready!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Enter this code on your target device or scan the QR code to download instantly.
          </p>
        </div>

        {/* Transfer Code Card */}
        <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 rounded-3xl border border-indigo-100 p-6 text-center shadow-inner space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/70 text-indigo-700 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-indigo-600" /> Transfer Code
          </div>

          <div className="font-mono text-4xl sm:text-5xl font-black text-slate-900 tracking-widest my-1 select-all focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1">
            {formatCode(uploadedFile.code)}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={copyCode}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                copiedCode
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25'
              }`}
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4" /> Copied Code!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy Code
                </>
              )}
            </button>

            <button
              onClick={copyLink}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                copiedLink
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" /> Link Copied
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-500" /> Copy Link
                </>
              )}
            </button>

            <button
              onClick={() => setShowQr(!showQr)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <QrCode className="w-4 h-4 text-slate-500" />
              <span>{showQr ? 'Hide QR' : 'QR Code'}</span>
            </button>
          </div>

          {/* Collapsible QR Code */}
          <AnimatePresence>
            {showQr && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 flex flex-col items-center justify-center overflow-hidden"
              >
                <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200/80">
                  <QRCodeSVG value={shareUrl} size={160} level="M" />
                </div>
                <span className="text-[11px] text-slate-500 mt-2 font-semibold">
                  Scan with camera to open direct download
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* File Details Summary */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-3 rounded-xl border ${fileTypeInfo.color}`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-900 truncate block text-xs sm:text-sm">
                {uploadedFile.originalName}
              </span>
              <span className="text-slate-500 text-[11px]">
                {formatBytes(uploadedFile.size)} • {fileTypeInfo.badge}
              </span>
            </div>
          </div>

          {/* Security badge slot */}
          <div className="hidden xs:flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified
          </div>
        </div>

        {/* Expiration Note */}
        <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 font-medium">
          <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Your code will expire and file will be deleted if not downloaded within 30 minutes.</span>
        </div>

        {/* Reset / Action Buttons */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={resetUpload}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <RefreshCw className="w-4 h-4 text-indigo-600" /> Send Another File
          </button>
        </div>
      </motion.div>
    );
  }

  // Render Dropzone / File Select View
  const typeInfo = selectedFile
    ? getFileTypeInfo(selectedFile.type, selectedFile.name)
    : null;
  const SelectedIcon = typeInfo ? typeInfo.Icon : File;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 p-6 sm:p-8 space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
      />

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
            dragActive
              ? 'border-indigo-600 bg-indigo-50/70 scale-[1.01] shadow-lg shadow-indigo-500/10'
              : 'border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-slate-50'
          }`}
          role="button"
          aria-label="File upload dropzone. Click or drag a file to upload."
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-50 to-indigo-100 text-indigo-600 border border-indigo-200/80 flex items-center justify-center shadow-sm">
            <UploadCloud className="w-8 h-8 stroke-[1.8]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              Drag & drop your file here, or{' '}
              <span className="text-indigo-600 underline underline-offset-4 decoration-indigo-300">browse</span>
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Supports Documents, Images, Archives & Videos up to <strong className="text-slate-700 font-bold">100 MB</strong>
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200/70 text-slate-700 text-[11px] font-semibold mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Files automatically expire after 30 minutes</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Selected Card */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/90 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={`p-3 rounded-xl border ${typeInfo?.color}`}>
                <SelectedIcon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-extrabold text-slate-900 truncate">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {formatBytes(selectedFile.size)} • {typeInfo?.badge}
                </p>
              </div>
            </div>

            {!isUploading && (
              <button
                onClick={() => setSelectedFile(null)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer focus:ring-2 focus:ring-rose-500 focus:outline-none"
                title="Remove selected file"
                aria-label="Remove selected file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>Uploading to secure storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Generate Transfer Code CTA Button */}
          {!isUploading && (
            <button
              onClick={startUpload}
              disabled={isUploading}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer focus:ring-4 focus:ring-indigo-100 focus:outline-none disabled:opacity-50"
            >
              <span>Generate Transfer Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
