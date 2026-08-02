-- ================================================================
-- DropCode Database Schema & Storage Setup Migration
-- Target: Supabase PostgreSQL & Storage
-- ================================================================

-- 1. Create the `transfers` table with strict status constraints and last_downloaded_at tracking
CREATE TABLE IF NOT EXISTS public.transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_code TEXT NOT NULL UNIQUE,
    filename TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    download_count INTEGER NOT NULL DEFAULT 0,
    last_downloaded_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'deleted', 'failed'))
);

-- 2. Add performance indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_transfers_code ON public.transfers(transfer_code);
CREATE INDEX IF NOT EXISTS idx_transfers_expires_at ON public.transfers(expires_at);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.transfers(status);

-- 3. Storage Bucket Configuration for 'transfers' (Private, max 100MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('transfers', 'transfers', false, 104857600, NULL)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow anonymous users to look up active transfer records
CREATE POLICY "Allow public select active transfers" 
ON public.transfers
FOR SELECT 
USING (status = 'active' AND expires_at > NOW());

-- RLS Policy: Allow anonymous users to upload/insert transfer records
CREATE POLICY "Allow public insert transfers" 
ON public.transfers
FOR INSERT 
WITH CHECK (true);

-- RLS Policy: Allow updating download count and last_downloaded_at on active transfers
CREATE POLICY "Allow public update download tracking" 
ON public.transfers
FOR UPDATE 
USING (status = 'active')
WITH CHECK (true);

-- Storage RLS Policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow anonymous file uploads to 'transfers' bucket
CREATE POLICY "Allow public upload objects to transfers bucket" 
ON storage.objects
FOR INSERT 
WITH CHECK (bucket_id = 'transfers');

-- Allow reading objects from transfers bucket for signed URL generation
CREATE POLICY "Allow reading objects from transfers bucket" 
ON storage.objects
FOR SELECT 
USING (bucket_id = 'transfers');

-- 5. Cleanup Function for Expired & Deleted Transfers
CREATE OR REPLACE FUNCTION public.delete_expired_transfers()
RETURNS void AS $$
DECLARE
    expired_record RECORD;
BEGIN
    -- Remove storage objects for expired or deleted transfers
    FOR expired_record IN 
        SELECT storage_path FROM public.transfers WHERE expires_at <= NOW() OR status IN ('expired', 'deleted')
    LOOP
        DELETE FROM storage.objects WHERE bucket_id = 'transfers' AND name = expired_record.storage_path;
    END LOOP;

    -- Update database status or purge records
    UPDATE public.transfers SET status = 'expired' WHERE expires_at <= NOW() AND status = 'active';
    DELETE FROM public.transfers WHERE expires_at <= NOW() - INTERVAL '1 day' OR status = 'deleted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
