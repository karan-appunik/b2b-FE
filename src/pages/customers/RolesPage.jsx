import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as rolesApi from '../../api/roles.api'

export default function RolesPage() {
  const [roles, setRoles] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  function refresh() {
    rolesApi.list().then((data) => {
      setRoles(data.roles)
      setLoaded(true)
    })
  }

  useEffect(refresh, [])

  async function handleDelete(role) {
    if (!confirm(`Delete the role "${role.name}"?`)) return

    setError('')
    try {
      await rolesApi.remove(role.key)
      refresh()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this role.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Roles</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage permissions and access levels for your sales team.
          </p>
        </div>
        <Link
          to="/customers/roles/new"
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Create role
        </Link>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Assigned</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {roles.map((role) => (
              <tr key={role.key}>
                <td className="px-4 py-3">
                  <span className="block font-medium text-gray-900">{role.name}</span>
                  {role.inheritsFrom && (
                    <span className="block text-xs text-gray-400">
                      Inherits from {roles.find((r) => r.key === role.inheritsFrom)?.name || role.inheritsFrom}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                      role.isSystem
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-cyan-200 bg-cyan-50 text-cyan-800'
                    }`}
                  >
                    {role.isSystem ? 'System role' : 'Custom role'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {role.memberCount} {role.memberCount === 1 ? 'agent' : 'agents'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/customers/roles/${role.key}`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                    {!role.isSystem && (
                      <button
                        onClick={() => handleDelete(role)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {loaded && roles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No roles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
