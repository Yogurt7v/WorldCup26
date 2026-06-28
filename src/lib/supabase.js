import { createClient } from '@supabase/supabase-js'

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY env variable')
}

const supabaseUrl = import.meta.env.PROD
  ? window.location.origin + '/api/supabase'
  : import.meta.env.VITE_SUPABASE_URL

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
    fetch: createTimeoutFetch(60000),
  },
  realtime: {
    url: 'wss://whobwjaymbhychlbgfom.supabase.co/realtime/v1',
  },
})
