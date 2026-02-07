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
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteData, setPasteData] = useState('')
  const [parsedPlayers, setParsedPlayers] = useState<{ name: string; country: string | null; wtaRanking: number }[]>([])
  const [parseError, setParseError] = useState('')

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

  // Parse WTA PDF text - format: "1 (1) SABALENKA, ARYNA POL 10990 20 ..."
  const parseWtaRankings = (text: string) => {
    const lines = text.trim().split('\n')
    const players: { name: string; country: string | null; wtaRanking: number }[] = []
    const errors: string[] = []
    const seenRanks = new Set<number>()

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // Skip header/footer lines
      if (trimmed.includes('Printed:') ||
          trimmed.includes('WTA Singles') ||
          trimmed.includes('As of:') ||
          trimmed.startsWith('Rank Prior') ||
          trimmed.startsWith('of ')) continue

      // WTA PDF format: "1 (1) LASTNAME, FIRSTNAME [COUNTRY] POINTS ..."
      // Country code is optional (some players like Russians don't have it)
      // Last name can have spaces (e.g., "RAKOTOMANGA RAJAONAH")
      const match = trimmed.match(/^(\d+)\s+\(\d+\)\s+([A-Z][A-Z\-' ]+),\s+([A-Z][A-Za-z\-' ]+?)(?:\s+([A-Z]{3}))?\s+(\d+)\s/)

      if (match) {
        const rank = parseInt(match[1])
        // Skip if we've seen this rank (handles duplicate pastes)
        if (seenRanks.has(rank)) continue
        seenRanks.add(rank)

        const lastName = match[2].trim()
        const firstName = match[3].trim()
        const country = match[4] || null

        // Convert "SABALENKA, ARYNA" to "Aryna Sabalenka"
        const formatName = (first: string, last: string) => {
          const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
          const formatPart = (part: string) =>
            part.split(/\s+/).map(word =>
              word.split('-').map(titleCase).join('-')
            ).join(' ')
          return `${formatPart(first)} ${formatPart(last)}`
        }

        const name = formatName(firstName, lastName)

        if (rank && name && rank <= 1000) {
          players.push({ name, country, wtaRanking: rank })
        }
      } else if (/^\d+\s+\(\d+\)/.test(trimmed)) {
        // Has rank pattern but didn't match fully
        errors.push(trimmed.substring(0, 60))
      }
    }

    // Sort by rank
    players.sort((a, b) => a.wtaRanking - b.wtaRanking)

    return { players, errors }
  }

  const handleParsePaste = () => {
    const { players, errors } = parseWtaRankings(pasteData)
    setParsedPlayers(players)
    if (players.length === 0 && errors.length > 0) {
      setParseError(`Could not parse any players. Sample unmatched lines: ${errors.slice(0, 3).join(', ')}`)
    } else if (errors.length > 0) {
      setParseError(`Parsed ${players.length} players. ${errors.length} lines skipped.`)
    } else {
      setParseError('')
    }
  }

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (parsedPlayers.length === 0) return
    setSaving(true)

    const res = await fetch('/api/admin/rankings/paste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ players: parsedPlayers }),
    })

    if (res.ok) {
      const data = await res.json()
      alert(`Rankings updated: ${data.updated} updated, ${data.created} new players`)
      setPasteMode(false)
      setPasteData('')
      setParsedPlayers([])
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
            onClick={() => { setPasteMode(!pasteMode); setBulkMode(false); setShowForm(false); setParsedPlayers([]) }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            {pasteMode ? 'Cancel' : 'Paste Rankings'}
          </button>
          <button
            onClick={() => { setBulkMode(!bulkMode); setShowForm(false); setPasteMode(false) }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            {bulkMode ? 'Cancel Bulk' : 'Bulk Add'}
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setBulkMode(false); setPasteMode(false) }}
            className="bg-wta-purple text-white px-4 py-2 rounded-lg"
          >
            {showForm ? 'Cancel' : 'Add Player'}
          </button>
        </div>
      </div>

      {pasteMode && (
        <form onSubmit={handlePasteSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="font-semibold mb-2">Paste WTA Rankings</h2>
          <p className="text-sm text-gray-600 mb-2">
            Copy text from the <a href="https://wtafiles.wtatennis.com/pdf/rankings/Singles_Numeric.pdf" target="_blank" className="text-blue-600 underline">WTA Rankings PDF</a> and paste below.
            Expected format: &quot;1 Aryna Sabalenka BLR 10,990&quot; per line.
          </p>
          <textarea
            value={pasteData}
            onChange={e => { setPasteData(e.target.value); setParsedPlayers([]) }}
            className="w-full px-3 py-2 border rounded-lg h-48 font-mono text-sm"
            placeholder="Paste rankings text here..."
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleParsePaste}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Preview Parse
            </button>
            {parsedPlayers.length > 0 && (
              <button
                type="submit"
                disabled={saving}
                className="bg-wta-purple text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {saving ? 'Updating...' : `Update ${parsedPlayers.length} Players`}
              </button>
            )}
          </div>
          {parseError && (
            <p className="mt-2 text-sm text-orange-600">{parseError}</p>
          )}
          {parsedPlayers.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Preview (first 10):</p>
              <div className="text-sm bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                {parsedPlayers.slice(0, 10).map((p, i) => (
                  <div key={i}>#{p.wtaRanking} {p.name} ({p.country}) - Cost: {getPlayerCost(p.wtaRanking)}</div>
                ))}
                {parsedPlayers.length > 10 && (
                  <div className="text-gray-500">...and {parsedPlayers.length - 10} more</div>
                )}
              </div>
            </div>
          )}
        </form>
      )}

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
