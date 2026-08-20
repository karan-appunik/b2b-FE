import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as priceListsApi from '../../api/priceLists.api'
import * as productsApi from '../../api/products.api'
import { parseCsv, slugify } from '../../utils/csv'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']

export default function PriceListCreatePage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [handleTouched, setHandleTouched] = useState(false)
  const [currency, setCurrency] = useState('USD')

  const [automaticEnabled, setAutomaticEnabled] = useState(false)
  const [discountType, setDiscountType] = useState('percentage')
  const [discountValue, setDiscountValue] = useState('')

  const [manualEnabled, setManualEnabled] = useState(false)
  const [csvFile, setCsvFile] = useState(null)
  const [csvRowCount, setCsvRowCount] = useState(null)
  const [csvInvalidCount, setCsvInvalidCount] = useState(0)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [importWarning, setImportWarning] = useState('')

  function handleNameChange(value) {
    setName(value)
    if (!handleTouched) setHandle(slugify(value))
  }

  function handleHandleChange(value) {
    setHandleTouched(true)
    setHandle(slugify(value))
  }

  async function handleCsvChange(e) {
    const file = e.target.files?.[0] || null
    setCsvFile(file)
    setCsvRowCount(null)
    setCsvInvalidCount(0)
    if (!file) return
    const text = await file.text()
    const { rows, invalidCount } = parseCsv(text)
    setCsvRowCount(rows.length)
    setCsvInvalidCount(invalidCount)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setImportWarning('')

    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    setSaving(true)
    try {
      const priceList = await priceListsApi.create({
        name: name.trim(),
        handle: handle || slugify(name),
        currency,
        status: 'draft',
        pricingType: automaticEnabled ? 'automatic' : 'manual',
        automaticPricing: automaticEnabled
          ? { discountType, discountValue: Number(discountValue) || 0 }
          : undefined,
      })

      if (manualEnabled && csvFile) {
        const text = await csvFile.text()
        const { rows, invalidCount } = parseCsv(text)
        if (rows.length > 0) {
          try {
            const products = await productsApi.list()
            const bySku = new Map(products.map((p) => [p.sku, p._id]))
            const items = rows
              .filter((row) => bySku.has(row.sku))
              .map((row) => ({ product: bySku.get(row.sku), price: row.price }))
            const unmatchedSkus = rows.filter((row) => !bySku.has(row.sku)).map((row) => row.sku)

            if (items.length > 0) {
              await priceListsApi.saveItems(priceList._id, items)
            }

            if (unmatchedSkus.length > 0 || invalidCount > 0) {
              const parts = [`Price list created. ${items.length} of ${rows.length} priced row(s) imported.`]
              if (unmatchedSkus.length > 0) {
                parts.push(`${unmatchedSkus.length} row(s) skipped — SKU not found: ${unmatchedSkus.join(', ')}.`)
              }
              if (invalidCount > 0) {
                parts.push(`${invalidCount} row(s) skipped — missing SKU or invalid price.`)
              }
              setImportWarning(parts.join(' '))
              return
            }
          } catch (importErr) {
            await priceListsApi.remove(priceList._id).catch(() => {})
            throw importErr
          }
        }
      }

      navigate('/price-lists')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create price list')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/price-lists" className="text-sm text-purple-600 hover:underline">
        ← Price Lists
      </Link>
      <h1 className="mt-1 text-2xl font-semibold text-gray-900">Create price list</h1>
      <p className="mt-1 text-sm text-gray-500">
        Choose how you want your pricing to work with automatic and manual pricing.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Details */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Wholesale pricing"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Handle (or ID)</label>
              <input
                value={handle}
                onChange={(e) => handleHandleChange(e.target.value)}
                placeholder="e.g. wholesale-pricing"
                maxLength={64}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none sm:w-1/2"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            The price list handle and currency cannot be changed once a price list has been created.
          </p>
        </section>

        {/* Automatic pricing */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Automatic pricing</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">
            Use another pricing source and apply a discount.
          </p>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={automaticEnabled}
              onChange={(e) => setAutomaticEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            Enable automatic pricing
          </label>

          {automaticEnabled && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Discount type</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value="percentage">Percentage off</option>
                  <option value="fixed">Fixed amount off</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Discount value</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 5.00'}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </section>

        {/* Manual pricing */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Manual pricing</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">
            Set specific prices for each product by uploading a CSV file.
          </p>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={manualEnabled}
              onChange={(e) => setManualEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            Enable manual pricing
          </label>

          {manualEnabled && (
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                CSV file (columns: sku, price)
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvChange}
                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-purple-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-purple-700 hover:file:bg-purple-100"
              />
              {csvRowCount !== null && (
                <p className="mt-2 text-xs text-gray-500">
                  {csvRowCount} price {csvRowCount === 1 ? 'row' : 'rows'} found in file.
                  {csvInvalidCount > 0 &&
                    ` ${csvInvalidCount} row(s) skipped — missing SKU or invalid price.`}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                You can also set prices per product later from the price list page.
              </p>
            </div>
          )}
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {importWarning && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p>{importWarning}</p>
            <Link to="/price-lists" className="mt-2 inline-block font-medium underline">
              Continue to price lists
            </Link>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link
            to="/price-lists"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create price list'}
          </button>
        </div>
      </form>
    </div>
  )
}
