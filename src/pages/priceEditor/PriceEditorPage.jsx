import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as productsApi from '../../api/products.api'

function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m17 17-3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function IndentArrowIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-gray-300" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 3v8a3 3 0 0 0 3 3h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProductThumb({ src, alt = '', className = 'h-8 w-8' }) {
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
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path
          d="M4 6.5 10 3l6 3.5v7L10 17l-6-3.5v-7Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M4 6.5 10 10m0 0 6-3.5M10 10v7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export default function PriceEditorPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(() => new Set())

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
          setExpanded(new Set(data.map((group) => group.id)))
        })
        .finally(() => setLoading(false))
    }, 300)

    return () => clearTimeout(timeout)
  }, [search])

  function toggleGroup(id) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Price Editor</h1>
      <p className="mt-1 text-sm text-gray-500">
        The Price Editor lets you easily make changes to your B2B pricing without needing to upload a
        CSV file.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
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

        {results.length > 0 && (
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200">
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
                const isOpen = expanded.has(group.id)
                const hasVariants = group.variantCount > 1

                return (
                  <Fragment key={group.id}>
                    <tr
                      onClick={!hasVariants ? () => navigate(`/price-editor/${group.variants[0].id}`) : undefined}
                      className={!hasVariants ? 'cursor-pointer hover:bg-gray-50' : undefined}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProductThumb src={group.image} alt={group.title} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium text-gray-900">{group.title}</span>
                              {hasVariants && (
                                <button
                                  onClick={() => toggleGroup(group.id)}
                                  className="cursor-pointer"
                                  aria-label={isOpen ? 'Collapse variants' : 'Expand variants'}
                                >
                                  <ChevronIcon open={isOpen} />
                                </button>
                              )}
                            </div>
                            {hasVariants && (
                              <div className="text-xs text-gray-500">{group.variantCount} variants</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {group.handle || group.variants[0]?.sku}
                      </td>
                    </tr>
                    {hasVariants &&
                      isOpen &&
                      group.variants.map((variant) => (
                        <tr
                          key={variant.id}
                          onClick={() => navigate(`/price-editor/${variant.id}`)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 pl-6">
                              <IndentArrowIcon />
                              <ProductThumb
                                src={variant.image}
                                alt={variant.variantTitle}
                                className="h-6 w-6"
                              />
                              <span className="truncate font-medium text-purple-600">
                                {variant.variantTitle}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">{variant.sku}</td>
                        </tr>
                      ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
          </div>
        )}

        {results.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <SearchIcon className="h-6 w-6 text-gray-400" />
            </span>
            <p className="font-semibold text-gray-900">No results found</p>
            <p className="text-sm text-gray-500">
              Try adjusting your search or clearing{' '}
              <button onClick={() => setSearch('')} className="text-purple-600 hover:underline">
                filters
              </button>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  )
}