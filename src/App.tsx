import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, DownloadCloud, ShieldCheck, Zap, Lock, Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { UploadTab } from './components/UploadTab';
import { DownloadTab } from './components/DownloadTab';
import { HowItWorksModal } from './components/HowItWorksModal';
import { RecentTransfers, SavedTransferItem } from './components/RecentTransfers';
import { FileTransferMeta } from './types';

import { transferService } from './services/transferService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'download'>('upload');
  const [downloadCode, setDownloadCode] = useState<string>('');
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<SavedTransferItem[]>([]);
  const [activeCount, setActiveCount] = useState(0);

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
        setDownloadCode(foundCode.replace(/\D/g, ''));
        setActiveTab('download');
      }
    };

    checkHashAndParams();
    window.addEventListener('hashchange', checkHashAndParams);
    return () => window.removeEventListener('hashchange', checkHashAndParams);
  }, []);

  // Fetch active transfers stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const count = await transferService.getActiveStats();
        setActiveCount(count);
      } catch (e) {
        // quiet error handle
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-12">
      {/* Header */}
      <Header
        onOpenHowItWorks={() => setHowItWorksOpen(true)}
        activeCount={activeCount}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 flex flex-col justify-center">
        {/* Sub-header tagline */}
        <div className="text-center mb-6 space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100/80 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            No accounts required • 100% Free
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Send files anywhere in <span className="text-indigo-600">seconds</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Temporary peer transfers with auto-deleting 6-digit codes.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-200/70 p-1.5 rounded-2xl flex items-center mb-6 border border-slate-300/60 shadow-inner">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>Send File</span>
          </button>

          <button
            onClick={() => setActiveTab('download')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'download'
                ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DownloadCloud className="w-4 h-4 text-indigo-600" />
            <span>Receive File</span>
          </button>
        </div>

        {/* Active Tab Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'upload' ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.18 }}
            >
              <UploadTab
                onUploadSuccess={(fileMeta) => saveToHistory('upload', fileMeta)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="download"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
            >
              <DownloadTab
                initialCode={downloadCode}
                onDownloadSuccess={(fileMeta) => saveToHistory('download', fileMeta)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Transfer Items on Device */}
        <RecentTransfers
          items={historyItems}
          onSelectCode={handleSelectCodeFromHistory}
          onClear={handleClearHistory}
        />
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-center gap-4 text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 30-min Auto Expiration
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-indigo-600" /> Encrypted Endpoint
          </span>
          <span>•</span>
          <span>Max 100 MB</span>
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
