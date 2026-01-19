'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SyncButtons() {
  const router = useRouter()
  const [syncing, setSyncing] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSync = async (type: 'rankings' | 'tournaments') => {
    setSyncing(type)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(data.message)
        router.refresh()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch {
      setMessage('Sync failed')
    } finally {
      setSyncing(null)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="font-semibold text-lg mb-4">Sync Data</h2>
      <p className="text-gray-600 text-sm mb-4">
        Pull latest WTA rankings and tournament calendar from online sources.
      </p>

      <div className="flex gap-4 flex-wrap">
        <button
          onClick={() => handleSync('rankings')}
          disabled={syncing !== null}
          className="bg-wta-purple text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-purple-800 transition"
        >
          {syncing === 'rankings' ? 'Syncing Rankings...' : 'Sync Rankings'}
        </button>

        <button
          onClick={() => handleSync('tournaments')}
          disabled={syncing !== null}
          className="bg-wta-pink text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-pink-600 transition"
        >
          {syncing === 'tournaments' ? 'Syncing Tournaments...' : 'Sync Tournaments'}
        </button>
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded text-sm ${
          message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Rankings data from <a href="https://github.com/JeffSackmann/tennis_wta" className="underline" target="_blank">Jeff Sackmann&apos;s WTA database</a>
      </p>
    </div>
  )
}
