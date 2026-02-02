'use client'

import { useState, useEffect } from 'react'

type User = {
  id: string
  name: string | null
  isAdmin: boolean
  hiddenFromLeaderboard: boolean
  totalPoints: number
  startingPoints: number
  createdAt: string
  _count: {
    picks: number
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data)
    setLoading(false)
  }

  const toggleHidden = async (userId: string, hidden: boolean) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hiddenFromLeaderboard: hidden }),
    })
    fetchUsers()
  }

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAdmin }),
    })
    fetchUsers()
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will delete all their picks.')) {
      return
    }
    await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    })
    fetchUsers()
  }

  const updateStartingPoints = async (userId: string, startingPoints: number) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startingPoints }),
    })
    fetchUsers()
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Users ({users.length})</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm">User</th>
              <th className="px-4 py-3 text-center text-sm">Picks</th>
              <th className="px-4 py-3 text-center text-sm">Points</th>
              <th className="px-4 py-3 text-center text-sm">Starting Pts</th>
              <th className="px-4 py-3 text-center text-sm">Status</th>
              <th className="px-4 py-3 text-right text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{user.name || 'Anonymous'}</div>
                </td>
                <td className="px-4 py-3 text-center">{user._count.picks}</td>
                <td className="px-4 py-3 text-center font-bold text-green-600">{user.totalPoints}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    defaultValue={user.startingPoints}
                    className="w-16 text-center border rounded px-1 py-0.5"
                    onBlur={(e) => {
                      const value = parseInt(e.target.value) || 0
                      if (value !== user.startingPoints) {
                        updateStartingPoints(user.id, value)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur()
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex flex-col gap-1 items-center">
                    {user.isAdmin && (
                      <span className="text-xs bg-wta-purple text-white px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                    {user.hiddenFromLeaderboard && (
                      <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-col gap-1 items-end text-sm">
                    <button
                      onClick={() => toggleHidden(user.id, !user.hiddenFromLeaderboard)}
                      className={user.hiddenFromLeaderboard ? 'text-green-600 hover:underline' : 'text-orange-600 hover:underline'}
                    >
                      {user.hiddenFromLeaderboard ? 'Show on Leaderboard' : 'Hide from Leaderboard'}
                    </button>
                    <button
                      onClick={() => toggleAdmin(user.id, !user.isAdmin)}
                      className={user.isAdmin ? 'text-gray-600 hover:underline' : 'text-blue-600 hover:underline'}
                    >
                      {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
