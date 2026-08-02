import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  File,
} from 'lucide-react';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatCode(code: string): string {
  const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
  if (clean.length > 3) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return clean;
}

export function formatSeconds(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function getFileTypeInfo(mimeType: string, filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
    return {
      Icon: FileImage,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      badge: 'Image',
    };
  }

  if (mimeType.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
    return {
      Icon: FileVideo,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      badge: 'Video',
    };
  }

  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
    return {
      Icon: FileAudio,
      color: 'bg-pink-50 text-pink-600 border-pink-200',
      badge: 'Audio',
    };
  }

  if (
    mimeType.includes('zip') ||
    mimeType.includes('compressed') ||
    mimeType.includes('tar') ||
    ['zip', 'rar', '7z', 'gz', 'tar'].includes(ext)
  ) {
    return {
      Icon: FileArchive,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      badge: 'Archive',
    };
  }

  if (
    mimeType.includes('json') ||
    mimeType.includes('javascript') ||
    mimeType.includes('typescript') ||
    mimeType.includes('html') ||
    ['js', 'ts', 'tsx', 'jsx', 'json', 'py', 'java', 'cpp', 'css', 'html'].includes(ext)
  ) {
    return {
      Icon: FileCode,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badge: 'Code',
    };
  }

  if (
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheet') ||
    ['csv', 'xlsx', 'xls'].includes(ext)
  ) {
    return {
      Icon: FileSpreadsheet,
      color: 'bg-teal-50 text-teal-600 border-teal-200',
      badge: 'Data',
    };
  }

  if (mimeType.includes('pdf') || ext === 'pdf') {
    return {
      Icon: FileText,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
      badge: 'PDF',
    };
  }

  return {
    Icon: File,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    badge: ext.toUpperCase() || 'File',
  };
}
