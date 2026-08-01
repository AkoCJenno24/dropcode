import React from 'react';
import { ArrowLeftRight, HelpCircle, ShieldCheck, Zap } from 'lucide-react';

interface HeaderProps {
  onOpenHowItWorks: () => void;
  activeCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHowItWorks, activeCount = 0 }) => {
  return (
    <header className="w-full max-w-5xl mx-auto px-4 py-5 flex items-center justify-between border-b border-slate-200/60 mb-6 sm:mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <ArrowLeftRight className="w-5.5 h-5.5 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Drop<span className="text-indigo-600">Code</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Zap className="w-3 h-3 text-indigo-600" /> Instant Transfer
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Cross-device file sharing made effortless</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {activeCount > 0 && (
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {activeCount} active transfer{activeCount > 1 ? 's' : ''}
          </span>
        )}

        <button
          onClick={onOpenHowItWorks}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs transition-all cursor-pointer"
          title="How DropCode works"
        >
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>How it works</span>
        </button>
      </div>
    </header>
  );
};
