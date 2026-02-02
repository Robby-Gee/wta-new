import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      isAdmin: true,
      hiddenFromLeaderboard: true,
      totalPoints: true,
      startingPoints: true,
      createdAt: true,
      _count: {
        select: { picks: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users)
}
