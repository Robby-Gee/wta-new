import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUND_POINTS } from '@/lib/scoring'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tournamentId = searchParams.get('tournamentId')

  if (!tournamentId) {
    return NextResponse.json({ error: 'Tournament ID required' }, { status: 400 })
  }

  const matches = await prisma.match.findMany({
    where: { tournamentId },
    include: { player: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(matches)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tournamentId, playerId, round, won } = await request.json()

    const pointsAwarded = won ? (ROUND_POINTS[round] || 0) : 0

    // Create the match record
    const match = await prisma.match.create({
      data: {
        tournamentId,
        playerId,
        round,
        won,
        pointsAwarded,
      },
    })

    // If the player won, update points for all users who picked this player
    if (won) {
      const picks = await prisma.pick.findMany({
        where: {
          tournamentId,
          playerId,
        },
      })

      // Update each pick's points
      for (const pick of picks) {
        await prisma.pick.update({
          where: { id: pick.id },
          data: {
            pointsEarned: pick.pointsEarned + pointsAwarded,
          },
        })

        // Also update the user's total points
        await prisma.user.update({
          where: { id: pick.userId },
          data: {
            totalPoints: { increment: pointsAwarded },
          },
        })
      }
    }

    return NextResponse.json(match)
  } catch (error) {
    console.error('Error recording result:', error)
    return NextResponse.json({ error: 'Failed to record result' }, { status: 500 })
  }
}
