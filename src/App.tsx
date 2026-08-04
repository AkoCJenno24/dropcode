import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, DownloadCloud, ShieldCheck, Zap, Lock, Sparkles, Smartphone, ArrowRight } from 'lucide-react';
import { Header } from './components/Header';
import { UploadTab } from './components/UploadTab';
import { DownloadTab } from './components/DownloadTab';
import { HowItWorksModal } from './components/HowItWorksModal';
import { RecentTransfers, SavedTransferItem } from './components/RecentTransfers';
import { FileTransferMeta } from './types';
import { transferService } from './services/transferService';
import { ToastProvider } from './components/Toast';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<'upload' | 'download'>('upload');
  const [downloadCode, setDownloadCode] = useState<string>('');
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<SavedTransferItem[]>([]);

  // Read URL parameters / Hash for direct code links
  useEffect(() => {
    const checkHashAndParams = () => {
      const hash = window.location.hash;
      const search = window.location.search;

      let foundCode = '';
      if (hash.includes('code=')) {
        foundCode = hash.split('code=')[1].split('&')[0];
      } else if (search.includes('code=')) {
        const params = new URLSearchParams(search);
        foundCode = params.get('code') || '';
      }

      if (foundCode) {
        setDownloadCode(foundCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase());
        setActiveTab('download');
      }
    };

    checkHashAndParams();
    window.addEventListener('hashchange', checkHashAndParams);
    return () => window.removeEventListener('hashchange', checkHashAndParams);
  }, []);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dropcode_history');
      if (saved) {
        const parsed = JSON.parse(saved) as SavedTransferItem[];
        // filter expired
        const valid = parsed.filter((item) => item.file.expiresAt > Date.now());
        setHistoryItems(valid);
      }
    } catch (e) {}
  }, []);

  const saveToHistory = (type: 'upload' | 'download', file: FileTransferMeta) => {
    const newItem: SavedTransferItem = {
      type,
      file,
      savedAt: Date.now(),
    };

    setHistoryItems((prev) => {
      const filtered = prev.filter((i) => i.file.code !== file.code);
      const updated = [newItem, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('dropcode_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleSelectCodeFromHistory = (code: string) => {
    setDownloadCode(code);
    setActiveTab('download');
  };

  const handleClearHistory = () => {
    setHistoryItems([]);
    try {
      localStorage.removeItem('dropcode_history');
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white pb-16">
      {/* Navigation Header */}
      <Header
        onOpenHowItWorks={() => setHowItWorksOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 flex flex-col justify-center">
        {/* Landing Page Hero Section */}
        <section className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100/90 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>No login • No app • No email</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
            Transfer files between your devices <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">instantly</span>
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-slate-500 max-w-lg mx-auto leading-relaxed font-medium">
            Upload your file, enter the 6-character code, and download it from any device in seconds.
          </p>
        </section>

        {/* Primary/Secondary CTA Tab Switcher */}
        <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center mb-6 border border-slate-300/60 shadow-inner">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-md shadow-slate-200/60 ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>Send File</span>
          </button>

          <button
            onClick={() => setActiveTab('download')}
            className={`flex-1 py-3.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
              activeTab === 'download'
                ? 'bg-white text-slate-900 shadow-md shadow-slate-200/60 ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DownloadCloud className="w-4 h-4 text-indigo-600" />
            <span>Receive File</span>
          </button>
        </div>

        {/* Active Tab Component */}
        <AnimatePresence mode="wait">
          {activeTab === 'upload' ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <UploadTab
                onUploadSuccess={(fileMeta) => saveToHistory('upload', fileMeta)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="download"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <DownloadTab
                initialCode={downloadCode}
                onDownloadSuccess={(fileMeta) => saveToHistory('download', fileMeta)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Device History List */}
        <RecentTransfers
          items={historyItems}
          onSelectCode={handleSelectCodeFromHistory}
          onClear={handleClearHistory}
        />
      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-slate-400 space-y-3 px-4">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-slate-500 font-semibold text-xs">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> 30-min Auto Expiration
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-indigo-600" /> Encrypted Endpoint
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-violet-600" /> iOS & Android Ready
          </span>
        </div>
        <p>© {new Date().getFullYear()} DropCode. Built for effortless cross-device sharing.</p>
      </footer>

      {/* How it works modal */}
      <HowItWorksModal
        isOpen={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
