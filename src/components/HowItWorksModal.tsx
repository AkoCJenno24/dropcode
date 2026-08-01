import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UploadCloud, KeyRound, DownloadCloud, Clock, ShieldCheck, HardDrive } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">How DropCode Works</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              DropCode lets you send files between any of your devices instantly using short 6-digit codes. No logins, accounts, or setup required.
            </p>

            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-indigo-600" /> Upload File
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select or drag any file up to 100 MB on your phone, tablet, or desktop.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-indigo-600" /> Get Your 6-Digit Code
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Instantly receive a short transfer code, share link, or QR code to scan.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                    <DownloadCloud className="w-4 h-4 text-indigo-600" /> Enter Code & Download
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Type the code on your receiver device and download your file in seconds.
                  </p>
                </div>
              </div>
            </div>

            {/* Guarantees pill grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Expires in 30 mins</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <HardDrive className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>100 MB max size</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>No account required</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <X className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Auto-deleted after 30m</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
