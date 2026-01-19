'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Player = {
  id: string
  name: string
  country: string | null
  wtaRanking: number
  cost: number
}

type Pick = {
  id: string
  playerId: string
  pickType: string
  player: Player
}

type Tournament = {
  id: string
  name: string
  level: string
}

type Props = {
  tournament: Tournament
  players: Player[]
  existingPicks: Pick[]
  budget: number
  requiredPicks: { mainDraw: number; qualifier: number }
}

export function PickSelector({
  tournament,
  players,
  existingPicks,
  budget,
  requiredPicks,
}: Props) {
  const router = useRouter()
  const [selectedMainDraw, setSelectedMainDraw] = useState<string[]>(
    existingPicks.filter(p => p.pickType === 'MAIN_DRAW').map(p => p.playerId)
  )
  const [selectedQualifier, setSelectedQualifier] = useState<string[]>(
    existingPicks.filter(p => p.pickType === 'QUALIFIER').map(p => p.playerId)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mainDrawSearch, setMainDrawSearch] = useState('')
  const [qualifierSearch, setQualifierSearch] = useState('')

  const QUALIFIER_COST = 3 // Fixed cost for qualifier picks

  // Filter players based on search
  const mainDrawPlayers = players.filter(p =>
    p.name.toLowerCase().includes(mainDrawSearch.toLowerCase()) ||
    (p.country && p.country.toLowerCase().includes(mainDrawSearch.toLowerCase()))
  )
  const qualifierPlayers = players.filter(p =>
    p.name.toLowerCase().includes(qualifierSearch.toLowerCase()) ||
    (p.country && p.country.toLowerCase().includes(qualifierSearch.toLowerCase()))
  )

  // Calculate cost: main draw uses player cost, qualifiers always cost 3
  const mainDrawCost = selectedMainDraw.reduce((sum, id) => {
    const player = players.find(p => p.id === id)
    return sum + (player?.cost || 0)
  }, 0)
  const qualifierCost = selectedQualifier.length * QUALIFIER_COST
  const selectedCost = mainDrawCost + qualifierCost

  const existingMainDrawCost = existingPicks
    .filter(p => p.pickType === 'MAIN_DRAW')
    .reduce((sum, p) => sum + p.player.cost, 0)
  const existingQualifierCost = existingPicks
    .filter(p => p.pickType === 'QUALIFIER')
    .length * QUALIFIER_COST
  const existingCost = existingMainDrawCost + existingQualifierCost
  const availableBudget = budget + existingCost

  const toggleMainDraw = (playerId: string) => {
    if (selectedMainDraw.includes(playerId)) {
      setSelectedMainDraw(prev => prev.filter(id => id !== playerId))
    } else if (selectedMainDraw.length < requiredPicks.mainDraw) {
      setSelectedMainDraw(prev => [...prev, playerId])
    }
  }

  const toggleQualifier = (playerId: string) => {
    if (selectedQualifier.includes(playerId)) {
      setSelectedQualifier(prev => prev.filter(id => id !== playerId))
    } else if (selectedQualifier.length < requiredPicks.qualifier) {
      setSelectedQualifier(prev => [...prev, playerId])
    }
  }

  const handleSubmit = async () => {
    if (selectedCost > availableBudget) {
      setError('Not enough budget for these picks')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          mainDrawPicks: selectedMainDraw,
          qualifierPicks: selectedQualifier,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save picks')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save picks')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Main Draw Picks ({selectedMainDraw.length}/{requiredPicks.mainDraw})
        </h2>
        <input
          type="text"
          placeholder="Search players..."
          value={mainDrawSearch}
          onChange={e => setMainDrawSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg mb-3"
        />
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {mainDrawPlayers.map(player => {
            const isSelected = selectedMainDraw.includes(player.id)
            const isPickedAsQualifier = selectedQualifier.includes(player.id)
            const canAfford = player.cost <= availableBudget - selectedCost + (isSelected ? player.cost : 0)
            const isFull = selectedMainDraw.length >= requiredPicks.mainDraw && !isSelected

            return (
              <button
                key={player.id}
                onClick={() => toggleMainDraw(player.id)}
                disabled={!isSelected && (isFull || !canAfford || isPickedAsQualifier)}
                className={`w-full p-3 rounded-lg text-left flex justify-between items-center transition ${
                  isSelected
                    ? 'bg-wta-purple text-white'
                    : isPickedAsQualifier
                    ? 'bg-pink-50 text-gray-400 cursor-not-allowed'
                    : isFull || !canAfford
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-50 border'
                }`}
              >
                <div>
                  <div className="font-medium">{player.name}</div>
                  <div className={`text-sm ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>
                    Rank #{player.wtaRanking} {player.country && `• ${player.country}`}
                    {isPickedAsQualifier && ' • Picked as Qualifier'}
                  </div>
                </div>
                <div className={`font-bold ${isSelected ? 'text-white' : 'text-wta-purple'}`}>
                  {player.cost} pts
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Qualifier Picks ({selectedQualifier.length}/{requiredPicks.qualifier})
        </h2>
        <input
          type="text"
          placeholder="Search players..."
          value={qualifierSearch}
          onChange={e => setQualifierSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg mb-3"
        />
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {qualifierPlayers.map(player => {
            const isSelected = selectedQualifier.includes(player.id)
            const isPickedAsMainDraw = selectedMainDraw.includes(player.id)
            const canAfford = QUALIFIER_COST <= availableBudget - selectedCost + (isSelected ? QUALIFIER_COST : 0)
            const isFull = selectedQualifier.length >= requiredPicks.qualifier && !isSelected

            return (
              <button
                key={player.id}
                onClick={() => toggleQualifier(player.id)}
                disabled={!isSelected && (isFull || !canAfford || isPickedAsMainDraw)}
                className={`w-full p-3 rounded-lg text-left flex justify-between items-center transition ${
                  isSelected
                    ? 'bg-wta-pink text-white'
                    : isPickedAsMainDraw
                    ? 'bg-purple-50 text-gray-400 cursor-not-allowed'
                    : isFull || !canAfford
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-50 border'
                }`}
              >
                <div>
                  <div className="font-medium">{player.name}</div>
                  <div className={`text-sm ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>
                    Rank #{player.wtaRanking} {player.country && `• ${player.country}`}
                    {isPickedAsMainDraw && ' • Picked as Main Draw'}
                  </div>
                </div>
                <div className={`font-bold ${isSelected ? 'text-white' : 'text-wta-pink'}`}>
                  {QUALIFIER_COST} pts
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="md:col-span-2 bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">Total Cost</div>
            <div className={`text-2xl font-bold ${selectedCost > availableBudget ? 'text-red-600' : 'text-green-600'}`}>
              {selectedCost} pts
            </div>
            {selectedCost > availableBudget && (
              <div className="text-sm text-red-600">Over budget by {selectedCost - availableBudget} pts</div>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving || selectedCost > availableBudget}
            className="bg-wta-purple text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-800 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Picks'}
          </button>
        </div>
      </div>
    </div>
  )
}
