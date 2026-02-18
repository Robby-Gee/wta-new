import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: { userId: string }
}

export default async function UserProfilePage({ params }: Props) {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      picks: {
        include: {
          player: true,
          tournament: true,
        },
      },
    },
  })

  if (!user || user.hiddenFromLeaderboard) {
    notFound()
  }

  // Get all users to calculate rank
  const allUsers = await prisma.user.findMany({
    where: { hiddenFromLeaderboard: false },
    include: { picks: { include: { player: true } } },
  })

  const STARTING_BUDGET = 50

  const getUserStats = (u: typeof allUsers[0]) => {
    const earnedPoints = u.picks.reduce((sum, pick) => sum + pick.pointsEarned, 0)
    const startingPoints = (u as typeof u & { startingPoints: number }).startingPoints || 0
    const totalSpent = u.picks.reduce((sum, pick) => sum + pick.player.cost, 0)
    return STARTING_BUDGET + startingPoints + earnedPoints - totalSpent
  }

  const sortedUsers = allUsers.sort((a, b) => getUserStats(b) - getUserStats(a))
  const rank = sortedUsers.findIndex(u => u.id === userId) + 1

  // Calculate user stats
  const earnedPoints = user.picks.reduce((sum, pick) => sum + pick.pointsEarned, 0)
  const startingPoints = (user as typeof user & { startingPoints: number }).startingPoints || 0
  const totalSpent = user.picks.reduce((sum, pick) => sum + pick.player.cost, 0)
  const totalPoints = STARTING_BUDGET + startingPoints + earnedPoints - totalSpent

  // Most picked players
  const playerCounts = user.picks.reduce((acc, pick) => {
    acc[pick.player.id] = acc[pick.player.id] || { player: pick.player, count: 0, points: 0 }
    acc[pick.player.id].count++
    acc[pick.player.id].points += pick.pointsEarned
    return acc
  }, {} as Record<string, { player: typeof user.picks[0]['player'], count: number, points: number }>)

  const favoritePlayers = Object.values(playerCounts)
    .sort((a, b) => b.count - a.count || b.points - a.points)
    .slice(0, 5)

  // Tournament stats
  const tournamentStats = user.picks.reduce((acc, pick) => {
    const tid = pick.tournament.id
    acc[tid] = acc[tid] || { tournament: pick.tournament, points: 0, picks: [] }
    acc[tid].points += pick.pointsEarned
    acc[tid].picks.push(pick)
    return acc
  }, {} as Record<string, { tournament: typeof user.picks[0]['tournament'], points: number, picks: typeof user.picks }>)

  const tournaments = Object.values(tournamentStats)
    .sort((a, b) => new Date(b.tournament.startDate).getTime() - new Date(a.tournament.startDate).getTime())

  const bestTournament = tournaments.length > 0
    ? tournaments.reduce((best, curr) => curr.points > best.points ? curr : best)
    : null

  const avgPointsPerTournament = tournaments.length > 0
    ? Math.round(earnedPoints / tournaments.length * 10) / 10
    : 0

  const picksWithPoints = user.picks.filter(p => p.pointsEarned > 0).length
  const successRate = user.picks.length > 0
    ? Math.round((picksWithPoints / user.picks.length) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/leaderboard"
        className="inline-flex items-center text-wta-purple hover:underline mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Leaderboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{user.name || user.email.split('@')[0]}</h1>
            <p className="text-gray-500 mt-1">
              {rank === 1 && '🥇 '}
              {rank === 2 && '🥈 '}
              {rank === 3 && '🥉 '}
              Rank #{rank} of {sortedUsers.length}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-green-600">{totalPoints}</div>
            <div className="text-gray-500 text-sm">points</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-gray-500 text-sm">Tournaments</div>
          <div className="text-2xl font-bold">{tournaments.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-gray-500 text-sm">Total Picks</div>
          <div className="text-2xl font-bold">{user.picks.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-gray-500 text-sm">Avg Pts/Tournament</div>
          <div className="text-2xl font-bold">{avgPointsPerTournament}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-gray-500 text-sm">Success Rate</div>
          <div className="text-2xl font-bold">{successRate}%</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Favorite Players */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Favorite Players</h2>
          {favoritePlayers.length === 0 ? (
            <p className="text-gray-500">No picks yet</p>
          ) : (
            <div className="space-y-3">
              {favoritePlayers.map(({ player, count, points }) => (
                <div key={player.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-gray-500">
                      {player.country} • Rank #{player.wtaRanking}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{count}x picked</div>
                    <div className="text-sm text-green-600">+{points} pts</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Best Tournament */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Best Tournament</h2>
          {bestTournament ? (
            <div>
              <div className="text-xl font-bold text-wta-purple">
                {bestTournament.tournament.name}
              </div>
              <div className="text-sm text-gray-500 mb-3">
                {bestTournament.tournament.level.replace('_', ' ')}
              </div>
              <div className="text-3xl font-bold text-green-600">
                +{bestTournament.points} pts
              </div>
              <div className="mt-3 text-sm text-gray-500">
                Picks: {bestTournament.picks.map(p => p.player.name).join(', ')}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No completed tournaments</p>
          )}
        </div>
      </div>

      {/* Tournament History */}
      <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-lg font-semibold p-6 pb-4">Tournament History</h2>
        {tournaments.length === 0 ? (
          <p className="text-gray-500 px-6 pb-6">No tournament history</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tournament</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Picks</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Points</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map(({ tournament, points, picks }) => (
                <tr key={tournament.id} className="border-t">
                  <td className="px-6 py-4">
                    <div className="font-medium">{tournament.name}</div>
                    <div className="text-sm text-gray-500">
                      {tournament.level.replace('_', ' ')} • {tournament.status}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {picks.map(p => (
                        <div key={p.id} className="flex items-center gap-2">
                          <span>{p.player.name}</span>
                          {p.pointsEarned > 0 && (
                            <span className="text-green-600 text-xs">+{p.pointsEarned}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${points > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {points > 0 ? `+${points}` : '0'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
