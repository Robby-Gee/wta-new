'use client'

import { useState, useEffect } from 'react'
import { ROUND_POINTS } from '@/lib/scoring'

type Tournament = {
  id: string
  name: string
  level: string
  status: string
}

type Player = {
  id: string
  name: string
  wtaRanking: number
}

type Match = {
  id: string
  playerId: string
  round: string
  won: boolean
  pointsAwarded: number
  player: Player
}

type Pick = {
  id: string
  pickType: string
  pointsEarned: number
  player: Player
  user: {
    id: string
    name: string | null
    email: string
  }
}

export default function AdminResultsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>('')
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [picks, setPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    playerId: '',
    round: 'R1',
    won: true,
  })
  const [editingMatch, setEditingMatch] = useState<string | null>(null)
  const [playerSearch, setPlayerSearch] = useState('')

  const rounds = Object.keys(ROUND_POINTS)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedTournament) {
      fetchMatches()
    }
  }, [selectedTournament])

  const fetchData = async () => {
    const [tournamentsRes, playersRes] = await Promise.all([
      fetch('/api/admin/tournaments'),
      fetch('/api/admin/players'),
    ])
    const tournamentsData = await tournamentsRes.json()
    const playersData = await playersRes.json()

    setTournaments(tournamentsData.filter((t: Tournament) => t.status === 'ACTIVE'))
    setPlayers(playersData)
    setLoading(false)
  }

  const fetchMatches = async () => {
    const [matchesRes, picksRes] = await Promise.all([
      fetch(`/api/admin/results?tournamentId=${selectedTournament}`),
      fetch(`/api/admin/picks?tournamentId=${selectedTournament}`),
    ])
    const matchesData = await matchesRes.json()
    const picksData = await picksRes.json()
    setMatches(matchesData)
    setPicks(picksData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTournament || !formData.playerId) return

    setSaving(true)

    if (editingMatch) {
      // Update existing match
      const res = await fetch(`/api/admin/results/${editingMatch}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: formData.playerId,
          round: formData.round,
          won: formData.won,
        }),
      })

      if (res.ok) {
        fetchMatches()
        setFormData({ playerId: '', round: 'R1', won: true })
        setEditingMatch(null)
      }
    } else {
      // Create new match
      const res = await fetch('/api/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament,
          playerId: formData.playerId,
          round: formData.round,
          won: formData.won,
        }),
      })

      if (res.ok) {
        fetchMatches()
        setFormData({ ...formData, playerId: '' })
      }
    }

    setSaving(false)
  }

  const handleEdit = (match: Match) => {
    setFormData({
      playerId: match.playerId,
      round: match.round,
      won: match.won,
    })
    setEditingMatch(match.id)
  }

  const handleCancelEdit = () => {
    setFormData({ playerId: '', round: 'R1', won: true })
    setEditingMatch(null)
  }

  const handleDelete = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this result? User points will be recalculated.')) {
      return
    }

    await fetch(`/api/admin/results/${matchId}`, {
      method: 'DELETE',
    })
    fetchMatches()
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Enter Results</h1>

      {tournaments.length === 0 ? (
        <p className="text-gray-500">No active tournaments. Start a tournament first.</p>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Tournament</label>
            <select
              value={selectedTournament}
              onChange={e => setSelectedTournament(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border rounded-lg"
            >
              <option value="">Choose a tournament...</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.level.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {selectedTournament && (
            <>
              {/* Picks Summary */}
              {picks.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <h2 className="font-semibold mb-4">Players Picked ({[...new Set(picks.map(p => p.player.id))].length} unique players)</h2>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {/* Group picks by player */}
                    {Object.entries(
                      picks.reduce((acc, pick) => {
                        if (!acc[pick.player.id]) {
                          acc[pick.player.id] = { player: pick.player, users: [] }
                        }
                        acc[pick.player.id].users.push({
                          name: pick.user.name || pick.user.email.split('@')[0],
                          pickType: pick.pickType,
                          pointsEarned: pick.pointsEarned,
                        })
                        return acc
                      }, {} as Record<string, { player: Player; users: { name: string; pickType: string; pointsEarned: number }[] }>)
                    )
                      .sort((a, b) => a[1].player.wtaRanking - b[1].player.wtaRanking)
                      .map(([playerId, { player, users }]) => (
                        <div key={playerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">
                              #{player.wtaRanking} {player.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Picked by: {users.map(u => `${u.name} (${u.pickType === 'MAIN_DRAW' ? 'MD' : 'Q'})`).join(', ')}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, playerId: playerId })
                              setPlayerSearch(player.name)
                            }}
                            className="text-sm text-wta-purple hover:underline"
                          >
                            Enter Result
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="font-semibold mb-4">
                  {editingMatch ? 'Edit Match Result' : 'Record Match Result'}
                </h2>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Player</label>
                    <input
                      type="text"
                      placeholder="Search players..."
                      value={playerSearch}
                      onChange={e => setPlayerSearch(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg mb-2"
                    />
                    <select
                      value={formData.playerId}
                      onChange={e => setFormData({ ...formData, playerId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                      size={5}
                    >
                      <option value="">Select player...</option>
                      {players
                        .filter(p =>
                          playerSearch === '' ||
                          p.name.toLowerCase().includes(playerSearch.toLowerCase())
                        )
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            #{p.wtaRanking} {p.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Round</label>
                    <select
                      value={formData.round}
                      onChange={e => setFormData({ ...formData, round: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {rounds.map(r => (
                        <option key={r} value={r}>
                          {r} ({ROUND_POINTS[r]} pts)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Result</label>
                    <select
                      value={formData.won ? 'won' : 'lost'}
                      onChange={e => setFormData({ ...formData, won: e.target.value === 'won' })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    disabled={saving || !formData.playerId}
                    className="bg-wta-purple text-white px-6 py-2 rounded-lg disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingMatch ? 'Update Result' : 'Record Result'}
                  </button>
                  {editingMatch && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div>
                <h2 className="font-semibold mb-4">Recorded Results</h2>
                {matches.length === 0 ? (
                  <p className="text-gray-500">No results recorded yet.</p>
                ) : (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm">Player</th>
                          <th className="px-4 py-3 text-left text-sm">Round</th>
                          <th className="px-4 py-3 text-left text-sm">Result</th>
                          <th className="px-4 py-3 text-right text-sm">Points</th>
                          <th className="px-4 py-3 text-right text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matches.map(match => (
                          <tr key={match.id} className="border-t">
                            <td className="px-4 py-2">{match.player.name}</td>
                            <td className="px-4 py-2">{match.round}</td>
                            <td className="px-4 py-2">
                              <span className={`text-sm ${match.won ? 'text-green-600' : 'text-red-600'}`}>
                                {match.won ? 'Won' : 'Lost'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-wta-purple">
                              {match.pointsAwarded}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={() => handleEdit(match)}
                                className="text-sm text-blue-600 hover:underline mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(match.id)}
                                className="text-sm text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
