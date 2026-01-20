import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function TournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: 'asc' },
  })

  const groupedTournaments = {
    active: tournaments.filter(t => t.status === 'ACTIVE'),
    upcoming: tournaments.filter(t => t.status === 'UPCOMING').sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    ),
    completed: tournaments.filter(t => t.status === 'COMPLETED').sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    ),
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Tournaments</h1>

      {groupedTournaments.active.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            Active
          </h2>
          <div className="space-y-3">
            {groupedTournaments.active.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} showPickLink />
            ))}
          </div>
        </section>
      )}

      {groupedTournaments.upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            Upcoming
          </h2>
          <div className="space-y-3">
            {groupedTournaments.upcoming.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} showPickLink />
            ))}
          </div>
        </section>
      )}

      {groupedTournaments.completed.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
            Completed
          </h2>
          <div className="space-y-3">
            {groupedTournaments.completed.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </section>
      )}

      {tournaments.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No tournaments yet. Check back soon!
        </p>
      )}
    </div>
  )
}

function TournamentCard({
  tournament,
  showPickLink = false
}: {
  tournament: {
    id: string
    name: string
    level: string
    startDate: Date
    endDate: Date
    status: string
    pointsAllowance: number
  }
  showPickLink?: boolean
}) {
  const levelColors: Record<string, string> = {
    WTA_500: 'bg-blue-100 text-blue-800',
    WTA_1000: 'bg-purple-100 text-purple-800',
    GRAND_SLAM: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{tournament.name}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded ${levelColors[tournament.level] || 'bg-gray-100'}`}>
              {tournament.level.replace('_', ' ')}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-green-600">
            +{tournament.pointsAllowance} pts
          </div>
          {showPickLink && (
            <Link
              href={`/picks/${tournament.id}`}
              className="text-sm text-wta-purple hover:underline"
            >
              Make Picks →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
