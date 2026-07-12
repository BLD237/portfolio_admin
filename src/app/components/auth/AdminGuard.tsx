'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { clearToken, getMe, getToken } from '@/lib/api'

export default function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function verify() {
      if (!getToken()) {
        router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`)
        return
      }

      try {
        await getMe()
        if (!cancelled) setReady(true)
      } catch {
        clearToken()
        router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`)
      }
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [pathname, router])

  if (!ready) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-lightgray text-sm text-link'>
        Checking admin session...
      </div>
    )
  }

  return children
}
