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
  ExternalLink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatBytes, formatCode, getFileTypeInfo } from '../utils/formatters';
import { ExpirationTimer } from './ExpirationTimer';
import { FileTransferMeta, UploadResponse } from '../types';
import { validateUploadFile } from '../utils/fileValidation';

import { transferService } from '../services/transferService';

interface UploadTabProps {
  onUploadSuccess?: (fileMeta: FileTransferMeta) => void;
}

export const UploadTab: React.FC<UploadTabProps> = ({ onUploadSuccess }) => {
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
      setErrorMsg(validation.error || 'Invalid file.');
      return;
    }

    setSelectedFile(file);
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
    if (!selectedFile) return;

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
        if (onUploadSuccess) onUploadSuccess(res.file);
      } else {
        setErrorMsg(res.error || 'Failed to upload file.');
      }
    } catch (err: any) {
      setIsUploading(false);
      setErrorMsg(err?.message || 'Error occurred during upload.');
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
    navigator.clipboard.writeText(uploadedFile.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const shareUrl = uploadedFile
    ? `${window.location.origin}/#code=${uploadedFile.code}`
    : '';

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Render Result view if file is uploaded
  if (uploadedFile) {
    const fileTypeInfo = getFileTypeInfo(uploadedFile.mimeType, uploadedFile.originalName);
    const TypeIcon = fileTypeInfo.Icon;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 p-6 sm:p-8 space-y-6"
      >
        {/* Success Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-2">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Ready to Transfer!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Enter this code on your target device or scan the QR code to download instantly.
          </p>
        </div>

        {/* Big Code Card */}
        <div className="bg-gradient-to-br from-indigo-50/70 via-slate-50 to-purple-50/50 rounded-2xl border border-indigo-100/80 p-6 text-center shadow-inner space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600/90">
            Transfer Code
          </span>

          <div className="font-mono text-4xl sm:text-5xl font-black text-slate-900 tracking-widest my-1 select-all">
            {formatCode(uploadedFile.code)}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={copyCode}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                copiedCode
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
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
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-slate-500" />
              <span>{showQr ? 'Hide QR' : 'QR Code'}</span>
            </button>
          </div>

          {/* QR Code toggle box */}
          <AnimatePresence>
            {showQr && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 flex flex-col items-center justify-center overflow-hidden"
              >
                <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200">
                  <QRCodeSVG value={shareUrl} size={150} level="M" />
                </div>
                <span className="text-[11px] text-slate-500 mt-2 font-medium">
                  Scan with your mobile camera to open direct download
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* File summary */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl border ${fileTypeInfo.color}`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-slate-900 truncate block">
                {uploadedFile.originalName}
              </span>
              <span className="text-slate-500 text-[11px]">
                {formatBytes(uploadedFile.size)} • {fileTypeInfo.badge}
              </span>
            </div>
          </div>
        </div>

        {/* Expiration Timer */}
        <ExpirationTimer
          expiresAt={uploadedFile.expiresAt}
          onExpired={() => {
            setErrorMsg('This transfer code has expired.');
          }}
        />

        {/* Reset / Action Buttons */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={resetUpload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Send Another File
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
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
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
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-xs">
            <UploadCloud className="w-8 h-8 stroke-[1.8]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Drag & drop your file here, or{' '}
              <span className="text-indigo-600 hover:underline">browse</span>
            </h3>
            <p className="text-xs text-slate-500">
              Any file type (Images, PDFs, Videos, Zips) up to <strong className="text-slate-700 font-semibold">100 MB</strong>
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/60 text-slate-600 text-[11px] font-medium mt-1">
            <span>🔒 Files auto-expire in 30 minutes</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Selected Preview */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-3 rounded-xl border ${typeInfo?.color}`}>
                <SelectedIcon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-slate-500">
                  {formatBytes(selectedFile.size)} • {typeInfo?.badge}
                </p>
              </div>
            </div>

            {!isUploading && (
              <button
                onClick={() => setSelectedFile(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Uploading file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          {!isUploading && (
            <button
              onClick={startUpload}
              className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
