import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = (url && key)
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

export const hasSupabase = !!supabase

// Demo mode: when no Supabase configured, use in-memory/local storage so the app still runs.
export const DEMO = !supabase