export const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'msi', 'bat', 'cmd', 'dll', 'js', 'vbs', 'ps1', 'apk',
  'com', 'scr', 'pif', 'application', 'hta', 'cpl', 'msc', 'jar', 'sh', 'php'
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
  category?: 'validation' | 'security' | 'session';
}

// In-session tracking for abuse prevention
interface SessionTrack {
  lastUploadTime: number;
  uploadCount: number;
  recentHashes: Set<string>;
}

const sessionStore: SessionTrack = {
  lastUploadTime: 0,
  uploadCount: 0,
  recentHashes: new Set<string>(),
};

const MAX_UPLOADS_PER_SESSION = 25;
const COOLDOWN_SECONDS = 3;

export function validateUploadFile(file: File, maxSizeBytes = 100 * 1024 * 1024): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.', category: 'validation' };
  }

  // Size validation
  if (file.size <= 0) {
    return { valid: false, error: 'File is empty or corrupted (0 bytes).', category: 'validation' };
  }

  if (file.size > maxSizeBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size (${sizeMB} MB) exceeds maximum allowed limit of 100 MB.`, category: 'validation' };
  }

  // Extension validation
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File type .${ext} is restricted for security reasons. Executable or script files are not allowed.`,
      category: 'security',
    };
  }

  // Duplicate upload detection in current session
  const fileHash = `${file.name}_${file.size}_${file.lastModified}`;
  if (sessionStore.recentHashes.has(fileHash)) {
    return {
      valid: false,
      error: 'You have already uploaded this exact file recently in this session.',
      category: 'validation',
    };
  }

  // Session rate limiting checks
  const now = Date.now();
  if (sessionStore.lastUploadTime > 0 && now - sessionStore.lastUploadTime < COOLDOWN_SECONDS * 1000) {
    const waitSec = Math.ceil((COOLDOWN_SECONDS * 1000 - (now - sessionStore.lastUploadTime)) / 1000);
    return {
      valid: false,
      error: `Please wait ${waitSec} second(s) before uploading another file.`,
      category: 'session',
    };
  }

  if (sessionStore.uploadCount >= MAX_UPLOADS_PER_SESSION) {
    return {
      valid: false,
      error: 'Upload limit reached for this session. Please refresh the page to start a new session.',
      category: 'session',
    };
  }

  return { valid: true };
}

export function recordSessionUpload(file: File) {
  sessionStore.lastUploadTime = Date.now();
  sessionStore.uploadCount += 1;
  const fileHash = `${file.name}_${file.size}_${file.lastModified}`;
  sessionStore.recentHashes.add(fileHash);
}

