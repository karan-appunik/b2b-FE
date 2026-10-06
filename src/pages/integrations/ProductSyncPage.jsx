import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as productsApi from '../../api/products.api'
import * as dashboardApi from '../../api/dashboard.api'

function ExternalLinkIcon() {
  return (
    <svg className="inline-block h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M8.5 5.5H5.75A1.25 1.25 0 0 0 4.5 6.75v7.5a1.25 1.25 0 0 0 1.25 1.25h7.5a1.25 1.25 0 0 0 1.25-1.25V11.5M11.5 4.5h4v4M15.25 4.75l-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m17 17-3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WarningTriangleIcon() {
  return (
    <svg className="h-5 w-5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  )
}

function ReloadIcon({ spinning }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 transition-transform ${spinning ? 'animate-spin' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  )
}

function ProductThumb({ src, alt = '', className = 'h-9 w-9' }) {
  const [errored, setErrored] = useState(false)

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setErrored(true)}
        className={`${className} shrink-0 rounded-md object-cover`}
      />
    )
  }

  return (
    <span className={`flex ${className} shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400`}>
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 6.5 10 3l6 3.5v7L10 17l-6-3.5v-7Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 6.5 10 10m0 0 6-3.5M10 10v7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export default function ProductSyncPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [syncHealth, setSyncHealth] = useState(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(new Date())

  useEffect(() => {
    dashboardApi.syncHealth().then(setSyncHealth).catch(() => {})
  }, [])

  useEffect(() => {
    const q = search.trim()

    if (!q) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timeout = setTimeout(() => {
      productsApi
        .search(q)
        .then((data) => {
          setResults(data)
        })
        .finally(() => setLoading(false))
    }, 300)

    return () => clearTimeout(timeout)
  }, [search])

  function handleReload() {
    setReloading(true)
    setTimeout(() => {
      dashboardApi.syncHealth().then(setSyncHealth).catch(() => {})
      setLastSyncTime(new Date())
      setReloading(false)
    }, 800)
  }

  const issuesCount = syncHealth?.products?.issues ?? 1

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Product Sync</h1>
          <p className="mt-1 text-sm text-gray-500">
            This synchronises product data from your eCommerce platform.{' '}
            <a
              href="https://docs.sparklayer.io/data-sync"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-purple-600 hover:underline"
            >
              Learn more
              <ExternalLinkIcon />
            </a>
          </p>
        </div>

        <button
          onClick={handleReload}
          disabled={reloading}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
        >
          <ReloadIcon spinning={reloading} />
          Reload
        </button>
      </div>

      {/* Sync Status Banner */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-amber-100 p-1">
            <WarningTriangleIcon />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-gray-900">
              Products sync completed with {issuesCount} error{issuesCount !== 1 ? 's' : ''}
            </h2>
            <p className="mt-0.5 text-sm text-gray-600">
              We synced your products to Sparklayer, however some issues were encountered and we recommend fixing them.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Full sync: 16/06/2025 at 20:56 — Partial sync:{' '}
              {lastSyncTime.toLocaleDateString('en-GB')} at{' '}
              {lastSyncTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="mt-3">
              <button
                onClick={() => setShowErrorModal(true)}
                className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50"
              >
                Show errors
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Data Lookup Section */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Product Data Lookup</h2>
          <p className="text-sm text-gray-500">
            Search and diagnose the product data you're sending to SparkLayer.{' '}
            <a
              href="https://docs.sparklayer.io/data-sync#product-data-lookup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-purple-600 hover:underline"
            >
              Learn more
              <ExternalLinkIcon />
            </a>
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-4">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by ID, name, description, barcode, variant SKU, or variant options"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Searching products...</div>
          ) : results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Product
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      ID or SKU
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((group) => {
                    const hasVariants = group.variantCount > 1
                    const firstVariant = group.variants?.[0] || {}

                    return (
                      <Fragment key={group.id}>
                        <tr
                          onClick={!hasVariants ? () => navigate(`/integrations/products-sync/${firstVariant.id}`) : undefined}
                          className={!hasVariants ? 'cursor-pointer transition-colors hover:bg-gray-50' : undefined}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <ProductThumb src={group.image} alt={group.title || group.name} />
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900">{group.title || group.name || 'Product'}</p>
                                {hasVariants && (
                                  <p className="text-xs text-gray-500">
                                    {group.variantCount} variants
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-gray-600">
                            {group.handle || firstVariant.sku || group.id}
                          </td>
                        </tr>
                        {hasVariants &&
                          group.variants.map((variant) => (
                            <tr
                              key={variant.id}
                              onClick={() => navigate(`/integrations/products-sync/${variant.id}`)}
                              className="cursor-pointer bg-gray-50/40 transition-colors hover:bg-gray-100/70"
                            >
                              <td className="px-4 py-2.5 pl-10">
                                <div className="flex items-center gap-2">
                                  <ProductThumb src={variant.image || group.image} alt={variant.variantTitle} className="h-6 w-6" />
                                  <span className="text-xs font-medium text-purple-700">
                                    {variant.variantTitle || variant.sku}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-600">
                                {variant.sku}
                              </td>
                            </tr>
                          ))}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <SearchIcon className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-gray-900">No results found</p>
              <p className="mt-1 text-xs text-gray-500">
                Try adjusting your search or clearing filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Details Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Sync Errors & Diagnostics</h3>
              <button
                onClick={() => setShowErrorModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <strong>Notice:</strong> {issuesCount} product(s) in catalog currently do not have any B2B Price List entries assigned. They will default to store retail MSRP until assigned to a price tier.
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <p><strong>Recommendation:</strong> Use the Price Editor or upload a Price List CSV to assign wholesale rates for all active SKUs.</p>
                <p><strong>SKU Validation:</strong> Ensure all variant SKUs are unique and populated in Shopify Admin.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
