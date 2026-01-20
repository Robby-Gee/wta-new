import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateBudget, QUALIFIER_COST } from '@/lib/scoring'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tournamentId, mainDrawPicks, qualifierPicks } = await request.json()

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // TODO: Change back to 'UPCOMING' only after backfilling existing picks
    if (tournament.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Tournament has completed' }, { status: 400 })
    }

    // Get all data needed for budget calculation
    const [allTournaments, existingPicks, selectedPlayers] = await Promise.all([
      prisma.tournament.findMany(),
      prisma.pick.findMany({
        where: { userId: session.user.id },
        include: { player: true },
      }),
      prisma.player.findMany({
        where: { id: { in: [...mainDrawPicks, ...qualifierPicks] } },
      }),
    ])

    // Calculate current budget (including cost of picks for this tournament that will be replaced)
    const picksExcludingThisTournament = existingPicks.filter(p => p.tournamentId !== tournamentId)
    const budget = calculateBudget(allTournaments, picksExcludingThisTournament)

    // Calculate cost of new picks: main draw uses player cost, qualifiers always cost 3
    const mainDrawPlayers = selectedPlayers.filter(p => mainDrawPicks.includes(p.id))
    const mainDrawCost = mainDrawPlayers.reduce((sum, p) => sum + p.cost, 0)
    const qualifierCost = qualifierPicks.length * QUALIFIER_COST
    const newPicksCost = mainDrawCost + qualifierCost

    if (newPicksCost > budget) {
      return NextResponse.json({ error: 'Not enough budget' }, { status: 400 })
    }

    // Delete existing picks for this tournament
    await prisma.pick.deleteMany({
      where: {
        userId: session.user.id,
        tournamentId,
      },
    })

    // Create new picks
    const picks = [
      ...mainDrawPicks.map((playerId: string) => ({
        userId: session.user.id,
        tournamentId,
        playerId,
        pickType: 'MAIN_DRAW' as const,
      })),
      ...qualifierPicks.map((playerId: string) => ({
        userId: session.user.id,
        tournamentId,
        playerId,
        pickType: 'QUALIFIER' as const,
      })),
    ]

    await prisma.pick.createMany({
      data: picks,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving picks:', error)
    return NextResponse.json({ error: 'Failed to save picks' }, { status: 500 })
  }
}
