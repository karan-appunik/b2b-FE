import { useEffect, useState } from 'react'
import * as reportsApi from '../../api/reports.api'

const GROUPS = [
  { value: 'none', label: 'Overall' },
  { value: 'agent', label: 'By Agent' },
  { value: 'territory', label: 'By Territory' },
  { value: 'segment', label: 'By Segment' },
]

const PERIODS = [
  { days: 7, label: 'Last 7 Days' },
  { days: 30, label: 'Last 30 Days' },
  { days: 90, label: 'Last 90 Days' },
  { days: 365, label: 'Last Year' },
]

function money(map) {
  const entries = Object.entries(map || {})
  if (!entries.length) return '—'
  return entries
    .map(([currency, amount]) => {
      try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
      } catch {
        return `${amount} ${currency}`
      }
    })
    .join(' + ')
}

const pct = (v) => (v === null || v === undefined ? '—' : `${v}%`)

// What the sales agents did (spec §10.3): assisted orders, revenue, quotes,
// conversion, new customers and override rate by agent, territory or segment,
// plus what needs attention now. Assisted orders are kept apart from the rest,
// and being tied to an order is not commission entitlement.
export default function AgentReportsPage() {
  const [days, setDays] = useState(30)
  const [groupBy, setGroupBy] = useState('agent')
  const [hideNames, setHideNames] = useState(false)
  const [report, setReport] = useState(null)
  const [ops, setOps] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const to = new Date()
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)

    reportsApi
      .sales({ from: from.toISOString(), to: to.toISOString(), groupBy, pseudonymous: hideNames ? 'true' : undefined })
      .then((data) => {
        setReport(data)
        setError('')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load the report.'))
  }, [days, groupBy, hideNames])

  useEffect(() => {
    reportsApi.operations().then(setOps).catch(() => setOps(null))
  }, [])

  const rows = report ? (groupBy === 'none' ? [report.total] : report.rows) : []

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Agent reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Orders placed by sales agents, their quotes and exceptions. An order being linked to an agent is not commission entitlement.
        </p>
      </div>

      {ops && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Approvals waiting" value={ops.pendingApprovals.count}
            note={ops.pendingApprovals.slaBreaches ? `${ops.pendingApprovals.slaBreaches} past their time limit` : 'none overdue'}
            bad={ops.pendingApprovals.slaBreaches > 0} />
          <Card title="Stale carts" value={ops.staleCarts.count} note={`untouched for ${ops.staleCarts.days}+ days`} />
          <Card title="Quotes expiring" value={ops.expiringQuotes.count} note={`within ${ops.expiringQuotes.days} days`} />
          {ops.integrations.webhookConfigured ? (
            <Card title="Integration problems" value={ops.integrations.failed + ops.integrations.backlog}
              note={`${ops.integrations.failed} failed, ${ops.integrations.backlog} stuck`} bad={ops.integrations.failed > 0} />
          ) : (
            <Card title="Event webhook" value="Not set up"
              note={`${ops.integrations.backlog} events waiting to be sent`} />
          )}
        </div>
      )}

      {ops && ops.accessAnomalies.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Unusual access attempts in the last 24 hours:{' '}
          {ops.accessAnomalies.map((a) => `${a.agent.split('/').pop()} (${a.deniedLast24h} refused)`).join(', ')}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white pl-3.5 pr-10 py-2 text-sm shadow-xs">
            {PERIODS.map((p) => <option key={p.days} value={p.days}>{p.label}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={hideNames} onChange={(e) => setHideNames(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
            Show agents as codes, not names
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {GROUPS.map((g) => (
            <button key={g.value} onClick={() => setGroupBy(g.value)}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition ${groupBy === g.value ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {report && (
        <>
          <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3.5 whitespace-nowrap">{groupBy === 'none' ? 'Total' : GROUPS.find((g) => g.value === groupBy).label.replace('By ', '')}</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Orders</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Revenue</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Avg order</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Active accounts</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Quotes (sent)</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Quote conversion</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">New customers</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Exceptions</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Exceptions per order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.key} className="hover:bg-gray-50/60 transition">
                      <td className="px-4 py-3.5 font-medium text-gray-900 whitespace-nowrap">{groupBy === 'none' ? 'All agents' : r.label}</td>
                      <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{r.orders}</td>
                      <td className="px-4 py-3.5 font-medium text-gray-900 whitespace-nowrap">{money(r.revenue)}</td>
                      <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{money(r.averageOrderValue)}</td>
                      <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{r.activeAccounts}</td>
                      <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{r.quotes.created} ({r.quotes.sent})</td>
                      <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{pct(r.quoteConversion)}</td>
                      <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{r.newCustomers}</td>
                      <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{r.overrides}</td>
                      <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{r.overrideRate === null ? '—' : (r.overrideRate / 100).toFixed(1)}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan="10" className="px-4 py-8 text-center text-gray-500">No activity in this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Where orders came from</h3>
            <div className="space-y-2.5 text-sm text-gray-600">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-800">Placed by a sales agent:</span>
                <span>{report.sources.assisted?.orders ?? 0} orders, {money(report.sources.assisted?.revenue)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-800">Everything else (customers ordering themselves, imports):</span>
                <span>{report.sources.other?.orders ?? 0} orders, {money(report.sources.other?.revenue)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Card({ title, value, note, bad }) {
  return (
    <div className={`rounded-xl border bg-white p-5 shadow-xs transition hover:border-gray-300 ${bad ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</div>
      <div className={`mt-2 text-2xl font-bold tracking-tight ${bad ? 'text-red-600' : 'text-gray-900'}`}>{value}</div>
      <div className="mt-1.5 text-xs text-gray-500">{note}</div>
    </div>
  )
}
