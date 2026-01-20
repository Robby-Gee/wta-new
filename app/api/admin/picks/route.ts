import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

  const picks = await prisma.pick.findMany({
    where: { tournamentId },
    include: {
      player: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      player: {
        wtaRanking: 'asc',
      },
    },
  })

  return NextResponse.json(picks)
}
