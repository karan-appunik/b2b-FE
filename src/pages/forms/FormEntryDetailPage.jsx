import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as formsApi from '../../api/forms.api'
import { formatEntryValue } from './entryFormat'

function fileUrl(value) {
  if (!value) return value
  return value.startsWith('/') ? `${import.meta.env.VITE_BACKEND_API_URL}${value}` : value
}

function formatDateTime(value) {
  return new Date(value).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isFieldVisible(field, reviewStatus) {
  return !field.visibleWhenReviewStatus?.length || field.visibleWhenReviewStatus.includes(reviewStatus)
}

function InternalFieldInput({ field, value, onChange }) {
  if (field.type === 'toggle' || field.type === 'checkbox') {
    return (
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        <span className="text-sm text-gray-700">{field.label}</span>
      </label>
    )
  }

  if (field.type === 'select') {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium uppercase text-gray-400">{field.label}</label>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        >
          <option value="">Select...</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (field.type === 'longtext') {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium uppercase text-gray-400">{field.label}</label>
        <textarea
          rows={3}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
      </div>
    )
  }

  if (field.type === 'button') {
    return (
      <button
        type="button"
        onClick={() => onChange(true)}
        disabled={!!value}
        className="cursor-pointer rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {value ? `${field.label} ✓` : field.label}
      </button>
    )
  }

  return null
}

function InternalFieldsSection({ internalFields, reviewStatus, internalData, onChange }) {
  const visibleTop = internalFields.filter((f) => isFieldVisible(f, reviewStatus))
  if (visibleTop.length === 0) return null

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-gray-900">Internal fields</h2>
      <p className="mt-1 text-xs text-gray-400">
        Admin-only — never seen by the customer. Workflow Trigger Buttons just record that they
        were clicked; workflows aren't available yet.
      </p>
      <div className="mt-4 space-y-4">
        {visibleTop.map((field) =>
          field.type === 'group' ? (
            <div key={field._id} className="rounded-lg border border-gray-200 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-900">{field.label}</p>
              <div className="space-y-3">
                {(field.fields || [])
                  .filter((c) => isFieldVisible(c, reviewStatus))
                  .map((child) => (
                    <InternalFieldInput
                      key={child._id}
                      field={child}
                      value={internalData[child._id]}
                      onChange={(v) => onChange(child._id, v)}
                    />
                  ))}
              </div>
            </div>
          ) : (
            <InternalFieldInput
              key={field._id}
              field={field}
              value={internalData[field._id]}
              onChange={(v) => onChange(field._id, v)}
            />
          )
        )}
      </div>
    </section>
  )
}

export default function FormEntryDetailPage() {
  const { id, entryId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [entry, setEntry] = useState(null)
  const [internalData, setInternalData] = useState({})
  const [reviewing, setReviewing] = useState(false)
  const [savingInternal, setSavingInternal] = useState(false)
  const [internalMessage, setInternalMessage] = useState('')

  function load() {
    Promise.all([formsApi.get(id), formsApi.getEntry(id, entryId)]).then(([f, e]) => {
      setForm(f)
      setEntry(e)
      setInternalData(e.internalData || {})
    })
  }

  useEffect(load, [id, entryId])

  async function handleReview(reviewStatus) {
    setReviewing(true)
    try {
      const updated = await formsApi.reviewEntry(id, entryId, reviewStatus)
      setEntry(updated)
    } finally {
      setReviewing(false)
    }
  }

  function handleInternalChange(fieldId, value) {
    setInternalData((prev) => ({ ...prev, [fieldId]: value }))
  }

  async function handleSaveInternal() {
    setSavingInternal(true)
    setInternalMessage('')
    try {
      const updated = await formsApi.updateEntryInternalData(id, entryId, internalData)
      setEntry(updated)
      setInternalMessage('Internal fields saved.')
    } finally {
      setSavingInternal(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this entry?')) return
    await formsApi.removeEntry(id, entryId)
    navigate(`/forms/${id}/entries`)
  }

  if (!form || !entry) {
    return <p className="text-gray-500">Loading…</p>
  }

  const hasInternalFields = (form.internalFields || []).length > 0

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={`/forms/${id}/entries`} className="text-sm text-purple-600 hover:underline">
        ← {form.name} — Entries
      </Link>

      <div className="mt-1 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Entry</h1>
          <p className="mt-1 text-sm text-gray-500">Submitted {formatDateTime(entry.createdAt)}</p>
        </div>
        <button
          onClick={handleDelete}
          className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-red-600 hover:bg-gray-50"
        >
          Delete
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white lg:col-span-2">
          {form.fields.filter((f) => f.type !== 'hidden').map((field) => (
            <div key={field._id} className="px-6 py-4">
              <p className="text-xs font-medium uppercase text-gray-400">{field.label}</p>
              {field.type === 'file' && entry.data?.[field._id] ? (
                <a
                  href={fileUrl(entry.data[field._id])}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm text-purple-600 hover:underline"
                >
                  View uploaded file
                </a>
              ) : (
                <p className="mt-1 text-sm text-gray-900">{formatEntryValue(field, entry.data?.[field._id])}</p>
              )}
            </div>
          ))}
        </section>

        <div className="space-y-6 lg:col-span-1">
          {form.settings.enableApprovalWorkflow && (
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-gray-900">Approval status</h2>
              <p className="mt-1 text-sm capitalize text-gray-500">{entry.reviewStatus}</p>
              <div className="mt-4 flex gap-2">
                <button
                  disabled={reviewing || entry.reviewStatus === 'approved'}
                  onClick={() => handleReview('approved')}
                  className="flex-1 cursor-pointer rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  disabled={reviewing || entry.reviewStatus === 'rejected'}
                  onClick={() => handleReview('rejected')}
                  className="flex-1 cursor-pointer rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </section>
          )}

          {hasInternalFields && (
            <>
              <InternalFieldsSection
                internalFields={form.internalFields}
                reviewStatus={entry.reviewStatus}
                internalData={internalData}
                onChange={handleInternalChange}
              />
              <div className="flex flex-wrap items-center justify-end gap-3">
                {internalMessage && <p className="text-sm text-green-600">{internalMessage}</p>}
                <button
                  type="button"
                  onClick={handleSaveInternal}
                  disabled={savingInternal}
                  className="cursor-pointer rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {savingInternal ? 'Saving…' : 'Save internal fields'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
