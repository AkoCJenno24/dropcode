import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FileTransferMeta, SecurityContext } from '../types';
import { generateTransferCode } from '../utils/codeGenerator';
import { validateUploadFile, recordSessionUpload } from '../utils/fileValidation';

const STORAGE_BUCKET = 'transfers';
const TABLE_NAME = 'transfers';

// Get configurable expiration minutes (default: 30)
function getExpirationMinutes(): number {
  const envVal = import.meta.env.VITE_TRANSFER_EXPIRATION_MINUTES;
  const parsed = parseInt(envVal, 10);
  return !isNaN(parsed) && parsed > 0 ? parsed : 30;
}

// In-memory / Local storage fallback state when Supabase env vars are empty
const fallbackRegistry = new Map<string, { meta: FileTransferMeta; blob: Blob }>();

// Generates a UUID-based storage path: uploads/YYYY/MM/{uuid}.ext
function generateStoragePath(fileName: string): string {
  const fileExt = fileName.split('.').pop() || 'bin';
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const uuid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  return `uploads/${year}/${month}/${uuid}.${fileExt}`;
}

export const transferService = {
  isConfigured(): boolean {
    return isSupabaseConfigured;
  },

  /**
   * Abuse protection hook placeholder
   * Supports IP rate limits, Turnstile / reCAPTCHA validation in future extensions
   */
  async verifyAbuseLimits(_context?: SecurityContext): Promise<{ allowed: boolean; error?: string }> {
    return { allowed: true };
  },

  /**
   * Upload file to Supabase Storage & Database
   */
  async uploadFile(
    file: File,
    onProgress?: (percentage: number) => void,
    securityContext?: SecurityContext
  ): Promise<{ success: boolean; code?: string; file?: FileTransferMeta; error?: string }> {
    // 1. Strict File Validation (Max 100MB, restricted executable extensions)
    const validation = validateUploadFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 2. Check Abuse Protection limits
    const abuseCheck = await this.verifyAbuseLimits(securityContext);
    if (!abuseCheck.allowed) {
      return { success: false, error: abuseCheck.error || 'Upload request blocked by security limits.' };
    }

    const expirationMinutes = getExpirationMinutes();
    const now = Date.now();
    const expiresAtMs = now + expirationMinutes * 60 * 1000;
    const expiresAtIso = new Date(expiresAtMs).toISOString();
    const createdAtIso = new Date(now).toISOString();

    if (onProgress) onProgress(10);

    // Real Supabase backend execution
    if (isSupabaseConfigured && supabase) {
      try {
        const storagePath = generateStoragePath(file.name);

        if (onProgress) onProgress(30);

        // Upload to Supabase Storage bucket 'transfers'
        const { error: storageError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (storageError) {
          console.error('Supabase Storage error:', storageError);
          if (storageError.message.includes('not found') || storageError.message.includes('Bucket')) {
            return {
              success: false,
              error: `Supabase storage bucket '${STORAGE_BUCKET}' not found. Please create the '${STORAGE_BUCKET}' bucket in your Supabase project.`,
            };
          }
          return { success: false, error: storageError.message };
        }

        if (onProgress) onProgress(75);

        // Generate cryptographically unique 6-character transfer code
        let code = generateTransferCode(6);
        let attempts = 0;
        let isUnique = false;

        while (!isUnique && attempts < 5) {
          const { data: existing } = await supabase
            .from(TABLE_NAME)
            .select('id')
            .eq('transfer_code', code)
            .single();

          if (!existing) {
            isUnique = true;
          } else {
            code = generateTransferCode(6);
            attempts++;
          }
        }

        // Insert metadata into Supabase PostgreSQL table 'transfers'
        const { error: dbError } = await supabase.from(TABLE_NAME).insert([
          {
            transfer_code: code,
            filename: file.name,
            mime_type: file.type || 'application/octet-stream',
            file_size: file.size,
            storage_path: storagePath,
            created_at: createdAtIso,
            expires_at: expiresAtIso,
            download_count: 0,
            status: 'active',
          },
        ]);

        if (dbError) {
          console.error('Supabase DB Insert error:', dbError);
          // Rollback storage file on DB insertion failure
          await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
          return { success: false, error: dbError.message };
        }

        if (onProgress) onProgress(100);

        recordSessionUpload(file);

        const meta: FileTransferMeta = {
          code,
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          uploadTime: now,
          expiresAt: expiresAtMs,
          downloadsCount: 0,
          status: 'active',
        };

        return { success: true, code, file: meta };
      } catch (err: any) {
        console.error('Supabase Upload error:', err);
        return { success: false, error: err?.message || 'Failed uploading file to Supabase.' };
      }
    }

    // Local Client Fallback Mode (when Supabase environment credentials are not set)
    if (onProgress) onProgress(60);

    const code = generateTransferCode(6);
    const meta: FileTransferMeta = {
      code,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      uploadTime: now,
      expiresAt: expiresAtMs,
      downloadsCount: 0,
      status: 'active',
    };

    fallbackRegistry.set(code, { meta, blob: file });
    recordSessionUpload(file);

    if (onProgress) onProgress(100);

    return { success: true, code, file: meta };
  },

  /**
   * Fetch transfer metadata by transfer code
   */
  async getFileInfo(
    code: string
  ): Promise<{ success: boolean; file?: FileTransferMeta; meta?: FileTransferMeta; error?: string }> {
    const cleanCode = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .eq('transfer_code', cleanCode)
          .single();

        if (error || !data) {
          return { success: false, error: 'Transfer code not found or file expired.' };
        }

        const expiresAtMs = new Date(data.expires_at).getTime();
        const createdAtMs = new Date(data.created_at).getTime();
        const lastDownloadedAtMs = data.last_downloaded_at ? new Date(data.last_downloaded_at).getTime() : null;

        if (data.status !== 'active' || Date.now() >= expiresAtMs || (data.download_count && Number(data.download_count) >= 1)) {
          // Immediately delete file from storage and database
          await this.deleteTransfer(cleanCode);
          return { success: false, error: 'Transfer code not found or file expired.' };
        }

        const meta: FileTransferMeta = {
          code: data.transfer_code,
          originalName: data.filename,
          mimeType: data.mime_type,
          size: Number(data.file_size),
          uploadTime: createdAtMs,
          expiresAt: expiresAtMs,
          downloadsCount: Number(data.download_count || 0),
          lastDownloadedAt: lastDownloadedAtMs,
          status: data.status,
        };

        return { success: true, file: meta, meta };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Error fetching file metadata.' };
      }
    }

    // Fallback mode
    const item = fallbackRegistry.get(cleanCode);
    if (!item) {
      return { success: false, error: 'Transfer code not found or file expired.' };
    }

    if (Date.now() >= item.meta.expiresAt) {
      fallbackRegistry.delete(cleanCode);
      return { success: false, error: 'Transfer code not found or file expired.' };
    }

    return { success: true, file: item.meta, meta: item.meta };
  },

  /**
   * Alias for getFileInfo
   */
  async getTransferMeta(code: string) {
    return this.getFileInfo(code);
  },

  /**
   * Generate signed download URL and update download count & last_downloaded_at
   */
  async getDownloadUrl(code: string): Promise<{ success: boolean; url?: string; error?: string }> {
    const cleanCode = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .eq('transfer_code', cleanCode)
          .eq('status', 'active')
          .single();

        if (error || !data || (data.download_count && Number(data.download_count) >= 1)) {
          await this.deleteTransfer(cleanCode);
          return { success: false, error: 'Transfer code not found or file expired.' };
        }

        // Generate Supabase Signed URL (valid for 15 minutes / 900 seconds)
        const { data: signedData, error: signedError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(data.storage_path, 900, {
            download: data.filename,
          });

        if (signedError || !signedData?.signedUrl) {
          const { data: pubData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(data.storage_path);

          if (pubData?.publicUrl) {
            return { success: true, url: pubData.publicUrl };
          }
          return { success: false, error: signedError?.message || 'Failed to generate download link.' };
        }

        // Increment download count and set last_downloaded_at timestamp
        const nowIso = new Date().toISOString();
        await supabase
          .from(TABLE_NAME)
          .update({
            download_count: (data.download_count || 0) + 1,
            last_downloaded_at: nowIso,
          })
          .eq('transfer_code', cleanCode);

        return { success: true, url: signedData.signedUrl };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Download error.' };
      }
    }

    // Fallback mode: object URL from local blob
    const item = fallbackRegistry.get(cleanCode);
    if (!item) {
      return { success: false, error: 'File binary unavailable.' };
    }

    item.meta.downloadsCount = (item.meta.downloadsCount || 0) + 1;
    item.meta.lastDownloadedAt = Date.now();

    const url = URL.createObjectURL(item.blob);
    return { success: true, url };
  },

  /**
   * Delete transfer file from storage and record from database after use/expiration
   */
  async deleteTransfer(code: string): Promise<boolean> {
    const cleanCode = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch storage path before deleting row
        const { data } = await supabase
          .from(TABLE_NAME)
          .select('storage_path')
          .eq('transfer_code', cleanCode)
          .maybeSingle();

        if (data?.storage_path) {
          // Delete physical file from Supabase Storage
          await supabase.storage.from(STORAGE_BUCKET).remove([data.storage_path]);
        }

        // Mark status as 'deleted' and download_count = 1 to neutralize row immediately
        await supabase
          .from(TABLE_NAME)
          .update({ status: 'deleted', download_count: 1 })
          .eq('transfer_code', cleanCode);

        // Delete row from Supabase database table to free space
        await supabase.from(TABLE_NAME).delete().eq('transfer_code', cleanCode);
        return true;
      } catch (err) {
        console.error('Error removing transfer after download:', err);
        return false;
      }
    }

    // Local fallback mode
    fallbackRegistry.delete(cleanCode);
    return true;
  },

  /**
   * Complete download process with progress tracking and automatic cleanup
   */
  async downloadFile(
    code: string,
    onProgress?: (percentage: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    if (onProgress) onProgress(15);

    const metaRes = await this.getFileInfo(code);
    if (!metaRes.success || !metaRes.meta) {
      return { success: false, error: metaRes.error || 'Transfer code not found or file expired.' };
    }

    const res = await this.getDownloadUrl(code);
    if (!res.success || !res.url) {
      return { success: false, error: res.error || 'Failed to retrieve download link.' };
    }

    if (onProgress) onProgress(40);

    try {
      const filename = metaRes.meta.originalName || `dropcode_${code}.bin`;

      // Fetch file as Blob so it is fully downloaded before deleting from server
      const fileResponse = await fetch(res.url);
      if (!fileResponse.ok) {
        throw new Error('Failed to retrieve file content.');
      }

      if (onProgress) onProgress(80);

      const blob = await fileResponse.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Trigger user file download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 10000);

      if (onProgress) onProgress(100);

      // Automatically remove file from Storage and Database immediately after use
      await this.deleteTransfer(code);

      return { success: true };
    } catch (e: any) {
      console.error('Download execution error:', e);
      return { success: false, error: e?.message || 'Failed to complete download.' };
    }
  },

  /**
   * Get active transfers count
   */
  async getActiveStats(): Promise<number> {
    if (isSupabaseConfigured && supabase) {
      try {
        const nowIso = new Date().toISOString();
        const { count } = await supabase
          .from(TABLE_NAME)
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .gt('expires_at', nowIso);
        return count || 0;
      } catch (e) {
        return 0;
      }
    }

    const now = Date.now();
    let count = 0;
    for (const item of fallbackRegistry.values()) {
      if (item.meta.expiresAt > now && item.meta.status === 'active') count++;
    }
    return count;
  },
};
