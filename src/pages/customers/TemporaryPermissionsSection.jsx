import { useEffect, useMemo, useState } from 'react'
import * as agentGrantsApi from '../../api/agentGrants.api'
import * as rolesApi from '../../api/roles.api'

const MAX_DAYS = 30

const STATUS_STYLES = {
  active: 'bg-green-50 text-green-700',
  scheduled: 'bg-sky-50 text-sky-700',
  expired: 'bg-gray-100 text-gray-500',
  revoked: 'bg-red-50 text-red-700',
}

function toDateInput(offsetDays) {
  const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

const EMPTY_FORM = { permission: '', validTo: '', reason: '', limit: '' }

// Gives this agent a high-risk permission for a limited time (spec §2.4), on
// top of what their role allows. It ends by itself on the chosen date, needs a
// reason, and every grant and revoke is recorded in the activity log.
export default function TemporaryPermissionsSection({ agent }) {
  const [catalog, setCatalog] = useState([])
  const [grants, setGrants] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const highRisk = useMemo(() => catalog.filter((p) => p.highRisk), [catalog])
  const selected = highRisk.find((p) => p.key === form.permission)

  function load() {
    return agentGrantsApi.listPermissions(agent._id).then(setGrants)
  }

  useEffect(() => {
    agentGrantsApi.listPermissions(agent._id).then(setGrants)
    rolesApi.list().then((data) => setCatalog(data.catalog))
  }, [agent._id])

  function labelFor(key) {
    return catalog.find((p) => p.key === key)?.label || key
  }

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value, ...(field === 'permission' ? { limit: '' } : {}) }))
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')

    if (!form.permission || !form.validTo || !form.reason.trim()) {
      setError('Choose a permission, an end date and give a reason.')
      return
    }

    setSaving(true)
    try {
      await agentGrantsApi.createPermission(agent._id, {
        permission: form.permission,
        // Valid through the end of the chosen day.
        validTo: new Date(`${form.validTo}T23:59:59`).toISOString(),
        reason: form.reason.trim(),
        constraints:
          selected?.constraint && form.limit !== '' ? { [selected.constraint.field]: Number(form.limit) } : undefined,
      })
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this permission.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRevoke(grantId) {
    setError('')
    try {
      await agentGrantsApi.revokePermission(agent._id, grantId)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not revoke this permission.')
    }
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none'

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Temporary permissions</h2>
      <p className="mb-4 mt-1 text-sm text-gray-500">
        Give this agent a high-risk permission for a limited time, on top of their role. It ends on its own
        (up to {MAX_DAYS} days) and can be revoked at any time.
      </p>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleAdd} className="space-y-3 rounded-lg bg-gray-50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Permission</span>
            <select value={form.permission} onChange={(e) => setField('permission', e.target.value)} className={inputClass}>
              <option value="">Select a permission…</option>
              {highRisk.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Until</span>
            <input
              type="date"
              value={form.validTo}
              min={toDateInput(0)}
              max={toDateInput(MAX_DAYS)}
              onChange={(e) => setField('validTo', e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        {selected?.constraint?.type === 'number' && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">{selected.constraint.label}</span>
            <input
              type="number"
              min="0"
              max="100"
              value={form.limit}
              onChange={(e) => setField('limit', e.target.value)}
              placeholder="Blank for no limit"
              className={inputClass}
            />
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Reason</span>
          <input
            value={form.reason}
            onChange={(e) => setField('reason', e.target.value)}
            placeholder="e.g. Covering for the pricing lead at the trade fair"
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Give temporary access'}
        </button>
      </form>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Permission</th>
              <th className="px-4 py-2 font-medium">Until</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {grants.map((g) => (
              <tr key={g._id}>
                <td className="px-4 py-2">
                  <span className="block text-gray-900">
                    {labelFor(g.permission)}
                    {g.constraints &&
                      Object.entries(g.constraints).map(([field, value]) => (
                        <span key={field} className="ml-2 text-xs text-gray-400">
                          up to {value}%
                        </span>
                      ))}
                  </span>
                  <span className="block text-xs text-gray-400">{g.reason}</span>
                </td>
                <td className="px-4 py-2 text-gray-500">{new Date(g.validTo).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[g.status]}`}>
                    {g.status[0].toUpperCase() + g.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  {(g.status === 'active' || g.status === 'scheduled') && (
                    <button
                      onClick={() => handleRevoke(g._id)}
                      className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {grants.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  No temporary permissions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
