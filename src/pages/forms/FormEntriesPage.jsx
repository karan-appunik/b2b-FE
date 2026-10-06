import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as formsApi from '../../api/forms.api'
import { formatEntryValue } from './entryFormat'
import { stringifyCsv } from '../../utils/csv'

function formatDateTime(value) {
  return new Date(value).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ReviewBadge({ reviewStatus }) {
  const styles = {
    pending: 'bg-gray-100 text-gray-600',
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[reviewStatus]}`}>
      {reviewStatus}
    </span>
  )
}

export default function FormEntriesPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [entries, setEntries] = useState([])

  function refresh() {
    Promise.all([formsApi.get(id), formsApi.listEntries(id)]).then(([f, e]) => {
      setForm(f)
      setEntries(e)
    })
  }

  useEffect(refresh, [id])

  async function handleDelete(entryId) {
    if (!confirm('Delete this entry?')) return
    await formsApi.removeEntry(id, entryId)
    refresh()
  }

  function handleExportCsv() {
    const exportFields = form.fields.filter((f) => f.type !== 'hidden')
    const header = ['Submitted', ...exportFields.map((f) => f.label)]
    const rows = entries.map((entry) => [
      formatDateTime(entry.createdAt),
      ...exportFields.map((f) => formatEntryValue(f, entry.data?.[f._id])),
    ])
    const csv = stringifyCsv([header, ...rows])
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.name}-entries.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const previewField = form?.fields?.find((f) => f.type !== 'hidden')

  function firstFieldPreview(entry) {
    if (!previewField) return '—'
    return formatEntryValue(previewField, entry.data?.[previewField._id])
  }

  if (!form) {
    return <p className="text-gray-500">Loading…</p>
  }

  return (
    <div>
      <Link to="/forms" className="text-sm text-purple-600 hover:underline">
        ← Forms
      </Link>
      <div className="mt-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{form.name} — Entries</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={entries.length === 0}
            className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export CSV
          </button>
          <Link
            to={`/forms/${id}`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Edit form
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">{previewField?.label || 'Preview'}</th>
                {form.settings.trackReadStatus && <th className="px-4 py-3 font-medium">Status</th>}
                {form.settings.enableApprovalWorkflow && <th className="px-4 py-3 font-medium">Review</th>}
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry._id} className={entry.status === 'unread' ? 'font-medium' : ''}>
                  <td className="px-4 py-3 text-gray-700">{formatDateTime(entry.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-700">{firstFieldPreview(entry)}</td>
                  {form.settings.trackReadStatus && (
                    <td className="px-4 py-3">
                      {entry.status === 'unread' ? (
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                          Unread
                        </span>
                      ) : (
                        <span className="text-gray-400">Read</span>
                      )}
                    </td>
                  )}
                  {form.settings.enableApprovalWorkflow && (
                    <td className="px-4 py-3">
                      <ReviewBadge reviewStatus={entry.reviewStatus} />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/forms/${id}/entries/${entry._id}`)}
                        className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-red-600 hover:bg-gray-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td
                    colSpan={3 + (form.settings.trackReadStatus ? 1 : 0) + (form.settings.enableApprovalWorkflow ? 1 : 0)}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No entries yet.
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
