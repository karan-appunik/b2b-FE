import { useEffect, useState } from 'react'
import * as ordersApi from '../api/orders.api'
import ActivityWidget, { formatMoney, useActivityStats } from '../components/ActivityWidget'

export default function Activity() {
  const { days, setDays, type, setType, stats, loading } = useActivityStats()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    ordersApi.list(days).then(setOrders)
  }, [days])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Activity</h1>

      <ActivityWidget days={days} onDaysChange={setDays} type={type} onTypeChange={setType} stats={stats} loading={loading} />

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Shipping address</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const shopifyHandle = import.meta.env.VITE_SHOPIFY_SHOP?.replace(/^https?:\/\//, '')
                  .replace(/\/$/, '')
                  .replace(/\.myshopify\.com$/, '')
                const numericId = order.shopifyOrderId?.split('/').pop()
                const orderUrl =
                  shopifyHandle && numericId
                    ? `https://admin.shopify.com/store/${shopifyHandle}/orders/${numericId}`
                    : null

                return (
                  <tr key={order._id}>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.orderedAt).toLocaleString('en-US', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-purple-600">{order.name}</td>
                    <td className="px-4 py-3 text-gray-700">Order</td>
                    <td className="px-4 py-3 text-gray-500">
                      <span className="block max-w-xs truncate">{order.shippingAddress || 'No shipping address available'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      <span className="font-medium">{formatMoney(order.totalPrice, order.currency)}</span>{' '}
                      <span className="text-xs text-gray-400">{order.currency}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {orderUrl && (
                        <a
                          href={orderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          View
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No orders in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
