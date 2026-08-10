import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as customersApi from '../../api/customers.api'
import Modal from '../../components/Modal'

const emptyForm = { name: '', email: '', company: '' }

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  function refresh() {
    customersApi.list().then(setCustomers)
  }

  useEffect(refresh, [])

  function openCreate() {
    setForm(emptyForm)
    setError('')
    setEditing({})
  }

  function openEdit(customer) {
    setForm({ name: customer.name, email: customer.email, company: customer.company || '' })
    setError('')
    setEditing(customer)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (editing?._id) {
        await customersApi.update(editing._id, form)
      } else {
        await customersApi.create(form)
      }
      setEditing(null)
      refresh()
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this customer?')) return
    await customersApi.remove(id)
    refresh()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <button
          onClick={openCreate}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Add customer
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Price List</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map((c) => (
              <tr key={c._id}>
                <td className="px-4 py-3 text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.email}</td>
                <td className="px-4 py-3 text-gray-500">{c.company || '—'}</td>
                <td className="px-4 py-3 text-gray-500">
                  {c.priceList ? (
                    <Link
                      to={`/price-lists/${c.priceList._id}`}
                      className="text-purple-600 hover:underline"
                    >
                      {c.priceList.name}
                    </Link>
                  ) : (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    onClick={() => openEdit(c)}
                    className="text-purple-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <Modal title={editing?._id ? 'Edit customer' : 'Add customer'} onClose={() => setEditing(null)}>
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Company</label>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
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
