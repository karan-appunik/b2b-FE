import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as customerGroupsApi from '../../api/customerGroups.api'
import * as priceListsApi from '../../api/priceLists.api'
import {
  PriceListsSection,
  PaymentMethodsSection,
  StockDisplaySection,
  OrderQuantityLimitsSection,
  OrderTotalLimitsSection,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_ORDER_LIMITS,
  DEFAULT_STOCK_DISPLAY,
} from './GroupSettingsFields'

export default function CustomerGroupCreatePage() {
  const navigate = useNavigate()
  const [priceLists, setPriceLists] = useState([])
  const [base, setBase] = useState(null)
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [shopifyTag, setShopifyTag] = useState('')

  const [overridePriceLists, setOverridePriceLists] = useState(false)
  const [priceListIds, setPriceListIds] = useState([])
  const [overridePayment, setOverridePayment] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS)
  const [overrideStockDisplay, setOverrideStockDisplay] = useState(false)
  const [stockDisplay, setStockDisplay] = useState(DEFAULT_STOCK_DISPLAY)
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
        handle: handle.trim(),
        shopifyTag: shopifyTag.trim(),
        priceLists: overridePriceLists ? priceListIds.filter(Boolean) : [],
        paymentMethods: overridePayment ? paymentMethods : null,
        stockDisplay: overrideStockDisplay ? stockDisplay : null,
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
        Customers with this Shopify tag will automatically get the assigned price lists. Anything
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Handle (or ID)</label>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="auto-generated from name if left blank"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Shopify tag</label>
            <input
              required
              value={shopifyTag}
              onChange={(e) => setShopifyTag(e.target.value)}
              placeholder="e.g. b2b-wholesale"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none sm:w-1/2"
            />
            <p className="mt-1 text-xs text-gray-400">
              Customers tagged with this exact Shopify tag will be matched into this group.
            </p>
          </div>
        </section>

        <PriceListsSection
          isBase={false}
          override={overridePriceLists}
          onOverrideChange={setOverridePriceLists}
          value={priceListIds}
          onChange={setPriceListIds}
          baseValue={(base?.priceLists || []).map((pl) => pl._id)}
          priceListOptions={priceLists}
        />

        <PaymentMethodsSection
          isBase={false}
          override={overridePayment}
          onOverrideChange={setOverridePayment}
          value={paymentMethods}
          onChange={setPaymentMethods}
          baseValue={base?.paymentMethods}
        />

        <OrderQuantityLimitsSection
          isBase={false}
          override={overrideOrderLimits}
          onOverrideChange={setOverrideOrderLimits}
          value={orderLimits.quantity}
          onChange={(quantity) => setOrderLimits({ ...orderLimits, quantity })}
          baseValue={base?.orderLimits?.quantity}
        />

        <OrderTotalLimitsSection
          isBase={false}
          override={overrideOrderLimits}
          onOverrideChange={setOverrideOrderLimits}
          value={orderLimits.total}
          onChange={(total) => setOrderLimits({ ...orderLimits, total })}
          baseValue={base?.orderLimits?.total}
        />

        <StockDisplaySection
          isBase={false}
          override={overrideStockDisplay}
          onOverrideChange={setOverrideStockDisplay}
          value={stockDisplay}
          onChange={setStockDisplay}
          baseValue={base?.stockDisplay}
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
