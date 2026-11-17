import { useEffect, useState } from 'react'
import * as api from '../../api/provisionalCustomers.api'

// Customers a sales agent created at a trade event (spec §3.4). They stay
// provisional until approved here; depending on the settings, ordering for
// them can be held until then.
export default function NewCustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  function load() {
    return api.list().then((data) => {
      setCustomers(data.customers)
      setLoaded(true)
    })
  }

  useEffect(() => {
    api.list().then((data) => {
      setCustomers(data.customers)
      setLoaded(true)
    })
  }, [])

  async function approve(id) {
    setError('')
    try {
      const result = await api.approve(id)
      await load()
      if (result.tagRemoved === false) {
        setError('Approved, but the provisional tag could not be removed in Shopify. Remove it there to move this customer to their final group.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not approve this customer.')
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">New customers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Accounts created by sales agents that are waiting for your approval. They carry the provisional tag set in Approval policies,
          so the group for new accounts applies. Approving removes that tag in Shopify and moves them to their final group.
        </p>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {customers.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-gray-300">
            <div className="min-w-0 space-y-2 text-sm">
              <div className="font-semibold text-gray-900">{c.company || c.name}</div>
              <div className="text-sm leading-relaxed text-gray-600">
                {c.name} · {c.email}
                {c.phone ? ` · ${c.phone}` : ''}
                {c.taxId ? ` · Tax ID ${c.taxId}` : ''}
              </div>
              <div className="text-xs leading-relaxed text-gray-500">
                Created by {c.createdBy || 'an agent'} · {new Date(c.createdAt).toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => approve(c.id)}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Approve
            </button>
          </div>
        ))}

        {loaded && !customers.length && (
          <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            No customers are waiting for approval.
          </p>
        )}
      </div>
    </div>
  )
}
