import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as productsApi from '../../api/products.api'

function formatPrice(amount) {
  return Number(amount || 0).toFixed(2)
}

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 15.5 7 10l5-5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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

function InfoIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M18 10A8 8 0 112 10a8 8 0 0116 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9zm1-4a1 1 0 100 2 1 1 0 000-2z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ProductThumb({ src, alt = '', className = 'h-14 w-14' }) {
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
      <svg className="h-6 w-6" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 6.5 10 3l6 3.5v7L10 17l-6-3.5v-7Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 6.5 10 10m0 0 6-3.5M10 10v7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export default function ProductDataDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [showRawData, setShowRawData] = useState(false)

  useEffect(() => {
    productsApi.getPricingDetail(id).then(setData).catch(() => {})
  }, [id])

  if (!data) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading product data...</div>
  }

  const { product, priceLists, shopifyPrice } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/integrations/products-sync')}
            className="cursor-pointer text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Back to Product Sync"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.5 15 7.5 10l5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Product Data</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          The product data SparkLayer holds for variant SKU &quot;{product.sku}&quot;.
        </p>
      </div>

      {/* Parent Product Card */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Parent Product</h2>
          {product.shopifyAdminUrl && (
            <a
              href={product.shopifyAdminUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:underline"
            >
              View product in Shopify
              <ExternalLinkIcon />
            </a>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <span className="block text-xs font-medium text-gray-500">Product Name</span>
            <span className="mt-1 block text-sm font-medium text-gray-900">
              {product.productTitle || product.name}
            </span>
          </div>

          <div>
            <span className="block text-xs font-medium text-gray-500">ID (slug)</span>
            <span className="mt-1 block font-mono text-sm text-gray-900">
              {product.productHandle || product.id}
            </span>
          </div>

          <div>
            <span className="block text-xs font-medium text-gray-500">External ID</span>
            <span className="mt-1 block font-mono text-sm text-gray-900">
              {product.shopifyProductId ? product.shopifyProductId.split('/').pop() : 'N/A'}
            </span>
          </div>

          <div>
            <span className="block text-xs font-medium text-gray-500">Product Options</span>
            <span className="mt-1 block text-sm text-gray-900">
              {product.options && product.options.length > 0
                ? product.options.map((o) => o.name).join(', ')
                : 'Default'}
            </span>
          </div>
        </div>
      </section>

      {/* Variant Section */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Variant</h2>
          <button
            onClick={() => setShowRawData((prev) => !prev)}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50"
          >
            {showRawData ? 'Hide raw data' : 'Show raw data'}
          </button>
        </div>

        {showRawData ? (
          <div className="mt-4 overflow-x-auto rounded-lg bg-[#fbf9fc] border border-purple-100 p-4 font-mono text-xs text-gray-800">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(
                {
                  status: 'live',
                  identifiers: {
                    sparklayer: product.id || '7376b45f-b88d-4afa-8925-055fe8989f2b',
                    internal: null,
                    platform: product.shopifyVariantId
                      ? product.shopifyVariantId.split('/').pop()
                      : product.shopifyProductId
                      ? product.shopifyProductId.split('/').pop()
                      : '52702466113852',
                    sku: product.sku || '',
                  },
                  option_values: (product.options || []).map((opt, i) => ({
                    group_metadata_namespace: 'sparklayer_option_groups',
                    group_metadata_key: `index:${i}`,
                    value_metadata_namespace: 'sparklayer_option_values',
                    value_metadata_key: `index:${i}`,
                    priority: 1,
                  })),
                  metadata: [
                    {
                      namespace: 'identifiers',
                      key: 'barcode',
                      type: 'string',
                      value: '',
                      translated_properties: null,
                    },
                    ...(product.options || []).map((opt, i) => ({
                      namespace: 'sparklayer_option_values',
                      key: `index:${i}`,
                      type: 'string',
                      value: opt.value || opt.name,
                      translated_properties: null,
                    })),
                  ],
                  stock_management: 'none',
                  selling_rules: [],
                  rrp: [
                    {
                      value: product.msrp || shopifyPrice?.price || 0,
                      currency_code: 'usd',
                    },
                  ],
                  shipping_properties: {
                    weight_grams: null,
                    width_mm: null,
                    height_mm: null,
                    depth_mm: null,
                  },
                  cart_image_url: product.image || null,
                },
                null,
                2
              )}
            </pre>
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-4">
            <ProductThumb src={product.image} alt={product.productTitle} />
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <span className="block text-xs font-medium text-gray-500">SKU</span>
                <span className="mt-1 block font-mono text-sm font-medium text-gray-900">
                  {product.sku}
                </span>
              </div>

              {product.options &&
                product.options.map((opt) => (
                  <div key={opt.name}>
                    <span className="block text-xs font-medium text-gray-500">{opt.name}</span>
                    <span className="mt-1 block text-sm text-gray-900">{opt.value}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </section>

      {/* Stock Data Section */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Stock Data</h2>

        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900">
          <InfoIcon />
          <div>
            <span>Stock is not being tracked for this variant. </span>
            <a
              href="https://docs.sparklayer.io/data-sync"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-blue-700 hover:underline"
            >
              Learn more
              <ExternalLinkIcon />
            </a>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900">
          <div className="flex items-start gap-3">
            <InfoIcon />
            <div>
              <p className="font-semibold">Looking to set different stock locations for your B2B customers?</p>
              <p className="mt-0.5 text-blue-800">
                With stock locations you can specify which stock locations you want your B2B customers to order stock from.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="cursor-pointer shrink-0 rounded-lg border border-blue-300 bg-white px-3 py-1.5 font-medium text-blue-900 shadow-xs hover:bg-blue-50"
          >
            Get started
          </button>
        </div>
      </section>

      {/* Price List Data Section */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Price List Data</h2>
          <button
            onClick={() => navigate(`/price-editor/${id}`)}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50"
          >
            Manually edit pricing
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50/50 text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">
                  Price List
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">
                  Quantity
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">
                  Unit of measure
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {priceLists.map((pl) => (
                <tr key={pl._id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{pl.name}</td>
                  <td className="px-4 py-3 text-gray-600">{pl.minQuantity || 1}</td>
                  <td className="px-4 py-3 text-gray-500">{pl.unitOfMeasure || 'None'}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatPrice(pl.price)}
                  </td>
                </tr>
              ))}

              {shopifyPrice && (
                <tr className="bg-gray-50/30">
                  <td className="px-4 py-3 font-medium text-gray-700">
                    spark-shopify-price
                  </td>
                  <td className="px-4 py-3 text-gray-600">1</td>
                  <td className="px-4 py-3 text-gray-500">None</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatPrice(shopifyPrice.price)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
