import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlayerCost } from '@/lib/scoring'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const players = await prisma.player.findMany({
    orderBy: { wtaRanking: 'asc' },
  })

  return NextResponse.json(players)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, country, wtaRanking } = await request.json()

    const cost = getPlayerCost(wtaRanking)

    const player = await prisma.player.create({
      data: {
        name,
        country,
        wtaRanking,
        cost,
      },
    })

    return NextResponse.json(player)
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
  }
}
