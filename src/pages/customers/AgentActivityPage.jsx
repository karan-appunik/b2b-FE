import { useEffect, useState } from 'react'
import * as auditApi from '../../api/audit.api'
import * as customersApi from '../../api/customers.api'
import { isAgentRole } from '../../utils/roles'

const OUTCOMES = [
  { value: '', label: 'Any result' },
  { value: 'success', label: 'Worked' },
  { value: 'denied', label: 'Refused' },
  { value: 'failure', label: 'Failed' },
]

const GROUPS = [
  { value: '', label: 'Everything' },
  { value: 'context.entered', label: 'Customer entered' },
  { value: 'context.denied', label: 'Customer refused' },
  { value: 'override.requested', label: 'Exception requested' },
  { value: 'override.decided', label: 'Exception decided' },
  { value: 'quote.created', label: 'Quote created' },
  { value: 'quote.sent', label: 'Quote sent' },
  { value: 'order.attributed', label: 'Order placed' },
  { value: 'payment_link.created', label: 'Payment link sent' },
  { value: 'customer.created', label: 'Customer created' },
  { value: 'audit.exported', label: 'Activity exported' },
]

const OUTCOME_STYLE = {
  success: 'bg-green-50 text-green-700',
  denied: 'bg-amber-50 text-amber-800',
  failure: 'bg-red-50 text-red-700',
}

const PAGE = 50

// What agents did, and what was refused (spec §4.1 "Agent activity", §10.1).
// Filter it, page through it, or export it as a CSV file; an export is itself
// written to the activity log, and secrets never leave in it.
export default function AgentActivityPage() {
  const [filters, setFilters] = useState({ agentId: '', outcome: '', action: '', from: '', to: '' })
  const [events, setEvents] = useState([])
  const [people, setPeople] = useState({})
  const [agents, setAgents] = useState([])
  const [more, setMore] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    customersApi.list().then((all) => {
      const list = Array.isArray(all) ? all : all.customers || []
      setPeople(Object.fromEntries(list.map((c) => [c._id, c.company || c.name])))
      setAgents(list.filter((c) => isAgentRole(c.role)))
    })
  }, [])

  const params = (extra = {}) => {
    const p = { limit: PAGE, ...extra }
    for (const [k, v] of Object.entries(filters)) {
      if (!v) continue
      // a date from the date box means the start / end of that day
      p[k] = k === 'from' ? new Date(v + 'T00:00:00').toISOString() : k === 'to' ? new Date(v + 'T23:59:59').toISOString() : v
    }
    return p
  }

  function search() {
    setError('')
    auditApi
      .list(params())
      .then((rows) => {
        setEvents(rows)
        setMore(rows.length === PAGE)
        setLoaded(true)
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load the activity.'))
  }

  useEffect(search, [])

  function loadMore() {
    const last = events[events.length - 1]
    auditApi.list(params({ before: last.occurredAt })).then((rows) => {
      setEvents((e) => [...e, ...rows])
      setMore(rows.length === PAGE)
    })
  }

  async function exportFile() {
    setExporting(true)
    setError('')
    try {
      const p = params()
      delete p.limit
      await auditApi.exportCsv(p)
    } catch {
      setError('Could not export the activity.')
    } finally {
      setExporting(false)
    }
  }

  const who = (e) => (e.actor && people[e.actor]) || (e.actorType === 'merchant_user' ? 'Store staff' : e.actorType === 'system' ? 'System' : 'Unknown')
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const cls = 'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm'

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Agent activity</h1>
        <p className="mt-1 text-sm text-gray-500">
          Who did what, for which customer, and what was refused. Every export is recorded here too, and secrets are never included.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Agent</span>
          <select className={cls} value={filters.agentId} onChange={(e) => set('agentId', e.target.value)}>
            <option value="">Everyone</option>
            {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">What happened</span>
          <select className={cls} value={filters.action} onChange={(e) => set('action', e.target.value)}>
            {GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Result</span>
          <select className={cls} value={filters.outcome} onChange={(e) => set('outcome', e.target.value)}>
            {OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">From</span>
          <input type="date" className={cls} value={filters.from} onChange={(e) => set('from', e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">To</span>
          <input type="date" className={cls} value={filters.to} onChange={(e) => set('to', e.target.value)} />
        </label>
        <button onClick={search} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">Show</button>
        <button onClick={exportFile} disabled={exporting} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-50">
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Who</th>
              <th className="px-3 py-2">What</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Result</th>
              <th className="px-3 py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e._id} className="border-t border-gray-100">
                <td className="whitespace-nowrap px-3 py-2 text-gray-600">{new Date(e.occurredAt).toLocaleString()}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{who(e)}</td>
                <td className="px-3 py-2">{e.action}</td>
                <td className="px-3 py-2">{(e.customer && people[e.customer]) || '—'}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${OUTCOME_STYLE[e.outcome] || 'bg-gray-100 text-gray-600'}`}>
                    {OUTCOMES.find((o) => o.value === e.outcome)?.label || e.outcome}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-600">{e.reasonCode || ''}</td>
              </tr>
            ))}
            {loaded && events.length === 0 && (
              <tr><td colSpan="6" className="px-3 py-6 text-center text-gray-500">Nothing matches these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {more && (
        <button onClick={loadMore} className="mt-3 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700">Show older</button>
      )}
    </div>
  )
}
