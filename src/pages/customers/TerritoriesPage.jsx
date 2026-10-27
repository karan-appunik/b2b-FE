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
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all'

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
      setMessage(`Rule saved successfully. ${result.applied.changed} customer(s) updated.`)
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
    if (!window.confirm(`Delete the rule "${rule.name}"? Customers it placed will lose that territory unless another rule fits.`)) return
    try {
      const result = await api.remove(rule._id)
      setMessage(`Rule deleted. ${result.applied.changed} customer(s) updated.`)
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
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header Card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Territories</h1>
            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 border border-purple-100">
              Geo-Routing
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 max-w-2xl leading-relaxed">
            Automatically assign customers into sales territories by shipping address, postal code, or Shopify customer tags.
            The first matching rule (lowest priority) assigns the territory. Manual territory assignments on customer profiles are never overwritten.
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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600/30 transition-all cursor-pointer shrink-0"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span>New rule</span>
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50/80 p-4 text-sm font-medium text-green-800 shadow-xs animate-in fade-in duration-200">
          <svg className="h-5 w-5 shrink-0 text-green-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm font-medium text-red-800 shadow-xs animate-in fade-in duration-200">
          <svg className="h-5 w-5 shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Form: Create or Edit Rule */}
      {showForm && (
        <form onSubmit={submit} className="rounded-2xl border border-purple-200 bg-purple-50/20 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700 text-xs font-bold">
                {editingId ? '✎' : '+'}
              </span>
              <h2 className="text-base font-bold text-gray-900">
                {editingId ? 'Edit Territory Rule' : 'Create Territory Routing Rule'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1 text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">Rule Name</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Canada Western Region"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">Destination Territory</label>
              <input
                className={inputClass}
                value={form.territory}
                onChange={(e) => set('territory', e.target.value)}
                placeholder="e.g. Canada team or North America"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-700">
                <span>Country Codes (2-letter ISO)</span>
                <span className="text-[11px] font-normal text-gray-400">Comma separated</span>
              </label>
              <input
                className={inputClass}
                value={form.countryCodes}
                onChange={(e) => set('countryCodes', e.target.value)}
                placeholder="CA, US, GB"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-700">
                <span>States / Provinces</span>
                <span className="text-[11px] font-normal text-gray-400">Comma separated</span>
              </label>
              <input
                className={inputClass}
                value={form.provinceCodes}
                onChange={(e) => set('provinceCodes', e.target.value)}
                placeholder="ON, BC, QC or TX, NY"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-700">
                <span>Postal Code Starts With</span>
                <span className="text-[11px] font-normal text-gray-400">Prefixes</span>
              </label>
              <input
                className={inputClass}
                value={form.zipPrefixes}
                onChange={(e) => set('zipPrefixes', e.target.value)}
                placeholder="M5V, 981, K2P"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-700">
                <span>Shopify Customer Tags</span>
                <span className="text-[11px] font-normal text-gray-400">Comma separated</span>
              </label>
              <input
                className={inputClass}
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                placeholder="wholesale-north, enterprise"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-700">
                <span>Priority (Evaluation Order)</span>
                <span className="text-[11px] font-normal text-gray-400">Lower runs first</span>
              </label>
              <input
                type="number"
                className={inputClass}
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                required
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-xs font-semibold text-gray-800 cursor-pointer w-full hover:bg-gray-50/80">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set('active', e.target.checked)}
                  className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Rule is active and evaluated</span>
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-purple-100 bg-white p-3.5 text-xs text-gray-500">
            <span className="font-semibold text-purple-900">Matching Logic: </span>
            Within one field, any value matches (e.g. <code>US</code> or <code>CA</code>). Across different fields, all non-empty fields must match simultaneously (e.g. Country <code>CA</code> AND State <code>ON</code>). Fill at least one criteria.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? 'Saving…' : editingId ? 'Save rule' : 'Create rule'}
            </button>
          </div>
        </form>
      )}

      {/* Rules List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Active Rules ({data.rules.length})
          </h2>
          <span className="text-xs text-gray-500">Evaluated from lowest priority to highest</span>
        </div>

        {data.rules.map((rule) => (
          <div
            key={rule._id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-5 shadow-xs transition-all ${
              rule.active
                ? 'border-gray-200/90 bg-white hover:border-purple-200'
                : 'border-gray-200 bg-gray-50/60 opacity-60'
            }`}
          >
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700 border border-gray-200/60">
                  #{rule.priority}
                </span>
                <span className="font-bold text-gray-900 text-base">{rule.name}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-0.5 text-xs font-semibold text-purple-700 border border-purple-100">
                  <span>→</span>
                  <span>{rule.territory}</span>
                </span>
                {!rule.active && (
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                    Inactive
                  </span>
                )}
              </div>

              {/* Badges for filters */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
                {rule.countryCodes?.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-gray-700 border border-gray-200">
                    <span>🌍</span>
                    <span>Country: <strong>{join(rule.countryCodes)}</strong></span>
                  </span>
                )}
                {rule.provinceCodes?.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-gray-700 border border-gray-200">
                    <span>📍</span>
                    <span>State: <strong>{join(rule.provinceCodes)}</strong></span>
                  </span>
                )}
                {rule.zipPrefixes?.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-gray-700 border border-gray-200">
                    <span>📮</span>
                    <span>Postal: <strong>{join(rule.zipPrefixes)}…</strong></span>
                  </span>
                )}
                {rule.tags?.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-50/50 px-2 py-1 text-purple-700 border border-purple-200/50">
                    <span>🏷️</span>
                    <span>Tag: <strong>{join(rule.tags)}</strong></span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => edit(rule)}
                className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={() => remove(rule)}
                className="rounded-lg border border-red-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {data.rules.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-400">
            <span className="text-3xl block mb-2">🗺️</span>
            <p className="text-sm font-semibold text-gray-700">No territory rules defined yet</p>
            <p className="text-xs text-gray-400 mt-1">Create rules to automatically route accounts to regional sales teams.</p>
          </div>
        )}
      </div>

      {/* Territory Breakdown & Action Overview Card */}
      <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Customer Distribution by Territory</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live count of customers currently assigned to each sales territory.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            <span>Total Assigned:</span>
            <strong className="text-gray-900 font-bold">{totalCustomers}</strong>
          </div>
        </div>

        {territories.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-6 text-center text-xs text-gray-500">
            No customer accounts are assigned to a territory yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {territories.map(([name, count]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50/80 to-white p-4 shadow-2xs hover:border-purple-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700 text-base font-bold">
                    📍
                  </span>
                  <div>
                    <span className="block text-sm font-bold text-gray-900">{name}</span>
                    <span className="text-[11px] text-gray-500">Sales Territory</span>
                  </div>
                </div>
                <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white shadow-2xs">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={runPreview}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
          >
            <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span>Preview changes</span>
          </button>

          <button
            onClick={runApply}
            disabled={runningApply}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 transition-all cursor-pointer"
          >
            {runningApply ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Applying…</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span>Apply rules now</span>
              </>
            )}
          </button>
        </div>

        {/* Preview Results Diff Card */}
        {preview && (
          <div className="rounded-xl border border-purple-200 bg-purple-50/30 p-4 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wide">Preview Dry-Run Results</span>
              <span className="text-xs font-medium text-gray-600">
                {preview.changed === 0
                  ? 'No modifications required'
                  : `${preview.assigned} will be assigned, ${preview.cleared} cleared`}
              </span>
            </div>

            {preview.samples?.length > 0 && (
              <div className="divide-y divide-purple-100 rounded-lg border border-purple-100 bg-white overflow-hidden">
                {preview.samples.map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-3.5 py-2 text-xs">
                    <span className="font-semibold text-gray-900">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">{s.from || 'None'}</span>
                      <span className="text-purple-600 font-bold">→</span>
                      <span className="rounded bg-purple-100 px-2 py-0.5 font-bold text-purple-800">{s.to || 'None'}</span>
                    </div>
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
