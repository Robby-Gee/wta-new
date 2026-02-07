import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions)

  const users = await prisma.user.findMany({
    where: {
      hiddenFromLeaderboard: false,
    },
    include: {
      picks: {
        include: { player: true },
      },
    },
  })

  // Calculate stats for each user
  const STARTING_BUDGET = 50
  const leaderboard = users.map(user => {
    const earnedPoints = user.picks.reduce((sum, pick) => sum + pick.pointsEarned, 0)
    const startingPoints = (user as typeof user & { startingPoints: number }).startingPoints || 0
    const totalSpent = user.picks.reduce((sum, pick) => sum + pick.player.cost, 0)
    const totalPoints = STARTING_BUDGET + startingPoints + earnedPoints - totalSpent

    return {
      id: user.id,
      name: user.name || user.email.split('@')[0],
      email: user.email,
      totalPoints,
      earnedPoints,
      startingPoints,
      totalSpent,
      pickCount: user.picks.length,
    }
  }).sort((a, b) => b.totalPoints - a.totalPoints)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Leaderboard</h1>

      {leaderboard.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No players yet. Be the first to join!
        </p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-wta-purple text-white">
              <tr>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-right">Points</th>
                <th className="px-4 py-3 text-right">Picks</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user, index) => {
                const isCurrentUser = session?.user?.id === user.id
                const rank = index + 1

                return (
                  <tr
                    key={user.id}
                    className={`border-b last:border-0 ${
                      isCurrentUser ? 'bg-wta-purple/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className={`font-bold ${
                        rank === 1 ? 'text-yellow-500' :
                        rank === 2 ? 'text-gray-400' :
                        rank === 3 ? 'text-amber-600' : ''
                      }`}>
                        {rank === 1 && '🥇 '}
                        {rank === 2 && '🥈 '}
                        {rank === 3 && '🥉 '}
                        #{rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {user.name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-wta-purple text-white px-2 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-green-600">{user.totalPoints}</span>
                      <span className="text-gray-400 text-sm ml-1">pts</span>
                      {user.startingPoints > 0 && (
                        <div className="text-xs text-gray-400">
                          ({user.startingPoints} + {user.earnedPoints})
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {user.pickCount}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 bg-wta-purple/5 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Scoring Reminder</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">R1 Win</div>
            <div className="font-bold">0 pts</div>
          </div>
          <div>
            <div className="text-gray-500">R2 Win</div>
            <div className="font-bold">3 pts</div>
          </div>
          <div>
            <div className="text-gray-500">R3 Win</div>
            <div className="font-bold">6 pts</div>
          </div>
          <div>
            <div className="text-gray-500">R4 Win</div>
            <div className="font-bold">8 pts</div>
          </div>
          <div>
            <div className="text-gray-500">QF Win</div>
            <div className="font-bold">10 pts</div>
          </div>
          <div>
            <div className="text-gray-500">SF Win</div>
            <div className="font-bold">14 pts</div>
          </div>
          <div>
            <div className="text-gray-500">Final</div>
            <div className="font-bold">18 pts</div>
          </div>
          <div>
            <div className="text-gray-500">Champion</div>
            <div className="font-bold">24 pts</div>
          </div>
        </div>
      </div>
    </div>
  )
}
