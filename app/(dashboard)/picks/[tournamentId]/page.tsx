import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateBudget, REQUIRED_PICKS } from '@/lib/scoring'
import { PickSelector } from '@/components/PickSelector'

export default async function PicksPage({
  params,
}: {
  params: { tournamentId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: params.tournamentId },
  })

  if (!tournament) {
    notFound()
  }

  if (tournament.status !== 'UPCOMING') {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Picks Locked</h1>
        <p className="text-gray-600">
          This tournament has already started. Picks are no longer available.
        </p>
      </div>
    )
  }

  const [players, existingPicks, allTournaments, allPicks] = await Promise.all([
    prisma.player.findMany({
      orderBy: { wtaRanking: 'asc' },
    }),
    prisma.pick.findMany({
      where: {
        userId: session.user.id,
        tournamentId: tournament.id,
      },
      include: { player: true },
    }),
    prisma.tournament.findMany(),
    prisma.pick.findMany({
      where: { userId: session.user.id },
      include: { player: true },
    }),
  ])

  const budget = calculateBudget(allTournaments, allPicks)
  const requiredPicks = REQUIRED_PICKS[tournament.level as keyof typeof REQUIRED_PICKS]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{tournament.name}</h1>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm bg-wta-purple/10 text-wta-purple px-3 py-1 rounded">
            {tournament.level.replace('_', ' ')}
          </span>
          <span className="text-gray-500">
            Starts {new Date(tournament.startDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500">Your Budget:</span>
            <span className="text-2xl font-bold text-wta-purple ml-2">{budget} pts</span>
          </div>
          <div className="text-sm text-gray-600">
            Required: {requiredPicks.mainDraw} main draw + {requiredPicks.qualifier} qualifier
          </div>
        </div>
      </div>

      <PickSelector
        tournament={tournament}
        players={players}
        existingPicks={existingPicks}
        budget={budget}
        requiredPicks={requiredPicks}
      />
    </div>
  )
}
