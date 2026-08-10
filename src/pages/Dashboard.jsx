import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as productsApi from '../api/products.api'
import * as customersApi from '../api/customers.api'
import * as priceListsApi from '../api/priceLists.api'

export default function Dashboard() {
  const [counts, setCounts] = useState({ products: 0, customers: 0, priceLists: 0 })

  useEffect(() => {
    Promise.all([productsApi.list(), customersApi.list(), priceListsApi.list()]).then(
      ([products, customers, priceLists]) =>
        setCounts({
          products: products.length,
          customers: customers.length,
          priceLists: priceLists.length,
        }),
    )
  }, [])

  const cards = [
    { label: 'Products', value: counts.products, to: '/products' },
    { label: 'Customers', value: counts.customers, to: '/customers' },
    { label: 'Price Lists', value: counts.priceLists, to: '/price-lists' },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-purple-300"
          >
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
