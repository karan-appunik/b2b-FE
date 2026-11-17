import { useEffect, useState } from 'react'
import * as api from '../../api/territories.api'

const EMPTY = {
  name: '',
  territory: '',
  countryCodes: '',
  provinceCodes: '',
  zipPrefixes: '',
  tags: '',
  priority: '100',
  active: true,
}

const split = (text) => text.split(',').map((t) => t.trim()).filter(Boolean)
const join = (list) => (list || []).join(', ')

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 transition-all'

export default function TerritoriesPage() {
  const [data, setData] = useState({ rules: [], customersByTerritory: {} })
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [runningApply, setRunningApply] = useState(false)

  function load() {
    return api.list().then(setData)
  }

  useEffect(() => {
    api.list().then(setData)
  }, [])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function edit(rule) {
    setEditingId(rule._id)
    setForm({
      name: rule.name,
      territory: rule.territory,
      countryCodes: join(rule.countryCodes),
      provinceCodes: join(rule.provinceCodes),
      zipPrefixes: join(rule.zipPrefixes),
      tags: join(rule.tags),
      priority: String(rule.priority),
      active: rule.active,
    })
    setShowForm(true)
    setError('')
    setMessage('')
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const payload = {
      name: form.name,
      territory: form.territory,
      countryCodes: split(form.countryCodes),
      provinceCodes: split(form.provinceCodes),
      zipPrefixes: split(form.zipPrefixes),
      tags: split(form.tags),
      priority: form.priority,
      active: form.active,
    }

    try {
      const result = editingId ? await api.update(editingId, payload) : await api.create(payload)
      setMessage(`Rule saved successfully. ${result.applied?.changed ?? 0} customer(s) updated.`)
      setShowForm(false)
      setEditingId(null)
      setForm(EMPTY)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the territory rule.')
    } finally {
      setLoading(false)
    }
  }

  async function remove(rule) {
    if (!window.confirm(`Delete the rule "${rule.name}"?`)) return
    try {
      const result = await api.remove(rule._id)
      setMessage(`Rule deleted. ${result.applied?.changed ?? 0} customer(s) updated.`)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the rule.')
    }
  }

  async function runPreview() {
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const res = await api.apply(true)
      setPreview(res)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not preview changes.')
    } finally {
      setLoading(false)
    }
  }

  async function runApply() {
    setError('')
    setRunningApply(true)
    try {
      const result = await api.apply(false)
      setPreview(null)
      setMessage(`Rules applied: ${result.assigned} assigned, ${result.cleared} cleared.`)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not apply rules.')
    } finally {
      setRunningApply(false)
    }
  }

  const territories = Object.entries(data.customersByTerritory || {})
  const totalCustomers = territories.reduce((acc, [, count]) => acc + (Number(count) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-gray-900">Territories</h1>
            <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-100">
              Geo-Routing
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Automatically assign customers to sales territories based on their country, state, postal code, or Shopify customer tags.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(true)
            setEditingId(null)
            setForm(EMPTY)
            setError('')
            setMessage('')
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 transition-colors cursor-pointer shrink-0"
        >
          <span>+ Add Rule</span>
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-800">
          <span>✓</span>
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Form: Create or Edit Rule */}
      {showForm && (
        <form onSubmit={submit} className="rounded-xl border border-purple-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900">
              {editingId ? 'Edit Rule' : 'New Territory Rule'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Rule Name *</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Canada"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Assign To Territory *</label>
              <input
                className={inputClass}
                value={form.territory}
                onChange={(e) => set('territory', e.target.value)}
                placeholder="e.g. Canada team"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Country Codes <span className="font-normal text-gray-400">(2-letter, e.g. CA, US)</span>
              </label>
              <input
                className={inputClass}
                value={form.countryCodes}
                onChange={(e) => set('countryCodes', e.target.value.toUpperCase())}
                placeholder="CA, US"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                States / Provinces <span className="font-normal text-gray-400">(e.g. ON, BC)</span>
              </label>
              <input
                className={inputClass}
                value={form.provinceCodes}
                onChange={(e) => set('provinceCodes', e.target.value.toUpperCase())}
                placeholder="ON, BC"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Postal Code Starts With <span className="font-normal text-gray-400">(e.g. M5V)</span>
              </label>
              <input
                className={inputClass}
                value={form.zipPrefixes}
                onChange={(e) => set('zipPrefixes', e.target.value.toUpperCase())}
                placeholder="M5V, K2P"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Customer Tags <span className="font-normal text-gray-400">(e.g. wholesale)</span>
              </label>
              <input
                className={inputClass}
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                placeholder="wholesale, enterprise"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Order / Priority <span className="font-normal text-gray-400">(Lower runs first, e.g. 100)</span>
              </label>
              <input
                type="number"
                className={inputClass}
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                required
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-700 cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set('active', e.target.checked)}
                  className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Active Rule</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving…' : editingId ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Rules Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Active Rules ({data.rules.length})
          </h2>
          <span className="text-[11px] text-gray-500">Evaluated from top to bottom (by order)</span>
        </div>

        {data.rules.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            No territory rules created yet. Click "+ Add Rule" above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 bg-gray-50/30 text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Rule Name</th>
                  <th className="px-5 py-3 font-semibold">Conditions (When Customer Is In)</th>
                  <th className="px-5 py-3 font-semibold">Assigned Territory</th>
                  <th className="px-5 py-3 font-semibold text-center">Customers</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {data.rules.map((rule) => {
                  const count = data.customersByTerritory?.[rule.territory] || 0
                  return (
                    <tr key={rule._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700">
                          #{rule.priority}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-bold text-gray-900">{rule.name}</span>
                        {!rule.active && (
                          <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {rule.countryCodes?.length > 0 && (
                            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800 border border-blue-100">
                              Country: {join(rule.countryCodes)}
                            </span>
                          )}
                          {rule.provinceCodes?.length > 0 && (
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                              State: {join(rule.provinceCodes)}
                            </span>
                          )}
                          {rule.zipPrefixes?.length > 0 && (
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                              Zip: {join(rule.zipPrefixes)}…
                            </span>
                          )}
                          {rule.tags?.length > 0 && (
                            <span className="rounded bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                              Tag: {join(rule.tags)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 font-bold text-purple-700">
                          <span>📍</span>
                          <span>{rule.territory}</span>
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-800">
                          {count}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => edit(rule)}
                            className="rounded px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => remove(rule)}
                            className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Distribution by Territory */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Territories & Customer Counts</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Customers currently placed in each sales territory.
            </p>
          </div>
          <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
            Total Assigned: {totalCustomers}
          </span>
        </div>

        {territories.length === 0 ? (
          <p className="text-xs text-gray-500">No customers assigned to any territory yet.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5">
            {territories.map(([name, count]) => (
              <div
                key={name}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs"
              >
                <span className="text-purple-600">📍</span>
                <span className="font-bold text-gray-900">{name}</span>
                <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <button
            onClick={runPreview}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Preview changes
          </button>
          <button
            onClick={runApply}
            disabled={runningApply}
            className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {runningApply ? 'Applying…' : 'Apply rules now'}
          </button>
        </div>

        {/* Preview Results */}
        {preview && (
          <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-purple-900">
              <span>Preview Dry-Run Results</span>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-600">
              {preview.changed === 0
                ? 'No changes needed. All customers already match their territory.'
                : `${preview.assigned} will be assigned, ${preview.cleared} cleared.`}
            </p>
            {preview.samples?.length > 0 && (
              <div className="divide-y divide-gray-100 rounded border border-gray-200 bg-white text-xs">
                {preview.samples.map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2">
                    <span className="font-semibold text-gray-900">{s.name}</span>
                    <span className="text-gray-500">
                      {s.from || 'None'} → <strong className="text-purple-700">{s.to || 'Cleared'}</strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
