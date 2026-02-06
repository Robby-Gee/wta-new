import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchCurrentRankings, WTA_2026_CALENDAR } from '@/lib/wta-data'
import { TOURNAMENT_ALLOWANCE } from '@/lib/scoring'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type } = await request.json()

  try {
    if (type === 'rankings') {
      // Fetch latest rankings from ESPN
      const rankings = await fetchCurrentRankings()

      if (rankings.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Could not fetch rankings - source may be unavailable',
        }, { status: 500 })
      }

      // Upsert players to preserve existing IDs (and thus picks)
      let updated = 0
      let created = 0

      for (const player of rankings) {
        const existing = await prisma.player.findFirst({
          where: { name: player.name },
        })

        if (existing) {
          await prisma.player.update({
            where: { id: existing.id },
            data: {
              wtaRanking: player.wtaRanking,
              cost: player.cost,
              country: player.country,
            },
          })
          updated++
        } else {
          await prisma.player.create({
            data: player,
          })
          created++
        }
      }

      return NextResponse.json({
        success: true,
        message: `Synced rankings: ${updated} updated, ${created} new players`,
      })
    }

    if (type === 'tournaments') {
      // Add tournaments from calendar
      let added = 0
      let skipped = 0

      for (const tournament of WTA_2026_CALENDAR) {
        const existing = await prisma.tournament.findFirst({
          where: {
            name: tournament.name,
            startDate: new Date(tournament.startDate),
          },
        })

        if (existing) {
          skipped++
          continue
        }

        const level = tournament.level as keyof typeof TOURNAMENT_ALLOWANCE
        await prisma.tournament.create({
          data: {
            name: tournament.name,
            level: level,
            startDate: new Date(tournament.startDate),
            endDate: new Date(tournament.endDate),
            pointsAllowance: TOURNAMENT_ALLOWANCE[level],
            status: 'UPCOMING',
          },
        })
        added++
      }

      return NextResponse.json({
        success: true,
        message: `Added ${added} tournaments (${skipped} already existed)`,
      })
    }

    return NextResponse.json({ error: 'Invalid sync type' }, { status: 400 })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
