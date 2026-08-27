import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as productsApi from '../../api/products.api'
import * as priceListsApi from '../../api/priceLists.api'

const CURRENCY_SYMBOLS = { USD: 'US$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'AU$' }

function formatMoney(amount, currency) {
  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `
  return `${symbol}${Number(amount).toFixed(2)}`
}

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 15.5 7 10l5-5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
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
    <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M18 10A8 8 0 112 10a8 8 0 0116 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9zm1-4a1 1 0 100 2 1 1 0 000-2z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ProductThumb({ src, alt = '' }) {
  const [errored, setErrored] = useState(false)

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setErrored(true)}
        className="h-12 w-12 shrink-0 rounded-md object-cover"
      />
    )
  }

  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400">
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 6.5 10 3l6 3.5v7L10 17l-6-3.5v-7Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 6.5 10 10m0 0 6-3.5M10 10v7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function Badge({ children }) {
  return (
    <span className="rounded border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
      {children}
    </span>
  )
}

function rowsFromPriceList(priceList) {
  return [
    {
      key: 'base',
      minQuantity: priceList.minQuantity || 1,
      unitOfMeasure: priceList.unitOfMeasure || '',
      price: priceList.price,
    },
    ...priceList.tiers.map((t, i) => ({
      key: i,
      minQuantity: t.minQuantity,
      unitOfMeasure: t.unitOfMeasure || '',
      price: t.price,
    })),
  ]
}

function RowForm({ initial, currency, onSave, onCancel }) {
  const [minQuantity, setMinQuantity] = useState(initial.minQuantity)
  const [unitOfMeasure, setUnitOfMeasure] = useState(initial.unitOfMeasure)
  const [price, setPrice] = useState(initial.price)

  return (
    <tr className="bg-gray-50">
      <td className="px-4 py-3 align-top">
        <label className="mb-1 block text-xs font-medium text-gray-500">Quantity</label>
        <input
          type="number"
          min="1"
          value={minQuantity}
          onChange={(e) => setMinQuantity(e.target.value)}
          className="w-20 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
        />
      </td>
      <td className="px-4 py-3 align-top">
        <label className="mb-1 block text-xs font-medium text-gray-500">Unit of measure</label>
        <input
          value={unitOfMeasure}
          onChange={(e) => setUnitOfMeasure(e.target.value)}
          placeholder="e.g. pallet-box"
          className="w-36 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
        />
      </td>
      <td className="px-4 py-3 align-top">
        <label className="mb-1 block text-xs font-medium text-gray-500">Price</label>
        <div className="flex w-28 items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1.5">
          <span className="text-sm text-gray-500">{CURRENCY_SYMBOLS[currency] || currency}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border-0 p-0 text-sm focus:outline-none focus:ring-0"
          />
        </div>
      </td>
      <td className="px-4 py-3 align-top text-right">
        <label className="mb-1 block text-xs invisible">Actions</label>
        <div className="inline-flex gap-2">
          <button
            onClick={() =>
              onSave({
                minQuantity: Math.max(1, Number(minQuantity) || 1),
                unitOfMeasure,
                price: Number(price) || 0,
              })
            }
            className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  )
}

function PriceListCard({ priceList, productId, onChanged }) {
  const [editingKey, setEditingKey] = useState(null)
  const [addingNew, setAddingNew] = useState(false)
  const rows = rowsFromPriceList(priceList)
  // SparkLayer docs: prices in automatic price lists are set by the
  // list's discount rule, not per-item — the Price Editor can't edit them.
  const readOnly = priceList.pricingType === 'automatic'

  async function saveRow(key, values) {
    if (key === 'base') {
      await priceListsApi.upsertItem(priceList._id, productId, {
        price: values.price,
        minQuantity: values.minQuantity,
        unitOfMeasure: values.unitOfMeasure,
        tiers: priceList.tiers,
      })
    } else {
      const tiers = priceList.tiers.map((t, i) => (i === key ? values : t))
      await priceListsApi.upsertItem(priceList._id, productId, {
        price: priceList.price,
        minQuantity: priceList.minQuantity,
        unitOfMeasure: priceList.unitOfMeasure,
        tiers,
      })
    }
    setEditingKey(null)
    onChanged()
  }

  async function addTier(values) {
    await priceListsApi.upsertItem(priceList._id, productId, {
      price: priceList.price,
      minQuantity: priceList.minQuantity,
      unitOfMeasure: priceList.unitOfMeasure,
      tiers: [...priceList.tiers, values],
    })
    setAddingNew(false)
    onChanged()
  }

  // The 1+ base row is required (SparkLayer docs: "there must always be at
  // least one entry for a single unit quantity and it's not possible to
  // remove this"), so this only ever fires for tier rows.
  async function removeRow(key) {
    const tiers = priceList.tiers.filter((_, i) => i !== key)
    await priceListsApi.upsertItem(priceList._id, productId, {
      price: priceList.price,
      minQuantity: priceList.minQuantity,
      unitOfMeasure: priceList.unitOfMeasure,
      tiers,
    })
    onChanged()
  }

  async function detach() {
    await priceListsApi.removeItem(priceList._id, productId)
    onChanged()
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900">{priceList.name}</h3>
        <div className="flex items-center gap-2">
          {priceList.handle && <Badge>{priceList.handle}</Badge>}
          <Badge>{priceList.currency}</Badge>
          <button
            onClick={detach}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Remove
          </button>
        </div>
      </div>

      {readOnly && (
        <div className="flex items-start gap-2 border-b border-gray-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <InfoIcon />
          <span>
            Prices in automatic price lists are set by the list&apos;s discount rule and can&apos;t be
            edited here. Manage the discount from{' '}
            <Link to={`/price-lists/${priceList._id}`} className="font-medium hover:underline">
              this price list
            </Link>
            .
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
          <tr>
            <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide">Quantity</th>
            <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide">Unit of measure</th>
            <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide">Price</th>
            {!readOnly && (
              <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) =>
            !readOnly && editingKey === row.key ? (
              <RowForm
                key={row.key}
                initial={row}
                currency={priceList.currency}
                onSave={(values) => saveRow(row.key, values)}
                onCancel={() => setEditingKey(null)}
              />
            ) : (
              <tr key={row.key}>
                <td className="px-4 py-3 text-gray-900">{row.minQuantity}+</td>
                <td className="px-4 py-3 text-gray-500">{row.unitOfMeasure || 'None'}</td>
                <td className="px-4 py-3 text-gray-900">{formatMoney(row.price, priceList.currency)}</td>
                {!readOnly && (
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => setEditingKey(row.key)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      {row.key !== 'base' && (
                        <button
                          onClick={() => removeRow(row.key)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )
          )}
          {!readOnly && addingNew && (
            <RowForm
              initial={{
                minQuantity: Math.max(1, ...rows.map((r) => r.minQuantity)) + 1,
                unitOfMeasure: '',
                price: priceList.price,
              }}
              currency={priceList.currency}
              onSave={addTier}
              onCancel={() => setAddingNew(false)}
            />
          )}
        </tbody>
      </table>
      </div>

      {!readOnly && (
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => setAddingNew(true)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Add a new price
          </button>
        </div>
      )}
    </section>
  )
}

function ShopifyPriceSection({ shopifyPrice }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900">Shopify Price</h3>
        <div className="flex items-center gap-2">
          <Badge>spark-shopify-price</Badge>
          <Badge>{shopifyPrice.currency}</Badge>
        </div>
      </div>

      <div className="flex items-start gap-2 border-b border-gray-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <InfoIcon />
        <span>
          This is an automated price list and cannot be edited. You can make changes from the price
          lists area.{' '}
          <Link to="/price-lists" className="font-medium hover:underline">
            Manage price lists
          </Link>
        </span>
      </div>

      <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
          <tr>
            <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide">Quantity</th>
            <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide">Unit of measure</th>
            <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide">Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="px-4 py-3 text-gray-900">1+</td>
            <td className="px-4 py-3 text-gray-500">None</td>
            <td className="px-4 py-3 text-gray-900">
              {formatMoney(shopifyPrice.price, shopifyPrice.currency)}
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </section>
  )
}

export default function PriceEditorVariantPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [selectedPriceListId, setSelectedPriceListId] = useState('')
  const [attaching, setAttaching] = useState(false)

  function reload() {
    productsApi.getPricingDetail(id).then(setData)
  }

  useEffect(() => {
    setData(null)
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (data?.availablePriceLists?.length) {
      setSelectedPriceListId(data.availablePriceLists[0]._id)
    } else {
      setSelectedPriceListId('')
    }
  }, [data])

  async function handleAddPriceList() {
    if (!selectedPriceListId) return
    setAttaching(true)
    try {
      await priceListsApi.upsertItem(selectedPriceListId, id, {
        price: data.product.msrp,
        unitOfMeasure: '',
        tiers: [],
      })
      reload()
    } finally {
      setAttaching(false)
    }
  }

  if (!data) {
    return <p className="text-gray-500">Loading…</p>
  }

  const { product, variants, priceLists, availablePriceLists, shopifyPrice } = data

  return (
    <div>
      <button
        onClick={() => navigate('/price-editor')}
        className="inline-flex items-center gap-1 text-sm text-gray-700 hover:underline"
      >
        <ChevronLeftIcon />
        Price Editor
      </button>
      <p className="mt-1 text-sm text-gray-500">Manage the B2B pricing for variant {product.sku}.</p>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-4 font-semibold text-gray-900">Variant Summary</h2>
        <div className="flex items-start gap-3">
          <ProductThumb src={product.image} alt={product.productTitle} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold text-gray-900">{product.productTitle}</div>
              {product.shopifyAdminUrl && (
                <a
                  href={product.shopifyAdminUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-purple-600 hover:underline"
                >
                  View product in Shopify
                  <ExternalLinkIcon />
                </a>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {product.productHandle && <Badge>{product.productHandle}</Badge>}
              {product.shopifyVariantId && (
                <Badge>{product.shopifyVariantId.split('/').pop()}</Badge>
              )}
            </div>
            {product.options.length > 0 && (
              <div className="mt-2 space-y-0.5 text-sm text-gray-700">
                {product.options.map((opt) => (
                  <div key={opt.name}>
                    <span className="font-medium text-gray-900">{opt.name}: </span>
                    {opt.value}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {variants.length > 1 && (
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Variant</label>
            <select
              value={id}
              onChange={(e) => navigate(`/price-editor/${e.target.value}`)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  SKU: {v.sku}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      <div className="mt-6 space-y-6">
        {priceLists.map((pl) => (
          <PriceListCard key={pl._id} priceList={pl} productId={id} onChanged={reload} />
        ))}
        <ShopifyPriceSection shopifyPrice={shopifyPrice} />
      </div>

      <section className="mt-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">Select a Price List</label>
        <select
          value={selectedPriceListId}
          onChange={(e) => setSelectedPriceListId(e.target.value)}
          disabled={availablePriceLists.length === 0}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-100"
        >
          {availablePriceLists.length === 0 ? (
            <option>No more price lists to add</option>
          ) : (
            availablePriceLists.map((pl) => (
              <option key={pl._id} value={pl._id}>
                {pl.name}
              </option>
            ))
          )}
        </select>
        <button
          onClick={handleAddPriceList}
          disabled={attaching || availablePriceLists.length === 0}
          className="mt-3 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Add price list
        </button>
        <p className="mt-2 text-xs text-gray-400">
          Please note: you can only choose from existing price lists.{' '}
          <Link to="/price-lists" className="hover:underline">
            Manage price lists
          </Link>
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Please note: you can only edit pricing for manually uploaded price lists.
        </p>
      </section>
    </div>
  )
}
