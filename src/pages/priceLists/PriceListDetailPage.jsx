import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as priceListsApi from '../../api/priceLists.api'

export default function PriceListDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [priceList, setPriceList] = useState(null)
  const [meta, setMeta] = useState({
    name: '',
    description: '',
    status: 'draft',
    pricingType: 'manual',
    automaticPricing: { discountType: 'percentage', discountValue: 0 },
  })
  const [savingAll, setSavingAll] = useState(false)
  const [message, setMessage] = useState('')

  function loadAll() {
    priceListsApi.get(id).then((pl) => {
      setPriceList(pl)
      setMeta({
        name: pl.name,
        description: pl.description || '',
        status: pl.status,
        pricingType: pl.pricingType || 'manual',
        automaticPricing: pl.automaticPricing || { discountType: 'percentage', discountValue: 0 },
      })
    })
  }

  useEffect(loadAll, [id])

  async function handleUpdate(e) {
    e.preventDefault()
    setSavingAll(true)
    setMessage('')
    try {
      await priceListsApi.update(id, meta)
      setMessage('Price list updated.')
      loadAll()
    } finally {
      setSavingAll(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this price list? Assigned customers will be unassigned.')) return
    await priceListsApi.remove(id)
    navigate('/price-lists')
  }

  if (!priceList) {
    return <p className="text-gray-500">Loading…</p>
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/price-lists" className="text-sm text-purple-600 hover:underline">
            ← Price Lists
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">{priceList.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Choose how you want your pricing to work with automatic and manual pricing.
          </p>
        </div>
        <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">
          Delete price list
        </button>
      </div>

      {priceList.pricingType === 'manual' && priceList.shopifyPushedAt && (
        <p className="mt-4 text-xs text-gray-500">
          Last synced to Shopify: {new Date(priceList.shopifyPushedAt).toLocaleString()}
        </p>
      )}
      {priceList.shopifyPushError && (
        <p className="mt-2 text-sm text-red-600">Last Shopify sync failed: {priceList.shopifyPushError}</p>
      )}

      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}

      <form onSubmit={handleUpdate} className="mt-6 space-y-6">
        {/* Details */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input
                required
                value={meta.name}
                onChange={(e) => setMeta({ ...meta, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Handle (or ID)</label>
              <input
                disabled
                value={priceList.handle}
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
            <input
              disabled
              value={priceList.currency}
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 sm:w-1/2"
            />
          </div>
          <p className="mt-3 text-xs text-gray-400">
            The price list handle and currency cannot be changed once a price list has been created.
          </p>
        </section>

        {/* Automatic pricing */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Automatic pricing</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">
            Use another pricing source and apply a discount.
          </p>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={meta.pricingType === 'automatic'}
              onChange={(e) =>
                setMeta({ ...meta, pricingType: e.target.checked ? 'automatic' : 'manual' })
              }
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            Enable automatic pricing
          </label>

          {meta.pricingType === 'automatic' && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Discount type</label>
                <select
                  value={meta.automaticPricing.discountType}
                  onChange={(e) =>
                    setMeta({
                      ...meta,
                      automaticPricing: { ...meta.automaticPricing, discountType: e.target.value },
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value="percentage">Percentage off</option>
                  <option value="fixed">Fixed amount off</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Discount value</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={meta.automaticPricing.discountValue}
                  onChange={(e) =>
                    setMeta({
                      ...meta,
                      automaticPricing: {
                        ...meta.automaticPricing,
                        discountValue: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </section>

        {/* Manual pricing */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Manual pricing</h2>
          <p className="mb-4 mt-1 text-sm text-gray-500">
            Set specific prices for each product by uploading a CSV file.
          </p>
          <div className="flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10A8 8 0 112 10a8 8 0 0116 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9zm1-4a1 1 0 100 2 1 1 0 000-2z"
                clipRule="evenodd"
              />
            </svg>
            Manual pricing is managed by uploading a CSV file on the price lists page.
          </div>
        </section>

        {/* Customer assignment */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Customers</h2>
          <p className="mb-4 mt-1 text-sm text-gray-500">
            Customers are assigned to this price list through Customer Groups, based on their
            Shopify tag.
          </p>
          <Link
            to="/customers/groups"
            className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:underline"
          >
            Manage customer groups →
          </Link>
        </section>

        <div className="flex justify-end gap-3">
          <Link
            to="/price-lists"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={savingAll}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {savingAll ? 'Updating…' : 'Update price list'}
          </button>
        </div>
      </form>
    </div>
  )
}
