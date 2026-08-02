export const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'msi', 'bat', 'cmd', 'dll', 'js', 'vbs', 'ps1', 'apk',
  'com', 'scr', 'pif', 'application', 'hta', 'cpl', 'msc', 'jar'
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUploadFile(file: File, maxSizeBytes = 100 * 1024 * 1024): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Size validation
  if (file.size <= 0) {
    return { valid: false, error: 'File is empty.' };
  }

  if (file.size > maxSizeBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size (${sizeMB} MB) exceeds maximum allowed limit of 100 MB.` };
  }

  // Extension validation
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File type .${ext} is restricted for security reasons. Executable or script files are not allowed.`,
    };
  }

  return { valid: true };
}
