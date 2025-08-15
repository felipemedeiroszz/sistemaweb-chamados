import { createClient as _createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export const createServerClient = () => {
  const cookieStore = cookies()

  return _createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

export const createClient = createServerClient

export const isSupabaseConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
