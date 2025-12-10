import { supabaseAdmin } from './db';

const BUCKET_NAME = 'receipts';

export async function uploadReceipt(file: File): Promise<string | null> {
  if (!supabaseAdmin) {
    console.error('[STORAGE] supabaseAdmin is not available');
    return null;
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[STORAGE] Upload error:', {
        message: error.message,
        statusCode: 'statusCode' in error ? error.statusCode : undefined,
        error: error.error,
      });
      return null;
    }

    if (!data) {
      console.error('[STORAGE] No data returned from upload');
      return null;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('[STORAGE] Upload exception:', error?.message || error);
    return null;
  }
}

export async function uploadMultipleReceipts(files: File[]): Promise<string[]> {
  const uploadPromises = files.map(file => uploadReceipt(file));
  const results = await Promise.all(uploadPromises);
  return results.filter((url): url is string => url !== null);
}

export async function deleteReceipt(url: string): Promise<boolean> {
  if (!supabaseAdmin) {
    return false;
  }

  try {
    const path = url.split('/').slice(-2).join('/');
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([path]);

    return !error;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

