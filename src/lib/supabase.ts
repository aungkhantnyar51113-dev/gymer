import { createClient } from '@supabase/supabase-js';

// Read the public env vars directly and trim them. A trailing space or newline
// (common when a value is pasted into the Vercel dashboard) corrupts the
// `apikey` header, which makes Supabase answer every request with
// 400 { "message": "No API key found in request" }.
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

// Only build a client when BOTH values are present, so we never fire requests
// that are missing the API key.
export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

const REQUEST_TIMEOUT_MS = 12_000;

function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const onAbort = () => controller.abort();
  init?.signal?.addEventListener('abort', onAbort, { once: true });

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
    init?.signal?.removeEventListener('abort', onAbort);
  });
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: fetchWithTimeout,
      },
    })
  : null;
