'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Tournament = {
  id: string
  name: string
  level: string
  startDate: string
  endDate: string
  status: string
  pointsAllowance: number
}

export default function AdminTournamentsPage() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    level: 'WTA_500',
    startDate: '',
    endDate: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTournaments()
  }, [])

  const fetchTournaments = async () => {
    const res = await fetch('/api/admin/tournaments')
    const data = await res.json()
    setTournaments(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/admin/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (res.ok) {
      setShowForm(false)
      setFormData({ name: '', level: 'WTA_500', startDate: '', endDate: '' })
      fetchTournaments()
    }

    setSaving(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/tournaments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchTournaments()
    router.refresh()
  }

  const deleteTournament = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament? This will also delete all picks and results for this tournament.')) {
      return
    }
    await fetch(`/api/admin/tournaments/${id}`, {
      method: 'DELETE',
    })
    fetchTournaments()
    router.refresh()
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tournaments</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-wta-purple text-white px-4 py-2 rounded-lg"
        >
          {showForm ? 'Cancel' : 'Add Tournament'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Level</label>
              <select
                value={formData.level}
                onChange={e => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="WTA_500">WTA 500</option>
                <option value="WTA_1000">WTA 1000</option>
                <option value="GRAND_SLAM">Grand Slam</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 bg-wta-purple text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Tournament'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {tournaments.map(tournament => (
          <div key={tournament.id} className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{tournament.name}</div>
                <div className="text-sm text-gray-500">
                  {tournament.level.replace('_', ' ')} • {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded ${
                  tournament.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  tournament.status === 'UPCOMING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {tournament.status}
                </span>
                {tournament.status === 'UPCOMING' && (
                  <button
                    onClick={() => updateStatus(tournament.id, 'ACTIVE')}
                    className="text-sm text-green-600 hover:underline"
                  >
                    Start
                  </button>
                )}
                {tournament.status === 'ACTIVE' && (
                  <>
                    <button
                      onClick={() => updateStatus(tournament.id, 'UPCOMING')}
                      className="text-sm text-yellow-600 hover:underline"
                    >
                      Reopen Picks
                    </button>
                    <button
                      onClick={() => updateStatus(tournament.id, 'COMPLETED')}
                      className="text-sm text-green-600 hover:underline"
                    >
                      Complete
                    </button>
                  </>
                )}
                {tournament.status === 'COMPLETED' && (
                  <button
                    onClick={() => updateStatus(tournament.id, 'ACTIVE')}
                    className="text-sm text-yellow-600 hover:underline"
                  >
                    Reactivate
                  </button>
                )}
                <button
                  onClick={() => deleteTournament(tournament.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
