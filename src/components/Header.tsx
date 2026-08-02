import React from 'react';
import { ArrowLeftRight, HelpCircle, ShieldCheck, Zap, Server } from 'lucide-react';
import { transferService } from '../services/transferService';

interface HeaderProps {
  onOpenHowItWorks: () => void;
  activeCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHowItWorks, activeCount = 0 }) => {
  const isCloudConfigured = transferService.isConfigured();

  return (
    <header className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 flex items-center justify-between border-b border-slate-200/80 mb-6 sm:mb-8">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25 ring-4 ring-indigo-50">
          <ArrowLeftRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Drop<span className="text-indigo-600">Code</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Zap className="w-3 h-3 text-indigo-600" /> Instant
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium hidden xs:block">Cross-device file sharing made effortless</p>
        </div>
      </div>

      {/* Action controls & status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Connectivity Status Badge */}
        <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100/80 border border-slate-200 text-slate-700">
          <span className={`w-2 h-2 rounded-full ${isCloudConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-[11px]">
            {isCloudConfigured ? 'Supabase Backend Active' : 'Local Fallback Mode'}
          </span>
        </div>

        {activeCount > 0 && (
          <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {activeCount} active transfer{activeCount > 1 ? 's' : ''}
          </span>
        )}

        <button
          onClick={onOpenHowItWorks}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-all cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          title="How DropCode works"
          aria-label="Open instructions on how DropCode works"
        >
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span>How it works</span>
        </button>
      </div>
    </header>
  );
};
