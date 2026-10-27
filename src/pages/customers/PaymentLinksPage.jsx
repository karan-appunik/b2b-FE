import { useEffect, useState } from 'react'
import * as linksApi from '../../api/paymentLinks.api'
import { formatMoney } from '../../utils/overrides'

const STATUS_LABELS = {
  ACTIVE: 'Waiting for payment',
  PAID: 'Paid',
  EXPIRED: 'Expired',
  REVOKED: 'Withdrawn',
  REPLACED: 'Replaced',
}

const STATUS_STYLES = {
  ACTIVE: 'bg-sky-50 text-sky-700',
  PAID: 'bg-green-50 text-green-700',
  REVOKED: 'bg-gray-100 text-gray-600',
  EXPIRED: 'bg-gray-100 text-gray-600',
}

const ACTIVITY_LABELS = {
  created: 'Link created and emailed',
  replaced: 'Replaced by a newer link',
  revoked: 'Withdrawn',
  expired: 'Expired',
  paid: 'Paid',
}

const when = (value) => (value ? new Date(value).toLocaleString() : '—')

// Secure payment links agents have sent (spec §9.4). The card is only ever
// entered by the customer on the hosted page; here the merchant can see where
// each link stands, and withdraw one that is still open.
export default function PaymentLinksPage() {
  const [links, setLinks] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(null)
  const [error, setError] = useState('')

  function load() {
    return linksApi.list().then((data) => {
      setLinks(data.links)
      setLoaded(true)
    })
  }

  useEffect(() => {
    linksApi.list().then((data) => {
      setLinks(data.links)
      setLoaded(true)
    })
  }, [])

  async function revoke(id) {
    if (!window.confirm('Withdraw this payment link? The customer will no longer be able to use it.')) return
    setError('')

    try {
      await linksApi.revoke(id)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not withdraw this link.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Payment links</h1>
        <p className="mt-1 text-sm text-gray-500">
          Secure links your sales agents sent to customers. Customers pay on the hosted checkout page; agents never see card details.
        </p>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {links.map((l) => (
          <div key={l.id} className="rounded-xl border border-gray-200 bg-white">
            <div className="flex w-full flex-wrap items-center justify-between gap-3 p-4">
            <button
              onClick={() => setOpen(open === l.id ? null : l.id)}
              aria-expanded={open === l.id}
              className="min-w-0 flex-1 text-left"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">
                  {formatMoney({ amount: l.amount, currency: l.currency })}
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[l.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[l.status] || l.status}
                  </span>
                  {l.reconcileFlag && (
                    <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      Amount differs — review
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {l.customerName || 'Customer'} · sent by {l.agentName || 'agent'} · {when(l.createdAt)}
                </div>
              </div>
            </button>
              {l.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => revoke(l.id)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Withdraw
                </button>
              )}
            </div>

            {open === l.id && (
              <div className="border-t border-gray-100 p-4 text-sm text-gray-700">
                <div className="mb-3 grid gap-1 sm:grid-cols-2">
                  <div>Emailed to: {l.sentTo || '—'}</div>
                  <div>Expires: {when(l.expiresAt)}</div>
                  <div>First opened: {when(l.openedAt)}</div>
                  {l.status === 'PAID' && <div>Paid: {when(l.paidAt)}</div>}
                </div>
                <ul className="space-y-1 text-xs text-gray-600">
                  {(l.activity || []).map((a, i) => (
                    <li key={i}>
                      {when(a.at)} — {ACTIVITY_LABELS[a.type] || a.type}
                      {a.comment ? ` (${a.comment})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {loaded && !links.length && (
          <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            No payment links yet.
          </p>
        )}
      </div>
    </div>
  )
}
