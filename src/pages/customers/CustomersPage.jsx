import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as customersApi from '../../api/customers.api'
import * as customerGroupsApi from '../../api/customerGroups.api'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [groups, setGroups] = useState([])
  const [search, setSearch] = useState('')

  function refresh() {
    customersApi.list().then(setCustomers)
    customerGroupsApi.list().then(setGroups)
  }

  useEffect(refresh, [])

  function groupNameFor(customer) {
    const matched = groups.find((g) => !g.isBase && customer.tags?.includes(g.shopifyTag))
    return matched?.name || groups.find((g) => g.isBase)?.name || 'Base'
  }

  const ROLE_LABELS = {
    customer: 'Standard',
    sales_agent: 'Sales agent',
    sales_admin: 'Sales admin',
    external_sales_rep: 'External sales rep',
  }

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q),
    )
  }, [customers, search])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <p className="mt-1 text-sm text-gray-500">
          List of all customers synced from your Shopify store.
        </p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none sm:w-72"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Group</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCustomers.map((c) => (
              <tr key={c._id}>
                <td className="px-4 py-3 text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    {ROLE_LABELS[c.role] || 'Standard'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    {groupNameFor(c)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/customers/${c._id}`}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  {customers.length === 0
                    ? 'No customers synced yet — install the app on your store or wait for the next sync.'
                    : 'No customers match your search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
