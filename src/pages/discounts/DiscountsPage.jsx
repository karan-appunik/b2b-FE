import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as discountsApi from '../../api/discounts.api'

function ScissorsIcon() {
  return (
    <svg className="h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 8.25 15.75 15.75M8.25 15.75 15.75 8.25M6 6a2.25 2.25 0 1 1 0 4.5A2.25 2.25 0 0 1 6 6Zm0 13.5a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z"
      />
    </svg>
  )
}

function CouponIcon() {
  return (
    <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 8.25V6a3 3 0 1 1 6 0v2.25M9 8.25h6M9 12h6"
      />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  )
}

function MethodBadge({ method, couponCodes }) {
  if (method === 'coupon') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-[#cefafe] px-2 py-0.5 text-xs font-medium text-blue-700">
        Coupon: {(couponCodes || []).join(', ')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
      Automatic
    </span>
  )
}

function StatusBadge({ status }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      Draft
    </span>
  )
}

function formatValue(discount) {
  if (discount.appliesTo === 'free_product') {
    const qty = discount.freeProduct?.quantity || 1
    const name = discount.freeProduct?.title || 'product'
    return `Free: ${qty}x ${name}`
  }
  if (discount.appliesTo === 'line_item') {
    const count = discount.lineItemSkus?.length || 0
    return `${discount.value}% off ${count} SKU${count === 1 ? '' : 's'}`
  }
  const suffix = discount.appliesTo === 'shipping' ? ' shipping' : ''
  if (discount.valueType === 'free') return 'Free shipping'
  if (discount.valueType === 'percentage') return `${discount.value}% off${suffix}`
  return `${discount.currency || 'USD'} ${Number(discount.value).toFixed(2)} off${suffix}`
}

const TEMPLATES = [
  {
    key: 'coupon-20-off',
    title: '20% off with coupon code 20-OFF',
    description: 'Apply a 20% discount off the sub-total using a coupon',
    icon: CouponIcon,
  },
  {
    key: 'order-100-off-1000',
    title: 'US$100.00 off on orders over US$1,000.00',
    description: 'Apply a fixed-amount discount on a sub-total threshold',
    icon: TagIcon,
  },
]

export default function DiscountsPage() {
  const navigate = useNavigate()
  const [discounts, setDiscounts] = useState([])
  const [loaded, setLoaded] = useState(false)

  function refresh() {
    discountsApi.list().then((data) => {
      setDiscounts(data)
      setLoaded(true)
    })
  }

  useEffect(refresh, [])

  async function handleDelete(id) {
    if (!confirm('Delete this discount?')) return
    await discountsApi.remove(id)
    refresh()
  }

  async function handleDuplicate(id) {
    await discountsApi.duplicate(id)
    refresh()
  }

  function startFromTemplate(templateKey) {
    navigate('/discounts/create', { state: { template: templateKey } })
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Discounts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Discounts let you set up promotions for your B2B customers that work alongside any
            price list rules you have set up.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {discounts.length > 1 && (
            <Link
              to="/discounts/priorities"
              className="whitespace-nowrap rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Manage priorities
            </Link>
          )}
          <Link
            to="/discounts/create"
            className="whitespace-nowrap rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Create Discount
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loaded && discounts.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <ScissorsIcon />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">You have no discounts set up yet</h2>
            <p className="mt-1 text-sm text-gray-500">Let's get started and create your first one!</p>
            <Link
              to="/discounts/create"
              className="mt-5 whitespace-nowrap rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Create Discount
            </Link>

            <div className="mt-10 w-full max-w-2xl border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-500">
                Or start with a ready-made discount (you can edit these later)
              </p>
              <div className="mt-4 space-y-3 text-left">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.key}
                    onClick={() => startFromTemplate(tpl.key)}
                    className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-purple-300 hover:bg-purple-50/40"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-purple-50">
                      <tpl.icon />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">{tpl.title}</span>
                      <span className="block text-xs text-gray-500">{tpl.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Method</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Value</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {discounts.map((d) => (
                  <tr key={d._id}>
                    <td className="px-4 py-3">
                      <Link to={`/discounts/${d._id}`} className="font-medium text-purple-600 hover:underline">
                        {d.name}
                      </Link>
                      {d.handle && <div className="text-xs text-gray-400">Handle: {d.handle}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <MethodBadge method={d.method} couponCodes={d.couponCodes} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatValue(d)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/discounts/${d._id}`)}
                          className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(d._id)}
                          className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDelete(d._id)}
                          className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-red-600 hover:bg-gray-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
