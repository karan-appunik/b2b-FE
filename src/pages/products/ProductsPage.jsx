import { useEffect, useRef, useState } from 'react'
import * as productsApi from '../../api/products.api'
import Modal from '../../components/Modal'
import CartDrawer from '../../components/CartDrawer'
import { parseProductsCsv } from '../../utils/csv'

const emptyForm = { name: '', sku: '', msrp: '' }

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [editing, setEditing] = useState(null) // null = closed, {} = create, {...} = edit
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [importError, setImportError] = useState('')
  const [cart, setCart] = useState([]) // [{ product, qty }]
  const [cartOpen, setCartOpen] = useState(false)
  const fileInputRef = useRef(null)

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product._id === product._id)
      if (existing) {
        return prev.map((i) => (i.product._id === product._id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { product, qty: 1 }]
    })
    setCartOpen(true)
  }

  function setCartQty(productId, qty) {
    setCart((prev) => prev.map((i) => (i.product._id === productId ? { ...i, qty } : i)))
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((i) => i.product._id !== productId))
  }

  function refresh() {
    productsApi.list().then(setProducts)
  }

  useEffect(refresh, [])

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setImportMessage('')
    setImportError('')
    try {
      const text = await file.text()
      const { rows, invalidCount } = parseProductsCsv(text)

      if (rows.length === 0) {
        setImportError('No valid rows found. Expect columns: sku, name, msrp.')
        return
      }

      const result = await productsApi.bulkImport(rows)
      const parts = [
        `Imported ${result.imported} products (${result.created} created, ${result.updated} updated).`,
      ]
      if (invalidCount > 0) parts.push(`${invalidCount} row(s) skipped — missing data or invalid MSRP.`)
      setImportMessage(parts.join(' '))
      refresh()
    } catch (err) {
      setImportError(err.response?.data?.message || 'Import failed')
    }
  }

  function openCreate() {
    setForm(emptyForm)
    setError('')
    setEditing({})
  }

  function openEdit(product) {
    setForm({ name: product.name, sku: product.sku, msrp: product.msrp })
    setError('')
    setEditing(product)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const payload = { ...form, msrp: Number(form.msrp) }
    try {
      if (editing?._id) {
        await productsApi.update(editing._id, payload)
      } else {
        await productsApi.create(payload)
      }
      setEditing(null)
      refresh()
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return
    await productsApi.remove(id)
    refresh()
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Import CSV
          </button>
          <button
            onClick={openCreate}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Add product
          </button>
          <button
            onClick={() => setCartOpen(true)}
            className="relative rounded-md border border-gray-300 p-2 text-gray-700 hover:bg-gray-50"
            aria-label="Open cart"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5.5 7.5h9l.6 9.2a1 1 0 0 1-1 1.1H5.9a1 1 0 0 1-1-1.1l.6-9.2Z" strokeLinejoin="round" />
              <path d="M7.25 7.5V6a2.75 2.75 0 0 1 5.5 0v1.5" strokeLinecap="round" />
            </svg>
            {cart.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-purple-600 px-1 text-[11px] font-semibold text-white">
                {cart.reduce((sum, i) => sum + i.qty, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImportFile}
        className="hidden"
      />

      {importMessage && <p className="mb-4 text-sm text-green-600">{importMessage}</p>}
      {importError && <p className="mb-4 text-sm text-red-600">{importError}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
       <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">MSRP</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p._id}>
                <td className="px-4 py-3 text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                <td className="px-4 py-3 text-gray-500">${p.msrp.toFixed(2)}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    onClick={() => addToCart(p)}
                    className="text-purple-600 hover:underline"
                  >
                    Add to cart
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="text-purple-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
       </div>
      </div>

      {editing !== null && (
        <Modal title={editing?._id ? 'Edit product' : 'Add product'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">SKU</label>
              <input
                required
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">MSRP</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.msrp}
                onChange={(e) => setForm({ ...form, msrp: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Save
            </button>
          </form>
        </Modal>
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onQtyChange={setCartQty}
        onRemove={removeFromCart}
        catalog={products}
        onAddBySku={addToCart}
      />
    </div>
  )
}
