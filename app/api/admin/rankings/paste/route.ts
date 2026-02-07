import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlayerCost } from '@/lib/scoring'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { players } = await request.json() as {
      players: { name: string; country: string | null; wtaRanking: number }[]
    }

    let updated = 0
    let created = 0

    for (const player of players) {
      const cost = getPlayerCost(player.wtaRanking)

      const existing = await prisma.player.findFirst({
        where: { name: player.name },
      })

      if (existing) {
        await prisma.player.update({
          where: { id: existing.id },
          data: {
            wtaRanking: player.wtaRanking,
            cost,
            country: player.country,
          },
        })
        updated++
      } else {
        await prisma.player.create({
          data: {
            name: player.name,
            country: player.country,
            wtaRanking: player.wtaRanking,
            cost,
          },
        })
        created++
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      created,
      total: updated + created,
    })
  } catch (error) {
    console.error('Error updating rankings:', error)
    return NextResponse.json({ error: 'Failed to update rankings' }, { status: 500 })
  }
}
