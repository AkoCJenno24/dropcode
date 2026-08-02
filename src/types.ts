export type TransferStatus = 'active' | 'expired' | 'deleted' | 'failed';

export interface FileTransferMeta {
  code: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadTime: number;
  expiresAt: number;
  downloadsCount?: number;
  lastDownloadedAt?: number | null;
  status?: TransferStatus;
}

export interface UploadResponse {
  success: boolean;
  code?: string;
  file?: FileTransferMeta;
  error?: string;
}

export interface FileInfoResponse {
  success: boolean;
  file?: FileTransferMeta;
  error?: string;
}

// Abuse protection & Security extensions context
export interface SecurityContext {
  clientIp?: string;
  captchaToken?: string;
}

