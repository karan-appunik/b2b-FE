import { useState } from 'react'
import * as api from '../../api/feeds.api'

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-xs focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all'

const FEEDS = [
  {
    key: 'crm-accounts',
    title: 'CRM: accounts',
    path: '/api/integrations/crm/accounts',
    dates: false,
    text: 'Every customer account with its code, territory, legal entity, the agents it is assigned to, open quotes and last order. For loading into a CRM.',
  },
  {
    key: 'crm-quotes',
    title: 'CRM: quotes',
    path: '/api/integrations/crm/quotes',
    dates: true,
    text: 'Every quote with its latest amount and a plain stage (prospecting, proposal, negotiation, won, lost) taken from the quote’s own state. This is not a sales pipeline.',
  },
  {
    key: 'commission-input',
    title: 'Commission: order input',
    path: '/api/integrations/commission-feed',
    dates: true,
    text: 'Orders an agent placed for a customer, with the order total as recorded and the price concessions that were approved. It does not work out a commission. An agent being on an order is not an entitlement, and net sales are not tracked, so that column stays empty.',
  },
]

// Read-only exports for the merchant's own CRM and commission systems.
export default function IntegrationFeedsPage() {
  const [names, setNames] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [shown, setShown] = useState({})

  const params = (feed) => ({ ...(feed.dates && from ? { from: new Date(from).toISOString() } : {}), ...(feed.dates && to ? { to: new Date(to).toISOString() } : {}), ...(names ? { names: 'true' } : {}) })

  async function run(feed, mode) {
    setError('')
    setBusy(feed.key + mode)
    try {
      if (mode === 'csv') await api.download(feed.path, params(feed), feed.key)
      else {
        const data = await api.preview(feed.path, params(feed))
        setShown((s) => ({ ...s, [feed.key]: data }))
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not get this feed.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">CRM and commission feeds</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
          Files for your own CRM and commission systems. They only report what already happened and change nothing. Agents appear as codes unless you ask for names.
          Every download is written to the audit trail.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">From (quotes and commission)</span>
            <input id="feed-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">To</span>
            <input id="feed-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-gray-700">
            <input id="feed-names" type="checkbox" checked={names} onChange={(e) => setNames(e.target.checked)} />
            Show agent names instead of codes
          </label>
        </div>
        <p className="mt-2 text-xs text-gray-500">Leave the dates empty for the last 30 days. One request covers up to a year.</p>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {FEEDS.map((feed) => (
        <div key={feed.key} className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
          <h2 className="text-base font-semibold text-gray-900">{feed.title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-500">{feed.text}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={() => run(feed, 'csv')} disabled={!!busy} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60">
              {busy === feed.key + 'csv' ? 'Preparing…' : 'Download CSV'}
            </button>
            <button onClick={() => run(feed, 'json')} disabled={!!busy} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
              {busy === feed.key + 'json' ? 'Loading…' : 'Show first rows'}
            </button>
          </div>
          {shown[feed.key] && (
            <div className="mt-4">
              <p className="text-xs text-gray-500">{shown[feed.key].count} rows. {shown[feed.key].note}</p>
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-800">{JSON.stringify(shown[feed.key].rows.slice(0, 3), null, 2)}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
