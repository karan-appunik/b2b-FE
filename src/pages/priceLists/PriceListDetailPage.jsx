import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as priceListsApi from '../../api/priceLists.api'
import * as productsApi from '../../api/products.api'
import * as customersApi from '../../api/customers.api'

export default function PriceListDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [priceList, setPriceList] = useState(null)
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [priceMap, setPriceMap] = useState({})
  const [selectedCustomerIds, setSelectedCustomerIds] = useState(new Set())
  const [meta, setMeta] = useState({ name: '', description: '', status: 'draft' })
  const [savingItems, setSavingItems] = useState(false)
  const [savingCustomers, setSavingCustomers] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)
  const [message, setMessage] = useState('')

  function loadAll() {
    Promise.all([priceListsApi.get(id), productsApi.list(), customersApi.list()]).then(
      ([pl, allProducts, allCustomers]) => {
        setPriceList(pl)
        setProducts(allProducts)
        setCustomers(allCustomers)
        setMeta({ name: pl.name, description: pl.description || '', status: pl.status })

        const seededPrices = {}
        pl.items.forEach((item) => {
          seededPrices[item.product._id] = String(item.price)
        })
        setPriceMap(seededPrices)

        setSelectedCustomerIds(new Set(pl.customers.map((c) => c._id)))
      },
    )
  }

  useEffect(loadAll, [id])

  async function handleSaveMeta(e) {
    e.preventDefault()
    setSavingMeta(true)
    setMessage('')
    try {
      await priceListsApi.update(id, meta)
      setMessage('Details saved.')
      loadAll()
    } finally {
      setSavingMeta(false)
    }
  }

  async function handleSaveItems() {
    setSavingItems(true)
    setMessage('')
    try {
      const items = Object.entries(priceMap)
        .filter(([, v]) => v !== '')
        .map(([product, price]) => ({ product, price: Number(price) }))
      await priceListsApi.saveItems(id, items)
      setMessage('Prices saved.')
      loadAll()
    } finally {
      setSavingItems(false)
    }
  }

  function toggleCustomer(customerId) {
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev)
      if (next.has(customerId)) {
        next.delete(customerId)
      } else {
        next.add(customerId)
      }
      return next
    })
  }

  async function handleSaveCustomers() {
    setSavingCustomers(true)
    setMessage('')
    try {
      await priceListsApi.assignCustomers(id, [...selectedCustomerIds])
      setMessage('Customer assignment saved.')
      loadAll()
    } finally {
      setSavingCustomers(false)
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/price-lists" className="text-sm text-purple-600 hover:underline">
            ← Price Lists
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">{priceList.name}</h1>
        </div>
        <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">
          Delete price list
        </button>
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}

      {/* Details */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Details</h2>
        <form onSubmit={handleSaveMeta} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <input
              value={meta.description}
              onChange={(e) => setMeta({ ...meta, description: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={meta.status}
              onChange={(e) => setMeta({ ...meta, status: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={savingMeta}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {savingMeta ? 'Saving…' : 'Save details'}
            </button>
          </div>
        </form>
      </section>

      {/* Manual Price Editor */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Manual Price Editor</h2>
          <button
            onClick={handleSaveItems}
            disabled={savingItems}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {savingItems ? 'Saving…' : 'Save prices'}
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Leave a price blank to exclude that product from this price list.
        </p>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium">MSRP</th>
                <th className="px-4 py-2 font-medium">Wholesale price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p._id}>
                  <td className="px-4 py-2 text-gray-900">{p.name}</td>
                  <td className="px-4 py-2 text-gray-500">{p.sku}</td>
                  <td className="px-4 py-2 text-gray-500">${p.msrp.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="—"
                      value={priceMap[p._id] ?? ''}
                      onChange={(e) =>
                        setPriceMap({ ...priceMap, [p._id]: e.target.value })
                      }
                      className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    No products yet — add products first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Customer assignment */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Customer-specific Wholesale Pricing</h2>
          <button
            onClick={handleSaveCustomers}
            disabled={savingCustomers}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {savingCustomers ? 'Saving…' : 'Save assignment'}
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Select which customers should see this price list's prices.
        </p>
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {customers.map((c) => {
            const isOnOtherList = c.priceList && c.priceList._id !== id
            return (
              <label key={c._id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCustomerIds.has(c._id)}
                    onChange={() => toggleCustomer(c._id)}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-900">{c.name}</span>
                  <span className="text-gray-400">{c.email}</span>
                </span>
                {isOnOtherList && (
                  <span className="text-xs text-amber-600">
                    currently on: {c.priceList.name}
                  </span>
                )}
              </label>
            )
          })}
          {customers.length === 0 && (
            <p className="px-4 py-6 text-center text-gray-400">
              No customers yet — add customers first.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
