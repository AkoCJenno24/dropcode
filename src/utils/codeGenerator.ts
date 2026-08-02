// Cryptographically secure random transfer code generator
const SAFE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateTransferCode(length: number = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  
  let code = '';
  for (let i = 0; i < length; i++) {
    code += SAFE_CHARSET[bytes[i] % SAFE_CHARSET.length];
  }
  return code;
}

export function formatTransferCodeDisplay(code: string): string {
  const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length === 6) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return clean;
}
