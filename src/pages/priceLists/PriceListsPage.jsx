import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import * as priceListsApi from '../../api/priceLists.api'
import * as productsApi from '../../api/products.api'
import { parseCsv, parseBulkPriceListCsv, stringifyCsv } from '../../utils/csv'

function TypeBadge({ pricingType, itemCount }) {
  if (pricingType === 'automatic') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
        Automatic
      </span>
    )
  }
  return (
    <span className="inline-flex h-[26px] w-[109px] items-center justify-center gap-1 rounded-md bg-[#cefafe] px-2 py-0.5 text-xs font-medium text-blue-700">
      <svg
        className="size-3 stroke-2"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
        />
      </svg>
      Manual ({itemCount})
    </span>
  )
}

function DownloadIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9 13.5 3 3m0 0 3-3m-3 3v-6m1.06-4.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
      />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  )
}

function RowMenu({ onDownload, onEdit, onClear, onDelete }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen((o) => !o)
  }

  function runAction(action) {
    setOpen(false)
    action()
  }

  return (
    <div className="inline-block text-left">
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        More actions
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: position.top, right: position.right }}
            className="z-50 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            <button
              onClick={() => runAction(onDownload)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <DownloadIcon />
              Download CSV
            </button>
            <button
              onClick={() => runAction(onEdit)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-teal-700 hover:bg-gray-50"
            >
              <EditIcon />
              Edit
            </button>
            <button
              onClick={() => runAction(onClear)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <ClearIcon />
              Clear
            </button>
            <button
              onClick={() => runAction(onDelete)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
            >
              <TrashIcon />
              Delete
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default function PriceListsPage() {
  const navigate = useNavigate()
  const [priceLists, setPriceLists] = useState([])
  const [products, setProducts] = useState([])
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)
  const uploadTargetRef = useRef(null)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkFile, setBulkFile] = useState(null)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkError, setBulkError] = useState('')

  function refresh() {
    priceListsApi.list().then(setPriceLists)
  }

  useEffect(() => {
    refresh()
    productsApi.list().then(setProducts)
  }, [])

  async function handleDelete(id) {
    if (!confirm('Delete this price list? Assigned customers will be unassigned.')) return
    await priceListsApi.remove(id)
    refresh()
  }

  async function handleDownload(pl) {
    setUploadMessage('')
    setUploadError('')
    try {
      const full = await priceListsApi.get(pl._id)
      const rows = full.items.map((item) => [item.product.sku, item.price])
      const csv = stringifyCsv([['sku', 'price'], ...rows])
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${pl.handle || pl.name}-prices.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setUploadError(`Could not download CSV for "${pl.name}".`)
    }
  }

  async function handleClear(pl) {
    if (!confirm(`Clear all prices from "${pl.name}"? This removes every product from the list.`)) return
    await priceListsApi.saveItems(pl._id, [])
    setUploadMessage(`Cleared all prices from "${pl.name}".`)
    refresh()
  }

  function triggerUpload(priceList) {
    setUploadMessage('')
    setUploadError('')
    uploadTargetRef.current = priceList
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0]
    const priceList = uploadTargetRef.current
    e.target.value = ''
    if (!file || !priceList) return

    try {
      const text = await file.text()
      const { rows, invalidCount } = parseCsv(text)
      const bySku = new Map(products.map((p) => [p.sku, p._id]))
      const items = rows.filter((row) => bySku.has(row.sku)).map((row) => ({
        product: bySku.get(row.sku),
        price: row.price,
      }))
      const unmatchedCount = rows.length - items.length

      if (items.length === 0) {
        setUploadError(`No matching products found in "${priceList.name}" upload.`)
        return
      }

      await priceListsApi.saveItems(priceList._id, items)
      const parts = [`Updated ${items.length} price${items.length === 1 ? '' : 's'} in "${priceList.name}".`]
      if (unmatchedCount > 0) parts.push(`${unmatchedCount} row(s) skipped — SKU not found.`)
      if (invalidCount > 0) parts.push(`${invalidCount} row(s) skipped — missing SKU or invalid price.`)
      setUploadMessage(parts.join(' '))
      refresh()
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed')
    }
  }

  function openBulkModal() {
    setBulkFile(null)
    setBulkError('')
    setBulkModalOpen(true)
  }

  function closeBulkModal() {
    setBulkModalOpen(false)
    setBulkFile(null)
    setBulkError('')
  }

  function handleBulkFileChosen(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) setBulkFile(file)
  }

  function handleBulkDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) setBulkFile(file)
  }

  function handleDownloadTemplate() {
    const csv = stringifyCsv([
      ['sku', 'price'],
      ['SKU-1', '12'],
      ['SKU-2', '15'],
    ])
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pricing_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleBulkContinue() {
    if (!bulkFile) return
    setBulkError('')
    setBulkUploading(true)
    try {
      const text = await bulkFile.text()
      const { rows, invalidCount } = parseBulkPriceListCsv(text)

      if (rows.length === 0) {
        setBulkError('No valid rows found. Expect columns: sku, price, price_list_slug.')
        return
      }

      const result = await priceListsApi.bulkImport(rows)
      const parts = [
        `Bulk upload complete: ${result.priceListsCreated} price list(s) created, ` +
          `${result.priceListsUpdated} updated, ${result.itemsUpdated} price(s) set.`,
      ]
      if (invalidCount > 0) parts.push(`${invalidCount} row(s) skipped — missing data or invalid price.`)
      setUploadMessage(parts.join(' '))
      closeBulkModal()
      refresh()
    } catch (err) {
      setBulkError(err.response?.data?.message || 'Bulk upload failed')
    } finally {
      setBulkUploading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Price Lists</h1>
          <p className="mt-1 text-sm text-gray-500">
            Price lists let you customize your specific B2B pricing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openBulkModal}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Bulk upload
          </button>
          <Link
            to="/price-lists/create"
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Create price list
          </Link>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelected}
        className="hidden"
      />

      {uploadMessage && <p className="mb-4 text-sm text-green-600">{uploadMessage}</p>}
      {uploadError && <p className="mb-4 text-sm text-red-600">{uploadError}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
       <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Currency</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Type</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {priceLists.map((pl) => (
              <tr key={pl._id}>
                <td className="px-4 py-3">
                  <Link
                    to={`/price-lists/${pl._id}`}
                    className="font-medium uppercase text-[#1e2939] hover:underline"
                  >
                    {pl.name}
                  </Link>
                  {pl.handle && <div className="text-xs text-gray-400">Handle: {pl.handle}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex h-[26px] w-[43px] items-center justify-center rounded-md border border-gray-200 text-xs font-medium text-gray-600">
                    {pl.currency || 'USD'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <TypeBadge pricingType={pl.pricingType || 'manual'} itemCount={pl.itemCount} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => triggerUpload(pl)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Upload
                    </button>
                    <RowMenu
                      onDownload={() => handleDownload(pl)}
                      onEdit={() => navigate(`/price-lists/${pl._id}`)}
                      onClear={() => handleClear(pl)}
                      onDelete={() => handleDelete(pl._id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {priceLists.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No price lists yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
       </div>
      </div>

      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Bulk import pricing data by CSV</h2>
              <button onClick={closeBulkModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600">
              To get started, you'll need to set up the following columns in your CSV file.
            </p>

            <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">SKU</th>
                    <th className="px-3 py-2 font-medium">PRICE</th>
                    <th className="px-3 py-2 font-medium">PRICE_LIST_SLUG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  <tr>
                    <td className="px-3 py-2">abc-01</td>
                    <td className="px-3 py-2">9.99</td>
                    <td className="px-3 py-2">base</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">abc-02</td>
                    <td className="px-3 py-2">19.99</td>
                    <td className="px-3 py-2">vip</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="mt-3 text-sm font-medium text-purple-600 hover:underline"
            >
              ↓ Download CSV template
            </button>

            <p className="mt-3 text-xs text-gray-400">
              A price list is matched by its handle (slug) — if no price list with that handle
              exists yet, one will be created automatically.
            </p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleBulkDrop}
              className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-center"
            >
              <label className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Add File
                <input type="file" accept=".csv" onChange={handleBulkFileChosen} className="hidden" />
              </label>
              <p className="text-xs text-gray-400">
                {bulkFile ? bulkFile.name : 'Upload a CSV file or drag a file here.'}
              </p>
            </div>

            {bulkError && <p className="mt-3 text-sm text-red-600">{bulkError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeBulkModal}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkContinue}
                disabled={!bulkFile || bulkUploading}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {bulkUploading ? 'Uploading…' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
