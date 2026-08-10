import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as priceListsApi from '../../api/priceLists.api'

export default function PriceListsPage() {
  const [priceLists, setPriceLists] = useState([])

  function refresh() {
    priceListsApi.list().then(setPriceLists)
  }

  useEffect(refresh, [])

  async function handleDelete(id) {
    if (!confirm('Delete this price list? Assigned customers will be unassigned.')) return
    await priceListsApi.remove(id)
    refresh()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Price Lists</h1>
        <Link
          to="/price-lists/create"
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Create price list
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Customers</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {priceLists.map((pl) => (
              <tr key={pl._id}>
                <td className="px-4 py-3">
                  <Link
                    to={`/price-lists/${pl._id}`}
                    className="font-medium text-purple-600 hover:underline"
                  >
                    {pl.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      pl.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {pl.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{pl.itemCount}</td>
                <td className="px-4 py-3 text-gray-500">{pl.customerCount}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(pl._id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {priceLists.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No price lists yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
