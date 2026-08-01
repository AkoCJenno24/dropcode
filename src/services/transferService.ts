import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FileTransferMeta } from '../types';

const STORAGE_BUCKET = 'transfers';
const TABLE_NAME = 'file_transfers';

// In-memory / Local storage fallback state when Supabase env vars are empty
const fallbackRegistry = new Map<string, { meta: FileTransferMeta; blob: Blob }>();

function generateCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
}

export const transferService = {
  isConfigured(): boolean {
    return isSupabaseConfigured;
  },

  async uploadFile(
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<{ success: boolean; code?: string; file?: FileTransferMeta; error?: string }> {
    const code = generateCode();
    const now = Date.now();
    const EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes
    const expiresAt = now + EXPIRATION_MS;

    if (onProgress) onProgress(10);

    // Real Supabase backend execution
    if (isSupabaseConfigured && supabase) {
      try {
        const fileExt = file.name.split('.').pop() || '';
        const storagePath = `${code}_${now}.${fileExt}`;

        if (onProgress) onProgress(30);

        // Upload to Supabase Storage bucket 'transfers'
        const { data: storageData, error: storageError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (storageError) {
          console.error('Supabase Storage error:', storageError);
          // If bucket doesn't exist, provide helpful message
          if (storageError.message.includes('not found') || storageError.message.includes('Bucket')) {
            return {
              success: false,
              error: `Supabase bucket '${STORAGE_BUCKET}' not found. Please create a storage bucket named '${STORAGE_BUCKET}' in Supabase Dashboard.`,
            };
          }
          return { success: false, error: storageError.message };
        }

        if (onProgress) onProgress(70);

        // Insert metadata into Supabase PostgreSQL table 'file_transfers'
        const { error: dbError } = await supabase.from(TABLE_NAME).insert([
          {
            code,
            original_name: file.name,
            mime_type: file.type || 'application/octet-stream',
            size: file.size,
            storage_path: storagePath,
            upload_time: now,
            expires_at: expiresAt,
            downloads_count: 0,
          },
        ]);

        if (dbError) {
          console.error('Supabase DB Insert error:', dbError);
          return { success: false, error: dbError.message };
        }

        if (onProgress) onProgress(100);

        const meta: FileTransferMeta = {
          code,
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          uploadTime: now,
          expiresAt,
          downloadsCount: 0,
        };

        return { success: true, code, file: meta };
      } catch (err: any) {
        console.error('Supabase Upload error:', err);
        return { success: false, error: err?.message || 'Failed uploading to Supabase.' };
      }
    }

    // Local Client Fallback (When Supabase keys are not set yet)
    if (onProgress) onProgress(60);

    const meta: FileTransferMeta = {
      code,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      uploadTime: now,
      expiresAt,
      downloadsCount: 0,
    };

    fallbackRegistry.set(code, { meta, blob: file });

    if (onProgress) onProgress(100);

    return { success: true, code, file: meta };
  },

  async getFileInfo(
    code: string
  ): Promise<{ success: boolean; file?: FileTransferMeta; error?: string }> {
    const cleanCode = code.replace(/\D/g, '');

    // Real Supabase backend execution
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .eq('code', cleanCode)
          .single();

        if (error || !data) {
          return { success: false, error: 'Transfer code not found or expired.' };
        }

        if (Date.now() >= Number(data.expires_at)) {
          // Clean up expired record
          await supabase.from(TABLE_NAME).delete().eq('code', cleanCode);
          await supabase.storage.from(STORAGE_BUCKET).remove([data.storage_path]);
          return { success: false, error: 'This file transfer has expired.' };
        }

        const meta: FileTransferMeta = {
          code: data.code,
          originalName: data.original_name,
          mimeType: data.mime_type,
          size: Number(data.size),
          uploadTime: Number(data.upload_time),
          expiresAt: Number(data.expires_at),
          downloadsCount: Number(data.downloads_count || 0),
        };

        return { success: true, file: meta };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Error fetching file metadata.' };
      }
    }

    // Fallback mode
    const item = fallbackRegistry.get(cleanCode);
    if (!item) {
      return { success: false, error: 'Code not found or file expired.' };
    }

    if (Date.now() >= item.meta.expiresAt) {
      fallbackRegistry.delete(cleanCode);
      return { success: false, error: 'This file transfer has expired.' };
    }

    return { success: true, file: item.meta };
  },

  async getDownloadUrl(code: string): Promise<{ success: boolean; url?: string; error?: string }> {
    const cleanCode = code.replace(/\D/g, '');

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .eq('code', cleanCode)
          .single();

        if (error || !data) {
          return { success: false, error: 'File record not found.' };
        }

        // Generate Supabase Signed URL (valid for 15 minutes)
        const { data: signedData, error: signedError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(data.storage_path, 900, {
            download: data.original_name,
          });

        if (signedError || !signedData?.signedUrl) {
          // Fallback to public URL if signed URL fails or bucket is public
          const { data: pubData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(data.storage_path);
          
          if (pubData?.publicUrl) {
            return { success: true, url: pubData.publicUrl };
          }
          return { success: false, error: signedError?.message || 'Failed to generate download link.' };
        }

        // Increment download count
        await supabase
          .from(TABLE_NAME)
          .update({ downloads_count: (data.downloads_count || 0) + 1 })
          .eq('code', cleanCode);

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
    const url = URL.createObjectURL(item.blob);
    return { success: true, url };
  },

  async getActiveStats(): Promise<number> {
    if (isSupabaseConfigured && supabase) {
      try {
        const now = Date.now();
        const { count } = await supabase
          .from(TABLE_NAME)
          .select('*', { count: 'exact', head: true })
          .gt('expires_at', now);
        return count || 0;
      } catch (e) {
        return 0;
      }
    }

    const now = Date.now();
    let count = 0;
    for (const item of fallbackRegistry.values()) {
      if (item.meta.expiresAt > now) count++;
    }
    return count;
  },
};
