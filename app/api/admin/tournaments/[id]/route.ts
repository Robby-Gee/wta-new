import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { status } = await request.json()

    const tournament = await prisma.tournament.update({
      where: { id: params.id },
      data: { status },
    })

    return NextResponse.json(tournament)
  } catch (error) {
    console.error('Error updating tournament:', error)
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 })
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
    // Delete all related records first (picks, matches)
    await prisma.pick.deleteMany({
      where: { tournamentId: params.id },
    })
    await prisma.match.deleteMany({
      where: { tournamentId: params.id },
    })

    // Then delete the tournament
    await prisma.tournament.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tournament:', error)
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 })
  }
}
