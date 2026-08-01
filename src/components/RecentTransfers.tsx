import React from 'react';
import { Clock, Download, Upload, Copy, Check, ExternalLink } from 'lucide-react';
import { FileTransferMeta } from '../types';
import { formatBytes, formatCode, getFileTypeInfo } from '../utils/formatters';

export interface SavedTransferItem {
  type: 'upload' | 'download';
  file: FileTransferMeta;
  savedAt: number;
}

interface RecentTransfersProps {
  items: SavedTransferItem[];
  onSelectCode: (code: string) => void;
  onClear: () => void;
}

export const RecentTransfers: React.FC<RecentTransfersProps> = ({
  items,
  onSelectCode,
  onClear,
}) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  if (!items || items.length === 0) return null;

  // Filter out items expired past 30 minutes
  const activeItems = items.filter(
    (item) => item.file.expiresAt > Date.now()
  );

  if (activeItems.length === 0) return null;

  const handleCopy = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-8 bg-white/70 backdrop-blur-xs rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5">
        <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
          Active Device History ({activeItems.length})
        </span>
        <button
          onClick={onClear}
          className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-[11px]"
        >
          Clear History
        </button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {activeItems.map((item, idx) => {
          const fileInfo = getFileTypeInfo(item.file.mimeType, item.file.originalName);
          const Icon = fileInfo.Icon;

          return (
            <div
              key={`${item.file.code}-${idx}`}
              onClick={() => onSelectCode(item.file.code)}
              className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-indigo-50/40 hover:border-indigo-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg border text-xs ${
                    item.type === 'upload'
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}
                >
                  {item.type === 'upload' ? (
                    <Upload className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <span className="font-semibold text-xs text-slate-900 truncate block">
                    {item.file.originalName}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {formatBytes(item.file.size)} • Code:{' '}
                    <strong className="font-mono text-slate-800">
                      {formatCode(item.file.code)}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleCopy(e, item.file.code)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 transition-colors shadow-2xs"
                  title="Copy code"
                >
                  {copiedCode === item.file.code ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
