import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { SyncButtons } from '@/components/SyncButtons'

export default async function AdminDashboard() {
  const [userCount, tournamentCount, playerCount, pickCount] = await Promise.all([
    prisma.user.count(),
    prisma.tournament.count(),
    prisma.player.count(),
    prisma.pick.count(),
  ])

  const activeTournaments = await prisma.tournament.findMany({
    where: { status: 'ACTIVE' },
  })

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <SyncButtons />

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-wta-purple">{userCount}</div>
          <div className="text-sm text-gray-500">Users</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-wta-pink">{tournamentCount}</div>
          <div className="text-sm text-gray-500">Tournaments</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-green-600">{playerCount}</div>
          <div className="text-sm text-gray-500">Players</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-blue-600">{pickCount}</div>
          <div className="text-sm text-gray-500">Picks Made</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link
          href="/admin/tournaments"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
        >
          <h3 className="font-semibold text-lg mb-2">Manage Tournaments</h3>
          <p className="text-gray-600 text-sm">Add, edit, or update tournament status</p>
        </Link>

        <Link
          href="/admin/players"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
        >
          <h3 className="font-semibold text-lg mb-2">Manage Players</h3>
          <p className="text-gray-600 text-sm">Add players or update WTA rankings</p>
        </Link>

        <Link
          href="/admin/results"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
        >
          <h3 className="font-semibold text-lg mb-2">Enter Results</h3>
          <p className="text-gray-600 text-sm">Record match results and award points</p>
        </Link>
      </div>

      {activeTournaments.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Active Tournaments</h2>
          <div className="space-y-2">
            {activeTournaments.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.level.replace('_', ' ')}</div>
                </div>
                <Link
                  href={`/admin/results?tournament=${t.id}`}
                  className="text-wta-purple hover:underline text-sm"
                >
                  Enter Results →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
