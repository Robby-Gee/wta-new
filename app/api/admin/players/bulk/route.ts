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
    const { players } = await request.json()

    const playersWithCost = players.map((p: { name: string; country: string | null; wtaRanking: number }) => ({
      name: p.name,
      country: p.country,
      wtaRanking: p.wtaRanking,
      cost: getPlayerCost(p.wtaRanking),
    }))

    await prisma.player.createMany({
      data: playersWithCost,
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true, count: playersWithCost.length })
  } catch (error) {
    console.error('Error bulk creating players:', error)
    return NextResponse.json({ error: 'Failed to create players' }, { status: 500 })
  }
}
