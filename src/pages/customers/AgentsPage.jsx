import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as agentsApi from '../../api/agents.api'
import * as rolesApi from '../../api/roles.api'
import { roleName } from '../../utils/roles'

const STATUS_STYLE = {
  active: 'bg-green-50 text-green-700',
  scheduled: 'bg-amber-50 text-amber-800',
  expired: 'bg-red-50 text-red-700',
}

const STATUS_TEXT = { active: 'Active', scheduled: 'Starts later', expired: 'Ended' }

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Starts later' },
  { value: 'expired', label: 'Ended' },
]

// The agents list (spec §4.1): who they are, how many customers they can reach,
// when they last worked, what they have open, and whether they may work today.
export default function AgentsPage() {
  const [agents, setAgents] = useState([])
  const [roles, setRoles] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    agentsApi.overview().then((data) => {
      setAgents(data.agents)
      setLoaded(true)
    })
    rolesApi.list().then((data) => setRoles(data.roles))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return agents.filter(
      (a) =>
        (!status || a.status === status) &&
        (!q || a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.territory?.toLowerCase().includes(q)),
    )
  }, [agents, search, status])

  async function exportCsv() {
    setError('')
    try {
      await agentsApi.exportCsv()
    } catch {
      setError('Could not export the list.')
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sales agents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sales agents can place orders and manage accounts on behalf of your B2B customers.
          </p>
        </div>
        <button onClick={exportCsv} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          Export CSV
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or territory…"
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none sm:w-72"
        />
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`rounded-full px-3 py-1 text-sm ${status === f.value ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Territory</th>
                <th className="px-4 py-3 font-medium">Manager</th>
                <th className="px-4 py-3 font-medium">Customers</th>
                <th className="px-4 py-3 font-medium">Last login</th>
                <th className="px-4 py-3 font-medium">Last active</th>
                <th className="px-4 py-3 font-medium">Open work</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">MFA</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    <Link to={`/customers/${a.id}`} className="font-medium text-purple-600 hover:underline">
                      {a.name}
                    </Link>
                    <div className="text-xs text-gray-500">{a.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                      {roleName(roles, a.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.territory || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{a.manager || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{a.customerCount}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {a.lastActiveAt ? new Date(a.lastActiveAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {a.openWork.quotes} quotes · {a.openWork.exceptions} waiting · {a.openWork.carts} carts
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status]}`}>
                      {STATUS_TEXT[a.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{a.mfa}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/customers/${a.id}`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {loaded && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                    {agents.length === 0
                      ? 'No sales agents yet — open a customer and assign them the "Sales agent" or "Sales administrator" role.'
                      : 'No agents match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
