import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env variables')
}

function createTimeoutFetch(timeoutMs = 30000) {
  return (url, options = {}) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(new DOMException('Превышено время ожидания ответа от сервера', 'TimeoutError')),
      timeoutMs
    )
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timeoutId))
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: createTimeoutFetch(30000),
  },
})
