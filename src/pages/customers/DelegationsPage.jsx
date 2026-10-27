import { useEffect, useState } from 'react'
import * as api from '../../api/delegations.api'
import * as agentsApi from '../../api/agents.api'

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all'

const STATUS_STYLE = {
  active: 'bg-green-50 text-green-700 border-green-100',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-100',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
  revoked: 'bg-red-50 text-red-700 border-red-100',
}

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function defaultEnd() {
  return toLocalInput(new Date(Date.now() + 7 * 24 * 3600 * 1000))
}

// One agent lets another decide approvals for a while, in their name, and
// optionally work for their customers. Everything a delegate decides names both
// people in the audit trail.
export default function DelegationsPage() {
  const [rows, setRows] = useState([])
  const [agents, setAgents] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ delegatorId: '', delegateId: '', endsAt: defaultEnd(), reason: '', coverAccess: false, includeQuotes: true })
  const [saving, setSaving] = useState(false)
  const [endingId, setEndingId] = useState(null)

  function load() {
    return api.list().then((data) => {
      setRows(data)
      setLoaded(true)
    })
  }

  useEffect(() => {
    load()
    agentsApi.overview().then((data) => setAgents(data.agents || []))
  }, [])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.create({ ...form, endsAt: new Date(form.endsAt).toISOString() })
      setForm({ ...form, reason: '' })
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the delegation.')
    } finally {
      setSaving(false)
    }
  }

  async function end(id) {
    if (endingId) return
    setError('')
    setEndingId(id)
    try {
      await api.revoke(id, 'Ended by the merchant')
      await load()
    } catch (err) {
      await load()
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Could not end the delegation.')
      }
    } finally {
      setEndingId(null)
    }
  }

  const shown = filter ? rows.filter((r) => r.status === filter) : rows

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Delegations</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
          Let one sales agent decide approvals in the name of another for a limited time, for example during a holiday. The delegate only has what the
          other person has, never more. Nobody can approve their own request this way, and every decision names both people in the audit trail.
          Turning on access also lets the delegate work for the customers the other person was given.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
        <h2 className="text-base font-semibold text-gray-900">New delegation</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Delegated by</span>
            <select id="deleg-from" required value={form.delegatorId} onChange={(e) => setForm({ ...form, delegatorId: e.target.value })} className={inputClass}>
              <option value="">Choose an agent</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Delegated to</span>
            <select id="deleg-to" required value={form.delegateId} onChange={(e) => setForm({ ...form, delegateId: e.target.value })} className={inputClass}>
              <option value="">Choose an agent</option>
              {agents.filter((a) => a.id !== form.delegatorId).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Until</span>
            <input id="deleg-end" type="datetime-local" required value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Reason</span>
            <input id="deleg-reason" type="text" required maxLength={300} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="For example: on holiday" className={inputClass} />
          </label>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input id="deleg-quotes" type="checkbox" checked={form.includeQuotes} onChange={(e) => setForm({ ...form, includeQuotes: e.target.checked })} />
            Include quote approvals
          </label>
          <label className="flex items-center gap-2">
            <input id="deleg-cover" type="checkbox" checked={form.coverAccess} onChange={(e) => setForm({ ...form, coverAccess: e.target.checked })} />
            Also give access to their customers
          </label>
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60">
          {saving ? 'Saving…' : 'Create delegation'}
        </button>
      </form>

      <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900">All delegations</h2>
          <select aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="revoked">Ended</option>
          </select>
        </div>

        <div className="space-y-3">
          {shown.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-4">
              <div className="min-w-0 text-sm">
                <div className="font-semibold text-gray-900">
                  {d.delegator.name} <span className="font-normal text-gray-500">to</span> {d.delegate.name}
                  <span className={`ml-2 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[d.status]}`}>{d.status === 'revoked' ? 'ended' : d.status}</span>
                </div>
                <div className="text-gray-600">
                  {new Date(d.startsAt).toLocaleString()} to {new Date(d.endsAt).toLocaleString()} · {d.reason}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {d.includeQuotes ? 'Exceptions and quotes' : 'Exceptions only'}
                  {d.coverAccess ? ' · with access to their customers' : ''} · used {d.usedTimes} {d.usedTimes === 1 ? 'time' : 'times'}
                  {d.revokedReason ? ` · ${d.revokedReason}` : ''}
                </div>
              </div>
              {(d.status === 'active' || d.status === 'scheduled') && (
                <button
                  type="button"
                  disabled={endingId === d.id}
                  onClick={() => end(d.id)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {endingId === d.id ? 'Ending…' : 'End now'}
                </button>
              )}
            </div>
          ))}
          {loaded && !shown.length && (
            <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">No delegations yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
