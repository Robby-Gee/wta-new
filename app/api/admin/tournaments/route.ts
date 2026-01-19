import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TOURNAMENT_ALLOWANCE } from '@/lib/scoring'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: 'desc' },
  })

  return NextResponse.json(tournaments)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, level, startDate, endDate } = await request.json()

    const pointsAllowance = TOURNAMENT_ALLOWANCE[level as keyof typeof TOURNAMENT_ALLOWANCE]

    const tournament = await prisma.tournament.create({
      data: {
        name,
        level,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        pointsAllowance,
        status: 'UPCOMING',
      },
    })

    return NextResponse.json(tournament)
  } catch (error) {
    console.error('Error creating tournament:', error)
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 })
  }
}
