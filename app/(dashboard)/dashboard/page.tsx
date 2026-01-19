import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateBudget, STARTING_BUDGET } from '@/lib/scoring'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const [tournaments, picks] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: { startDate: 'asc' },
    }),
    prisma.pick.findMany({
      where: { userId: session.user.id },
      include: { player: true, tournament: true },
    }),
  ])

  const activeTournaments = tournaments.filter(t => t.status === 'ACTIVE')
  const upcomingTournaments = tournaments.filter(t => t.status === 'UPCOMING')

  const budget = calculateBudget(tournaments, picks)
  const totalPoints = picks.reduce((sum, p) => sum + p.pointsEarned, 0)

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500 mb-1">Current Budget</div>
          <div className="text-3xl font-bold text-wta-purple">{budget} pts</div>
          <div className="text-xs text-gray-400 mt-1">Started with {STARTING_BUDGET}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500 mb-1">Total Points Earned</div>
          <div className="text-3xl font-bold text-green-600">{totalPoints} pts</div>
          <div className="text-xs text-gray-400 mt-1">From {picks.length} picks</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500 mb-1">Active Tournaments</div>
          <div className="text-3xl font-bold text-wta-pink">{activeTournaments.length}</div>
          <div className="text-xs text-gray-400 mt-1">{upcomingTournaments.length} upcoming</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Tournaments</h2>
          {activeTournaments.length === 0 ? (
            <p className="text-gray-500 bg-white p-4 rounded-lg">No active tournaments</p>
          ) : (
            <div className="space-y-3">
              {activeTournaments.map(tournament => {
                const tournamentPicks = picks.filter(p => p.tournamentId === tournament.id)
                return (
                  <div key={tournament.id} className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{tournament.name}</h3>
                        <span className="text-xs bg-wta-purple/10 text-wta-purple px-2 py-0.5 rounded">
                          {tournament.level.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {tournamentPicks.length} picks
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Tournaments</h2>
          {upcomingTournaments.length === 0 ? (
            <p className="text-gray-500 bg-white p-4 rounded-lg">No upcoming tournaments</p>
          ) : (
            <div className="space-y-3">
              {upcomingTournaments.slice(0, 5).map(tournament => (
                <Link
                  key={tournament.id}
                  href={`/picks/${tournament.id}`}
                  className="block bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{tournament.name}</h3>
                      <span className="text-xs bg-wta-purple/10 text-wta-purple px-2 py-0.5 rounded">
                        {tournament.level.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {new Date(tournament.startDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-green-600">
                        +{tournament.pointsAllowance} pts
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
