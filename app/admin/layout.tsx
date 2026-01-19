import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user.isAdmin) {
    redirect('/')
  }

  return (
    <div>
      <div className="bg-gray-800 text-white py-2">
        <div className="container mx-auto px-4 flex items-center gap-6">
          <span className="text-sm font-semibold">Admin Panel</span>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="hover:text-wta-pink">
              Dashboard
            </Link>
            <Link href="/admin/tournaments" className="hover:text-wta-pink">
              Tournaments
            </Link>
            <Link href="/admin/players" className="hover:text-wta-pink">
              Players
            </Link>
            <Link href="/admin/results" className="hover:text-wta-pink">
              Results
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </div>
  )
}
