import { z } from 'zod';

const envSchema = z.object({
  GROQ_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(['groq', 'gemini']).default('groq'),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
  GEMINI_MODEL: z.string().default('gemini-1.5-pro'),
  GEMINI_FALLBACK_MODELS: z
    .string()
    .default('gemini-2.5-flash,gemini-2.5-pro,gemini-2.0-flash,gemini-1.5-flash,gemini-1.5-pro,gemini-pro'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  SUPABASE_STORAGE_BUCKET: z.string().default('resumes')
});

const parsedEnv = envSchema.parse(process.env);

const supabaseClientKey = parsedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? parsedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const env = {
  ...parsedEnv,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseClientKey,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabaseClientKey
};
