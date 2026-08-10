import { useEffect, useState } from 'react'
import * as productsApi from '../../api/products.api'
import Modal from '../../components/Modal'

const emptyForm = { name: '', sku: '', msrp: '' }

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [editing, setEditing] = useState(null) // null = closed, {} = create, {...} = edit
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  function refresh() {
    productsApi.list().then(setProducts)
  }

  useEffect(refresh, [])

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <button
          onClick={openCreate}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Add product
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
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
    </div>
  )
}
