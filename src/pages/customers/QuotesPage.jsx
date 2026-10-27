import { useEffect, useState } from 'react'
import * as quotesApi from '../../api/quotes.api'
import { formatMoney } from '../../utils/overrides'

const STATUS_LABELS = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Waiting for approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SENT: 'Sent to customer',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  CHANGES_REQUESTED: 'Changes requested',
  EXPIRED: 'Expired',
  WITHDRAWN: 'Withdrawn',
  CONVERTED: 'Turned into an order',
}

const STATUS_STYLES = {
  PENDING_APPROVAL: 'bg-amber-50 text-amber-800',
  APPROVED: 'bg-green-50 text-green-700',
  SENT: 'bg-sky-50 text-sky-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  CONVERTED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  DECLINED: 'bg-red-50 text-red-700',
  CHANGES_REQUESTED: 'bg-amber-50 text-amber-800',
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'PENDING_APPROVAL', label: 'Waiting for approval' },
  { value: 'SENT', label: 'Sent' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'CONVERTED', label: 'Ordered' },
]

const ACTIVITY_LABELS = {
  created: 'Created',
  edited: 'Edited',
  revised: 'New version',
  submitted: 'Sent for approval',
  approved: 'Approved',
  rejected: 'Rejected',
  sent: 'Sent to the customer',
  accepted: 'Accepted by the customer',
  declined: 'Declined by the customer',
  changes_requested: 'Customer asked for changes',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
  converted: 'Turned into an order',
}

// Every quote, who owns it and where it stands (spec §4.7): versions, the
// quoted lines, the timeline — and Approve / Reject for quotes that are large
// enough to need a manager's approval.
export default function QuotesPage() {
  const [filter, setFilter] = useState('all')
  const [quotes, setQuotes] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(null)
  const [detail, setDetail] = useState(null)
  const [deciding, setDeciding] = useState(null)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function load() {
    return quotesApi.list(filter).then((data) => {
      setQuotes(data.quotes)
      setLoaded(true)
    })
  }

  useEffect(() => {
    quotesApi.list(filter).then((data) => {
      setQuotes(data.quotes)
      setLoaded(true)
    })
  }, [filter])

  async function toggle(id) {
    if (open === id) {
      setOpen(null)
      return
    }
    setOpen(id)
    setDetail(null)
    setDetail(await quotesApi.get(id))
  }

  async function confirm() {
    setBusy(true)
    setError('')

    try {
      await quotesApi.decide(deciding.id, deciding.decision, comment)
      setDeciding(null)
      await load()
      if (open) setDetail(await quotesApi.get(open))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this decision.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Quotes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quotes your sales agents have made for customers. Large quotes wait here for approval before they can be sent.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === f.value ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {quotes.map((q) => (
          <div key={q.id} className="rounded-xl border border-gray-200 bg-white">
            <button onClick={() => toggle(q.id)} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">
                  {q.number}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[q.status] || 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {STATUS_LABELS[q.status] || q.status}
                  </span>
                  {q.currentVersion > 1 && <span className="ml-2 text-xs text-gray-400">version {q.currentVersion}</span>}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {q.ownerName || 'An agent'} for <strong>{q.customerName || 'a customer'}</strong>
                  {q.customerCompany ? ` (${q.customerCompany})` : ''}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="font-medium text-gray-900">
                  {q.totals ? formatMoney({ amount: q.totals.subtotal, currency: q.currency }) : '—'}
                </div>
                <div className="text-xs text-gray-400">
                  {q.status === 'SENT' && q.expiresAt ? `open until ${new Date(q.expiresAt).toLocaleDateString()}` : new Date(q.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </button>

            {open === q.id && (
              <div className="border-t border-gray-100 p-4">
                {!detail && <p className="text-sm text-gray-400">Loading…</p>}

                {detail && (
                  <>
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-gray-400">
                        <tr>
                          <th className="py-1 font-medium">Item</th>
                          <th className="py-1 font-medium">Qty</th>
                          <th className="py-1 font-medium">Baseline</th>
                          <th className="py-1 font-medium">Quoted</th>
                          <th className="py-1 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detail.items.map((i) => (
                          <tr key={i.variantId}>
                            <td className="py-2">
                              <span className="block text-gray-900">{i.title || i.variantId}</span>
                              <span className="block text-xs text-gray-400">{i.sku}</span>
                            </td>
                            <td className="py-2">{i.quantity}</td>
                            <td className="py-2 text-gray-500">{formatMoney({ amount: i.baselineUnit, currency: detail.currency })}</td>
                            <td className="py-2">{formatMoney({ amount: i.unitPrice, currency: detail.currency })}</td>
                            <td className="py-2 text-right">{formatMoney({ amount: i.lineTotal, currency: detail.currency })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-2 flex justify-end gap-6 text-sm">
                      <span className="text-gray-500">
                        Saves {formatMoney({ amount: detail.totals.savings, currency: detail.currency })}
                      </span>
                      <span className="font-semibold text-gray-900">
                        Total {formatMoney({ amount: detail.totals.subtotal, currency: detail.currency })}
                      </span>
                    </div>

                    {(detail.terms.notes || detail.terms.internalNotes) && (
                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                        {detail.terms.notes && (
                          <p>
                            <span className="font-medium text-gray-700">Note to the customer:</span> {detail.terms.notes}
                          </p>
                        )}
                        {detail.terms.internalNotes && (
                          <p>
                            <span className="font-medium text-gray-700">Internal note:</span> {detail.terms.internalNotes}
                          </p>
                        )}
                      </div>
                    )}

                    <h3 className="mb-1 mt-4 text-sm font-semibold text-gray-900">Timeline</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {detail.activity.map((a, i) => (
                        <li key={i}>
                          <span className="text-gray-400">{new Date(a.at).toLocaleString()}</span> ·{' '}
                          {ACTIVITY_LABELS[a.type] || a.type}
                          {a.by ? ` by ${a.by}` : ''}
                          {a.version ? ` (v${a.version})` : ''}
                          {a.comment ? ` — “${a.comment}”` : ''}
                        </li>
                      ))}
                    </ul>

                    {detail.status === 'PENDING_APPROVAL' && deciding?.id !== q.id && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            setDeciding({ id: q.id, decision: 'approve' })
                            setComment('')
                          }}
                          className="rounded-md bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setDeciding({ id: q.id, decision: 'reject' })
                            setComment('')
                          }}
                          className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {deciding?.id === q.id && (
                      <div className="mt-4 space-y-2">
                        <label className="block text-sm">
                          <span className="mb-1 block font-medium text-gray-700">
                            {deciding.decision === 'reject' ? 'Why are you rejecting this? (required)' : 'Comment (optional)'}
                          </span>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                          />
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={confirm}
                            disabled={busy}
                            className="rounded-md bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                          >
                            {busy ? 'Saving…' : deciding.decision === 'reject' ? 'Confirm rejection' : 'Confirm approval'}
                          </button>
                          <button
                            onClick={() => setDeciding(null)}
                            className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {loaded && quotes.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            No quotes here yet.
          </div>
        )}
      </div>
    </div>
  )
}
