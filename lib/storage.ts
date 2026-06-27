import { env } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type StorageAdminClient = {
  storage: {
    getBucket: (name: string) => Promise<{ error: { message?: string; status?: number | string; statusCode?: number | string } | null }>;
    createBucket: (
      name: string,
      options: { public: boolean }
    ) => Promise<{ error: { message?: string; status?: number | string; statusCode?: number | string } | null }>;
  };
};

async function ensureStorageBucketExists(supabase: StorageAdminClient) {
  const bucketName = env.SUPABASE_STORAGE_BUCKET;
  const { error } = await supabase.storage.getBucket(bucketName);

  if (!error) {
    return;
  }

  const statusCode = (error as { status?: number | string; statusCode?: number | string }).status ?? (error as { status?: number | string; statusCode?: number | string }).statusCode;
  const message = (error.message ?? '').toLowerCase();
  const isMissingBucket = statusCode === 404 || statusCode === '404' || message.includes('bucket not found') || message.includes('not found');

  if (!isMissingBucket) {
    throw error;
  }

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: false
  });

  if (!createError) {
    return;
  }

  const createMessage = (createError.message ?? '').toLowerCase();
  if (createMessage.includes('already exists') || createMessage.includes('duplicate')) {
    return;
  }

  throw createError;
}

export async function uploadResumeFile(userId: string, file: File, buffer: ArrayBuffer) {
  const supabase = createSupabaseAdminClient();
  await ensureStorageBucketExists(supabase);

  const extension = file.name.split('.').pop() ?? 'bin';
  const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).upload(filePath, Buffer.from(buffer), {
    contentType: file.type,
    upsert: false
  });

  if (error) {
    throw error;
  }

  return filePath;
}
