'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { fetchUsers, type User } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'

export default function UsersPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    if (token) fetchUsers(token).then(setUsers).catch(() => {})
  }, [token])

  return (
    <AdminLayout>
      <h1 className="text-2xl font-heading font-bold">Registered Managers ({users.length})</h1>

      <div className="overflow-x-auto rounded-sm border border-stadium-700">
        <table className="w-full text-sm">
          <thead className="bg-stadium-800 text-gray-400 text-left">
            <tr>
              <th className="px-4 py-3">FPL Entry ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.fpl_entry_id} className="border-t border-stadium-800">
                <td className="px-4 py-3">{u.fpl_entry_id}</td>
                <td className="px-4 py-3">{u.full_name}</td>
                <td className="px-4 py-3">{u.fpl_team_name}</td>
                <td className="px-4 py-3 text-gray-400">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={u.status === 'active' ? 'text-pitch-green' : 'text-red-400'}>{u.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No registered users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
