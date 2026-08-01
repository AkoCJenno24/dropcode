export interface FileTransferMeta {
  code: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadTime: number;
  expiresAt: number;
  downloadsCount?: number;
}

export interface UploadResponse {
  success: boolean;
  code: string;
  file: FileTransferMeta;
  error?: string;
}

export interface FileInfoResponse {
  success: boolean;
  file?: FileTransferMeta;
  error?: string;
}
