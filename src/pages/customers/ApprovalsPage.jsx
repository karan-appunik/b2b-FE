import { useEffect, useState } from 'react'
import * as approvalsApi from '../../api/approvals.api'
import {
  REASON_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  TYPE_LABELS,
  formatDelta,
  formatMoney,
} from '../../utils/overrides'

const FILTERS = [
  { value: 'PENDING_APPROVAL', label: 'Waiting for approval' },
  { value: 'all', label: 'All requests' },
]

// The approval queue (spec §8.4): what was asked, against which baseline, why
// and by whom — with Approve / Reject. A rejection always needs a comment.
export default function ApprovalsPage() {
  const [filter, setFilter] = useState('PENDING_APPROVAL')
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [deciding, setDeciding] = useState(null)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function load() {
    return approvalsApi.list(filter).then((data) => {
      setItems(data.approvals)
      setLoaded(true)
    })
  }

  useEffect(() => {
    approvalsApi.list(filter).then((data) => {
      setItems(data.approvals)
      setLoaded(true)
    })
  }, [filter])

  function startDeciding(id, decision) {
    setDeciding({ id, decision })
    setComment('')
    setError('')
  }

  async function confirm() {
    setBusy(true)
    setError('')

    try {
      await approvalsApi.decide(deciding.id, deciding.decision, comment)
      setDeciding(null)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this decision.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Approvals</h1>
        <p className="mt-1 text-sm text-gray-500">
          Price, discount and other exceptions that sales agents have asked for.
        </p>
      </div>

      <div className="mb-4 flex gap-2">
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
        {items.map((a) => (
          <div key={a._id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">
                  {TYPE_LABELS[a.type] || a.type}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[a.status] || 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {STATUS_LABELS[a.status] || a.status}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {a.agentName || 'An agent'} for{' '}
                  <strong>{a.customerName || 'a customer'}</strong>
                  {a.customerCompany ? ` (${a.customerCompany})` : ''}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="text-gray-500">Baseline</div>
                <div className="font-medium text-gray-900">{formatMoney(a.baseline)}</div>
              </div>
              <div className="text-right text-sm">
                <div className="text-gray-500">Requested</div>
                <div className="font-medium text-gray-900">{formatMoney(a.proposed)}</div>
              </div>
              <div className="text-right text-sm">
                <div className="text-gray-500">Reduction</div>
                <div className="font-medium text-gray-900">{formatDelta(a.deltaPercent)}</div>
              </div>
            </div>

            {a.custom && (
              <p className="mt-3 text-sm text-gray-700">
                Custom line: <strong>{a.custom.title}</strong> × {a.custom.quantity} at {formatMoney(a.proposed)} each
                {a.custom.taxable === false ? ' · not taxed' : a.custom.taxCode ? ` · tax code ${a.custom.taxCode}` : ''}
                {a.custom.accountingCode ? ` · accounting code ${a.custom.accountingCode}` : ''}
              </p>
            )}
            {a.address && (
              <p className="mt-3 text-sm text-gray-700">
                Ship to: {[a.address.company, a.address.address1, a.address.address2, a.address.city, a.address.provinceCode, a.address.zip, a.address.countryCode].filter(Boolean).join(', ')}
                <span className="text-gray-500"> (this order only, not saved to the customer)</span>
              </p>
            )}
            {a.type === 'QUANTITY_RULE' && a.rule && (
              <p className="mt-3 text-sm text-gray-700">
                {a.rule === 'INCREMENT' ? 'Relaxes the pack size' : 'Relaxes the minimum quantity'}
              </p>
            )}
            {a.type === 'CREDIT_LIMIT' && (
              <p className="mt-3 text-sm text-gray-700">
                Credit left {formatMoney(a.baseline)}; order {formatMoney(a.proposed)}
                {a.deltaPercent != null ? ` (${a.deltaPercent}% over)` : ''}
              </p>
            )}

            <p className="mt-3 text-sm text-gray-700">
              <span className="font-medium">{REASON_LABELS[a.reasonCode] || a.reasonCode}:</span> {a.reasonText}
            </p>

            {(a.impact || a.history) && (
              <div className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                {a.impact && (
                  <div>
                    Price impact: gives up {formatMoney({ amount: a.impact.total, currency: a.impact.currency })}
                    {' '}(product cost isn&apos;t tracked, so this is not a margin)
                  </div>
                )}
                {a.history && (
                  <div>
                    Customer history: {a.history.orders} orders
                    {a.history.currency ? `, ${formatMoney({ amount: a.history.orderTotal, currency: a.history.currency })} spent` : ''}
                    {a.history.lastOrderAt ? `, last order ${new Date(a.history.lastOrderAt).toLocaleDateString()}` : ''}
                    . Exceptions in 90 days: {a.history.exceptions90d.total} ({a.history.exceptions90d.approved} approved,{' '}
                    {a.history.exceptions90d.rejected} refused)
                  </div>
                )}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Asked {new Date(a.createdAt).toLocaleString()}
              {a.expiresAt && a.status === 'PENDING_APPROVAL'
                ? ` · expires ${new Date(a.expiresAt).toLocaleString()}`
                : ''}
              {a.route?.policyName ? ` · rule: ${a.route.policyName}` : ''}
            </p>

            {a.decisions?.length > 0 && (
              <div className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                {a.decisions.map((d, i) => (
                  <div key={i}>
                    {d.decision === 'approve' ? 'Approved' : 'Rejected'} by {d.name}
                    {d.comment ? ` — “${d.comment}”` : ''}
                  </div>
                ))}
              </div>
            )}

            {a.status === 'PENDING_APPROVAL' && deciding?.id !== a._id && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => startDeciding(a._id, 'approve')}
                  className="rounded-md bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => startDeciding(a._id, 'reject')}
                  className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Reject
                </button>
              </div>
            )}

            {deciding?.id === a._id && (
              <div className="mt-3 space-y-2">
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
          </div>
        ))}

        {loaded && items.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            {filter === 'PENDING_APPROVAL' ? 'Nothing is waiting for approval.' : 'No requests yet.'}
          </div>
        )}
      </div>
    </div>
  )
}
