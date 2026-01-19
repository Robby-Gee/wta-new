'use client'

import { useState, useEffect } from 'react'
import { getPlayerCost } from '@/lib/scoring'

type Player = {
  id: string
  name: string
  country: string | null
  wtaRanking: number
  cost: number
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    wtaRanking: '',
    isWildcard: false,
  })
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)
  const [playerSearch, setPlayerSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkData, setBulkData] = useState('')

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    const res = await fetch('/api/admin/players')
    const data = await res.json()
    setPlayers(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Wildcards get ranking 999 (will cost 1 pt)
    const ranking = formData.isWildcard ? 999 : parseInt(formData.wtaRanking)

    if (editingPlayer) {
      const res = await fetch(`/api/admin/players/${editingPlayer}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          country: formData.country || null,
          wtaRanking: ranking,
        }),
      })

      if (res.ok) {
        setShowForm(false)
        setFormData({ name: '', country: '', wtaRanking: '', isWildcard: false })
        setEditingPlayer(null)
        fetchPlayers()
      }
    } else {
      const res = await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          country: formData.country || null,
          wtaRanking: ranking,
        }),
      })

      if (res.ok) {
        setShowForm(false)
        setFormData({ name: '', country: '', wtaRanking: '', isWildcard: false })
        fetchPlayers()
      }
    }

    setSaving(false)
  }

  const handleEdit = (player: Player) => {
    setFormData({
      name: player.name,
      country: player.country || '',
      wtaRanking: player.wtaRanking.toString(),
      isWildcard: player.wtaRanking >= 999,
    })
    setEditingPlayer(player.id)
    setShowForm(true)
    setBulkMode(false)
  }

  const handleCancelEdit = () => {
    setFormData({ name: '', country: '', wtaRanking: '', isWildcard: false })
    setEditingPlayer(null)
    setShowForm(false)
  }

  const handleDelete = async (playerId: string) => {
    if (!confirm('Are you sure you want to delete this player? This will also delete all their picks and results.')) {
      return
    }

    await fetch(`/api/admin/players/${playerId}`, {
      method: 'DELETE',
    })
    fetchPlayers()
  }

  const filteredPlayers = players.filter(p =>
    playerSearch === '' ||
    p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
    (p.country && p.country.toLowerCase().includes(playerSearch.toLowerCase()))
  )

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Parse bulk data: "Name, Country, Ranking" per line
    const lines = bulkData.trim().split('\n')
    const playersToAdd = lines.map(line => {
      const [name, country, ranking] = line.split(',').map(s => s.trim())
      return {
        name,
        country: country || null,
        wtaRanking: parseInt(ranking),
      }
    }).filter(p => p.name && !isNaN(p.wtaRanking))

    const res = await fetch('/api/admin/players/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ players: playersToAdd }),
    })

    if (res.ok) {
      setBulkMode(false)
      setBulkData('')
      fetchPlayers()
    }

    setSaving(false)
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Players ({players.length})</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setBulkMode(!bulkMode); setShowForm(false) }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            {bulkMode ? 'Cancel Bulk' : 'Bulk Add'}
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setBulkMode(false) }}
            className="bg-wta-purple text-white px-4 py-2 rounded-lg"
          >
            {showForm ? 'Cancel' : 'Add Player'}
          </button>
        </div>
      </div>

      {bulkMode && (
        <form onSubmit={handleBulkSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <p className="text-sm text-gray-600 mb-2">
            Enter one player per line: Name, Country, Ranking
          </p>
          <textarea
            value={bulkData}
            onChange={e => setBulkData(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg h-48 font-mono text-sm"
            placeholder="Aryna Sabalenka, BLR, 1&#10;Iga Swiatek, POL, 2&#10;Coco Gauff, USA, 3"
          />
          <button
            type="submit"
            disabled={saving}
            className="mt-4 bg-wta-purple text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add All Players'}
          </button>
        </form>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="font-semibold mb-4">
            {editingPlayer ? 'Edit Player' : 'Add Player'}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., USA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">WTA Ranking</label>
              <input
                type="number"
                value={formData.wtaRanking}
                onChange={e => setFormData({ ...formData, wtaRanking: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                min="1"
                required={!formData.isWildcard}
                disabled={formData.isWildcard}
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isWildcard}
                onChange={e => setFormData({ ...formData, isWildcard: e.target.checked, wtaRanking: e.target.checked ? '999' : '' })}
                className="rounded"
              />
              <span className="text-sm">Wildcard/Unranked player (automatically costs 1 pt)</span>
            </label>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Cost will be: {formData.isWildcard ? 1 : (formData.wtaRanking ? getPlayerCost(parseInt(formData.wtaRanking)) : '-')} points
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-wta-purple text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingPlayer ? 'Update Player' : 'Add Player'}
            </button>
            {editingPlayer && (
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
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search players..."
          value={playerSearch}
          onChange={e => setPlayerSearch(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border rounded-lg"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm">Rank</th>
              <th className="px-4 py-3 text-left text-sm">Name</th>
              <th className="px-4 py-3 text-left text-sm">Country</th>
              <th className="px-4 py-3 text-right text-sm">Cost</th>
              <th className="px-4 py-3 text-right text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map(player => (
              <tr key={player.id} className="border-t">
                <td className="px-4 py-2 text-sm">
                  {player.wtaRanking >= 999 ? (
                    <span className="text-orange-600">WC</span>
                  ) : (
                    `#${player.wtaRanking}`
                  )}
                </td>
                <td className="px-4 py-2 font-medium">{player.name}</td>
                <td className="px-4 py-2 text-sm text-gray-500">{player.country || '-'}</td>
                <td className="px-4 py-2 text-right font-bold text-wta-purple">{player.cost} pts</td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleEdit(player)}
                    className="text-sm text-blue-600 hover:underline mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(player.id)}
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
    </div>
  )
}
