import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUND_POINTS } from '@/lib/scoring'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { playerId, round, won } = await request.json()

    // Get the old match to calculate point differences
    const oldMatch = await prisma.match.findUnique({
      where: { id: params.id },
    })

    if (!oldMatch) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const oldPointsAwarded = oldMatch.pointsAwarded
    const newPointsAwarded = won ? (ROUND_POINTS[round] || 0) : 0
    const pointsDiff = newPointsAwarded - oldPointsAwarded

    // Update the match
    const match = await prisma.match.update({
      where: { id: params.id },
      data: {
        playerId,
        round,
        won,
        pointsAwarded: newPointsAwarded,
      },
    })

    // Recalculate points for affected picks
    // First, remove old points if the old match had points
    if (oldPointsAwarded > 0) {
      const oldPicks = await prisma.pick.findMany({
        where: {
          tournamentId: oldMatch.tournamentId,
          playerId: oldMatch.playerId,
        },
      })

      for (const pick of oldPicks) {
        await prisma.pick.update({
          where: { id: pick.id },
          data: {
            pointsEarned: Math.max(0, pick.pointsEarned - oldPointsAwarded),
          },
        })
        await prisma.user.update({
          where: { id: pick.userId },
          data: {
            totalPoints: { decrement: oldPointsAwarded },
          },
        })
      }
    }

    // Then add new points if the new match has points
    if (newPointsAwarded > 0) {
      const newPicks = await prisma.pick.findMany({
        where: {
          tournamentId: match.tournamentId,
          playerId: match.playerId,
        },
      })

      for (const pick of newPicks) {
        await prisma.pick.update({
          where: { id: pick.id },
          data: {
            pointsEarned: pick.pointsEarned + newPointsAwarded,
          },
        })
        await prisma.user.update({
          where: { id: pick.userId },
          data: {
            totalPoints: { increment: newPointsAwarded },
          },
        })
      }
    }

    return NextResponse.json(match)
  } catch (error) {
    console.error('Error updating match:', error)
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get the match to recalculate points
    const match = await prisma.match.findUnique({
      where: { id: params.id },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Remove points from picks if the match had points
    if (match.pointsAwarded > 0) {
      const picks = await prisma.pick.findMany({
        where: {
          tournamentId: match.tournamentId,
          playerId: match.playerId,
        },
      })

      for (const pick of picks) {
        await prisma.pick.update({
          where: { id: pick.id },
          data: {
            pointsEarned: Math.max(0, pick.pointsEarned - match.pointsAwarded),
          },
        })
        await prisma.user.update({
          where: { id: pick.userId },
          data: {
            totalPoints: { decrement: match.pointsAwarded },
          },
        })
      }
    }

    // Delete the match
    await prisma.match.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting match:', error)
    return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 })
  }
}
