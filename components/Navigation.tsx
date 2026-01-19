'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export function Navigation() {
  const { data: session, status } = useSession()

  return (
    <nav className="bg-wta-purple text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold">
            WTA Fantasy League
          </Link>

          <div className="flex items-center gap-6">
            {status === 'loading' ? (
              <span className="text-sm opacity-70">Loading...</span>
            ) : session ? (
              <>
                <Link href="/dashboard" className="hover:text-wta-pink transition">
                  Dashboard
                </Link>
                <Link href="/tournaments" className="hover:text-wta-pink transition">
                  Tournaments
                </Link>
                <Link href="/leaderboard" className="hover:text-wta-pink transition">
                  Leaderboard
                </Link>
                {session.user.isAdmin && (
                  <Link href="/admin" className="hover:text-wta-pink transition">
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/20">
                  <span className="text-sm">{session.user.name || session.user.email}</span>
                  <button
                    onClick={() => signOut()}
                    className="text-sm bg-white/10 px-3 py-1 rounded hover:bg-white/20 transition"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-wta-pink transition">
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-wta-pink px-4 py-2 rounded hover:bg-pink-600 transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
