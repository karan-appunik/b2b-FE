import { useMemo, useState } from 'react'

function BagIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5.5 7.5h9l.6 9.2a1 1 0 0 1-1 1.1H5.9a1 1 0 0 1-1-1.1l.6-9.2Z" strokeLinejoin="round" />
      <path d="M7.25 7.5V6a2.75 2.75 0 0 1 5.5 0v1.5" strokeLinecap="round" />
    </svg>
  )
}

function UserIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="6.5" r="3.25" />
      <path d="M3.5 17c.9-3.4 3.7-5.25 6.5-5.25S15.6 13.6 16.5 17" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4.5 5.5h11M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M6 5.5l.6 10.4a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L14 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 7v6M7 10h6" strokeLinecap="round" />
    </svg>
  )
}

function ExpandIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7.5 3.5h-3a1 1 0 0 0-1 1v3M12.5 3.5h3a1 1 0 0 1 1 1v3M7.5 16.5h-3a1 1 0 0 1-1-1v-3M12.5 16.5h3a1 1 0 0 0 1-1v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const STEPS = ['My Cart', 'Shipping', 'Review & Pay', 'Complete']

function CartSteps({ current = 0 }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-5">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          {i > 0 && <div className="mx-2 h-px w-10 bg-gray-200 sm:w-16" />}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                i === current
                  ? 'bg-gray-900 text-white'
                  : i < current
                    ? 'border border-gray-900 text-gray-900'
                    : 'border border-gray-300 text-gray-400'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-xs ${i === current ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CartDrawer({ open, onClose, items, onQtyChange, onRemove, catalog = [], onAddBySku }) {
  const [search, setSearch] = useState('')

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return catalog
      .filter((p) => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
      .slice(0, 6)
  }, [search, catalog])

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0)
  const subTotal = items.reduce((sum, i) => sum + i.qty * i.product.msrp, 0)

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[1000px] flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center border-b border-gray-200">
          <div className="flex flex-1 items-center gap-2 border-b-2 border-gray-900 px-6 py-4 text-sm font-semibold text-gray-900">
            <BagIcon className="h-5 w-5" />
            My Cart
          </div>
          <div className="flex flex-1 items-center gap-2 px-6 py-4 text-sm font-medium text-gray-400">
            <UserIcon className="h-5 w-5" />
            My Account
          </div>
          <button
            onClick={onClose}
            className="mr-4 shrink-0 rounded-md p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        <CartSteps current={0} />

        <div className="flex items-center justify-between border-t border-gray-100 px-6 pt-5">
          <h2 className="text-xl font-semibold text-gray-900">My Cart</h2>
          <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
            <ExpandIcon className="h-4 w-4" />
            Expand
          </button>
        </div>

        <div className="relative px-6 pt-4">
          <PlusCircleIcon className="pointer-events-none absolute left-9 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Add products by SKU or Barcode"
            className="w-full rounded-md border border-gray-300 py-2.5 pl-10 pr-3 text-sm text-gray-500 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none"
          />
          {suggestions.length > 0 && (
            <div className="absolute left-6 right-6 z-10 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
              {suggestions.map((p) => (
                <button
                  key={p._id}
                  onClick={() => {
                    onAddBySku(p)
                    setSearch('')
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span className="text-gray-900">{p.name}</span>
                  <span className="text-gray-400">{p.sku}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">Your cart is empty.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map(({ product, qty }) => (
                <div key={product._id} className="flex items-start gap-4 py-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-gray-100">
                    <BagIcon className="h-6 w-6 text-gray-300" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">SKU: {product.sku}</p>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center rounded-md border border-gray-300">
                        <button
                          onClick={() => onQtyChange(product._id, Math.max(1, qty - 1))}
                          className="px-2.5 py-1 text-gray-500 hover:bg-gray-50"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm text-gray-900">{qty}</span>
                        <button
                          onClick={() => onQtyChange(product._id, qty + 1)}
                          className="px-2.5 py-1 text-gray-500 hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => onRemove(product._id)}
                        className="text-gray-400 hover:text-red-600"
                        aria-label="Remove item"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${(product.msrp * qty).toFixed(2)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">${product.msrp.toFixed(2)}/ea</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
            <span>
              Sub-total{' '}
              <span className="font-normal text-gray-500">
                ({items.length} {items.length === 1 ? 'line' : 'lines'}, {totalItems} {totalItems === 1 ? 'item' : 'items'})
              </span>
            </span>
            <span>${subTotal.toFixed(2)}</span>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            Tax and shipping costs calculated during checkout.
          </p>

          <div className="my-5 border-t border-gray-200" />

          <button
            disabled={items.length === 0}
            className="w-full rounded-md bg-gray-900 py-3.5 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            Proceed to checkout
          </button>
        </div>
      </aside>
    </>
  )
}
