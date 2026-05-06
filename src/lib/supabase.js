import { env } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';

export const supabaseConfigured = Boolean(env.PUBLIC_SUPABASE_URL && env.PUBLIC_SUPABASE_ANON_KEY);
export const supabase = supabaseConfigured
  ? createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY)
  : null;
