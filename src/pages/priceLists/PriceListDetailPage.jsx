import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as priceListsApi from '../../api/priceLists.api'
import { stringifyCsv } from '../../utils/csv'

const CURRENCY_NAMES = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  NZD: 'New Zealand Dollar',
  INR: 'Indian Rupee',
  JPY: 'Japanese Yen',
  CHF: 'Swiss Franc',
}

function formatCurrency(code) {
  if (!code) return ''
  const name = CURRENCY_NAMES[code]
  return name ? `${code} - ${name}` : code
}

function ChevronLeftIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-gray-900" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9 13.5 3 3m0 0 3-3m-3 3v-6m1.06-4.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
      />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  )
}

function MoreActionsMenu({ onDownload, onClear, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function runAction(action) {
    setOpen(false)
    action()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => runAction(onDownload)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <DownloadIcon />
            Download CSV
          </button>
          <button
            onClick={() => runAction(onClear)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <ClearIcon />
            Clear
          </button>
          <button
            onClick={() => runAction(onDelete)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
          >
            <TrashIcon />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

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

  function handleDownload() {
    const rows = priceList.items.map((item) => [item.product.sku, item.price])
    const csv = stringifyCsv([['sku', 'price'], ...rows])
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${priceList.handle || priceList.name}-prices.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleClear() {
    if (!confirm(`Clear all prices from "${priceList.name}"? This removes every product from the list.`))
      return
    await priceListsApi.saveItems(id, [])
    setMessage(`Cleared all prices from "${priceList.name}".`)
    loadAll()
  }

  if (!priceList) {
    return <p className="text-gray-500">Loading…</p>
  }

  return (
    <div className="mx-auto max-w-[672px]">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to="/price-lists"
            className="inline-flex items-center gap-1 text-2xl font-semibold uppercase text-gray-900"
          >
            <ChevronLeftIcon />
            {priceList.name}
          </Link>
          <MoreActionsMenu onDownload={handleDownload} onClear={handleClear} onDelete={handleDelete} />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Choose how you want your pricing to work with automatic and manual pricing.
        </p>
      </div>

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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Handle (or ID)</label>
                <span className="text-xs text-gray-400">{priceList.handle.length}/64</span>
              </div>
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
              value={formatCurrency(priceList.currency)}
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
