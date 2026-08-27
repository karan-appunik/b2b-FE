import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as customerGroupsApi from '../../api/customerGroups.api'
import * as priceListsApi from '../../api/priceLists.api'
import {
  PaymentMethodsSection,
  OrderLimitsSection,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_ORDER_LIMITS,
} from './GroupSettingsFields'

function MoreActionsMenu({ onViewCustomers, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        More actions
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => {
              setOpen(false)
              onViewCustomers()
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a5 5 0 100-10 5 5 0 000 10z" />
              <path
                fillRule="evenodd"
                d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            View tagged customers
          </button>
          <button
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482 41.03 41.03 0 00-2.365-.298V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                clipRule="evenodd"
              />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function CustomerGroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [group, setGroup] = useState(null)
  const [priceLists, setPriceLists] = useState([])
  const [name, setName] = useState('')
  const [shopifyTag, setShopifyTag] = useState('')
  const [priceListId, setPriceListId] = useState('')

  const [overridePayment, setOverridePayment] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS)
  const [overrideOrderLimits, setOverrideOrderLimits] = useState(false)
  const [orderLimits, setOrderLimits] = useState(DEFAULT_ORDER_LIMITS)

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function loadAll() {
    Promise.all([customerGroupsApi.get(id), priceListsApi.list()]).then(([g, pls]) => {
      setGroup(g)
      setPriceLists(pls)
      setName(g.name)
      setShopifyTag(g.shopifyTag || '')
      setPriceListId(g.priceList?._id || '')

      setOverridePayment(!!g.paymentMethods)
      setPaymentMethods(g.paymentMethods || g.effectivePaymentMethods || DEFAULT_PAYMENT_METHODS)
      setOverrideOrderLimits(!!g.orderLimits)
      setOrderLimits(g.orderLimits || g.effectiveOrderLimits || DEFAULT_ORDER_LIMITS)
    })
  }

  useEffect(loadAll, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      const result = await customerGroupsApi.update(id, {
        name: name.trim(),
        shopifyTag: shopifyTag.trim(),
        priceList: priceListId || null,
        paymentMethods: group.isBase || overridePayment ? paymentMethods : null,
        orderLimits: group.isBase || overrideOrderLimits ? orderLimits : null,
      })
      setMessage(`Updated. ${result.matchedCustomers} matching customer(s) assigned this price list.`)
      loadAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update customer group')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this customer group? Customers already assigned keep their current price list.'))
      return
    await customerGroupsApi.remove(id)
    navigate('/customers/groups')
  }

  if (!group) {
    return <p className="text-gray-500">Loading…</p>
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/customers/groups"
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">{group.name}</h1>
        </div>
        {!group.isBase && (
          <MoreActionsMenu
            onViewCustomers={() =>
              document.getElementById('group-customers')?.scrollIntoView({ behavior: 'smooth' })
            }
            onDelete={handleDelete}
          />
        )}
      </div>

      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Customer group</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            {!group.isBase && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Shopify tag</label>
                <input
                  required
                  value={shopifyTag}
                  onChange={(e) => setShopifyTag(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {group.isBase ? 'Default price list' : 'Assigned price list'}
            </label>
            <select
              value={priceListId}
              onChange={(e) => setPriceListId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none sm:w-1/2"
            >
              <option value="">
                {!group.isBase && group.effectivePriceList
                  ? `Inherit from base (${group.effectivePriceList.name || ''})`
                  : 'Select a price list'}
              </option>
              {priceLists.map((pl) => (
                <option key={pl._id} value={pl._id}>
                  {pl.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <PaymentMethodsSection
          isBase={group.isBase}
          override={overridePayment}
          onOverrideChange={setOverridePayment}
          value={paymentMethods}
          onChange={setPaymentMethods}
          baseValue={group.effectivePaymentMethods}
        />

        <OrderLimitsSection
          isBase={group.isBase}
          override={overrideOrderLimits}
          onOverrideChange={setOverrideOrderLimits}
          value={orderLimits}
          onChange={setOrderLimits}
          baseValue={group.effectiveOrderLimits}
        />

        <section id="group-customers" className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Customers in this group ({group.customers.length})
          </h2>
          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {group.customers.map((c) => (
              <div key={c._id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-gray-900">{c.name}</span>
                <span className="text-gray-400">{c.email}</span>
              </div>
            ))}
            {group.customers.length === 0 && (
              <p className="px-4 py-6 text-center text-gray-400">
                {group.isBase
                  ? 'No customers yet.'
                  : `No customers currently have the "${group.shopifyTag}" tag.`}
              </p>
            )}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link
            to="/customers/groups"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Updating…' : 'Update customer group'}
          </button>
        </div>
      </form>
    </div>
  )
}
