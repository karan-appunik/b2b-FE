import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as customerGroupsApi from '../../api/customerGroups.api'
import * as priceListsApi from '../../api/priceLists.api'
import {
  PaymentMethodsSection,
  OrderLimitsSection,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_ORDER_LIMITS,
} from './GroupSettingsFields'

export default function CustomerGroupCreatePage() {
  const navigate = useNavigate()
  const [priceLists, setPriceLists] = useState([])
  const [base, setBase] = useState(null)
  const [name, setName] = useState('')
  const [shopifyTag, setShopifyTag] = useState('')
  const [priceListId, setPriceListId] = useState('')

  const [overridePayment, setOverridePayment] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS)
  const [overrideOrderLimits, setOverrideOrderLimits] = useState(false)
  const [orderLimits, setOrderLimits] = useState(DEFAULT_ORDER_LIMITS)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    priceListsApi.list().then(setPriceLists)
    customerGroupsApi.list().then((groups) => setBase(groups.find((g) => g.isBase) || null))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !shopifyTag.trim()) {
      setError('Name and Shopify tag are required.')
      return
    }

    setSaving(true)
    try {
      await customerGroupsApi.create({
        name: name.trim(),
        shopifyTag: shopifyTag.trim(),
        priceList: priceListId || null,
        paymentMethods: overridePayment ? paymentMethods : null,
        orderLimits: overrideOrderLimits ? orderLimits : null,
      })
      navigate('/customers/groups')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create customer group')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/customers/groups" className="text-sm text-purple-600 hover:underline">
        ← Customer Groups
      </Link>
      <h1 className="mt-1 text-2xl font-semibold text-gray-900">Create customer group</h1>
      <p className="mt-1 text-sm text-gray-500">
        Customers with this Shopify tag will automatically get the assigned price list. Anything
        you don't override here inherits from the base customer group.
      </p>

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
                placeholder="e.g. Wholesale customers"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Shopify tag</label>
              <input
                required
                value={shopifyTag}
                onChange={(e) => setShopifyTag(e.target.value)}
                placeholder="e.g. b2b-wholesale"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Customers tagged with this exact Shopify tag will be matched into this group.
          </p>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Assigned price list</label>
            <select
              value={priceListId}
              onChange={(e) => setPriceListId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none sm:w-1/2"
            >
              <option value="">
                {base?.priceList ? `Inherit from base (${base.priceList.name})` : 'Select a price list'}
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
          isBase={false}
          override={overridePayment}
          onOverrideChange={setOverridePayment}
          value={paymentMethods}
          onChange={setPaymentMethods}
          baseValue={base?.paymentMethods}
        />

        <OrderLimitsSection
          isBase={false}
          override={overrideOrderLimits}
          onOverrideChange={setOverrideOrderLimits}
          value={orderLimits}
          onChange={setOrderLimits}
          baseValue={base?.orderLimits}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

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
            {saving ? 'Creating…' : 'Create customer group'}
          </button>
        </div>
      </form>
    </div>
  )
}
