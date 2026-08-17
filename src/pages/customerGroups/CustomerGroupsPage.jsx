import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as customerGroupsApi from '../../api/customerGroups.api'

function PaymentMethodChips({ methods }) {
  const active = [
    methods?.invoice && 'Invoice',
    methods?.onAccount && 'On account',
    methods?.cardAtCheckout && 'Card',
  ].filter(Boolean)

  if (active.length === 0) return <span className="text-gray-400">None</span>

  return (
    <div className="flex flex-wrap gap-1">
      {active.map((m) => (
        <span
          key={m}
          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
        >
          {m}
        </span>
      ))}
    </div>
  )
}

export default function CustomerGroupsPage() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])

  function refresh() {
    customerGroupsApi.list().then(setGroups)
  }

  useEffect(refresh, [])

  async function handleDelete(id) {
    if (!confirm('Delete this customer group? Customers already assigned keep their current price list.'))
      return
    await customerGroupsApi.remove(id)
    refresh()
  }

  const base = groups.find((g) => g.isBase)
  const others = groups.filter((g) => !g.isBase)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customer Groups</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up specific ordering rules for your B2B customers.
          </p>
        </div>
        <Link
          to="/customers/groups/create"
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Create customer group
        </Link>
      </div>

      {base && (
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Base customer group</h2>
              <p className="mt-1 text-sm text-gray-500">
                These settings apply to every B2B customer. All other groups inherit these
                settings unless they specifically override them.
              </p>
            </div>
            <button
              onClick={() => navigate(`/customers/groups/${base._id}`)}
              className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="mb-2 text-xs font-medium uppercase text-gray-400">Price list</p>
              {base.priceList ? (
                <Link
                  to={`/price-lists/${base.priceList._id}`}
                  className="text-sm text-purple-600 hover:underline"
                >
                  {base.priceList.name}
                </Link>
              ) : (
                <span className="text-sm text-gray-400">None</span>
              )}
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="mb-2 text-xs font-medium uppercase text-gray-400">Payment methods</p>
              <PaymentMethodChips methods={base.paymentMethods} />
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="mb-2 text-xs font-medium uppercase text-gray-400">Order limits</p>
              {base.orderLimits?.valueBased?.enabled || base.orderLimits?.unitBased?.enabled ? (
                <div className="space-y-1 text-sm text-gray-700">
                  {base.orderLimits.valueBased.enabled && (
                    <p>Min value: ${base.orderLimits.valueBased.minValue}</p>
                  )}
                  {base.orderLimits.unitBased.enabled && (
                    <p>Min units: {base.orderLimits.unitBased.minUnits}</p>
                  )}
                </div>
              ) : (
                <span className="text-sm text-gray-400">None</span>
              )}
            </div>
          </div>
        </section>
      )}

      <h2 className="mb-3 text-sm font-semibold text-gray-500">Additional customer groups</h2>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Shopify tag</th>
              <th className="px-4 py-3 font-medium">Price list</th>
              <th className="px-4 py-3 font-medium">Customers</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {others.map((g) => (
              <tr key={g._id}>
                <td className="px-4 py-3">
                  <Link
                    to={`/customers/groups/${g._id}`}
                    className="font-medium text-purple-600 hover:underline"
                  >
                    {g.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {g.shopifyTag}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {g.priceList ? (
                    <Link
                      to={`/price-lists/${g.priceList._id}`}
                      className="text-purple-600 hover:underline"
                    >
                      {g.priceList.name}
                    </Link>
                  ) : (
                    <span className="text-gray-400">Inheriting</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{g.customerCount}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => navigate(`/customers/groups/${g._id}`)}
                      className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(g._id)}
                      className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {others.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No additional customer groups yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
