import { useEffect, useMemo, useState } from 'react'
import * as agentGrantsApi from '../../api/agentGrants.api'
import * as customersApi from '../../api/customers.api'
import * as customerGroupsApi from '../../api/customerGroups.api'
import * as rolesApi from '../../api/roles.api'
import { hasGlobalScope } from '../../utils/roles'

const SCOPE_LABELS = { customer: 'Customer', group: 'Customer group', territory: 'Territory' }

const EMPTY_FORM = {
  scopeType: 'customer',
  scopeId: '',
  effect: 'allow',
  validFrom: '',
  validTo: '',
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : null
}

function grantStatus(grant) {
  const now = Date.now()
  if (grant.validFrom && new Date(grant.validFrom).getTime() > now) return 'Scheduled'
  if (grant.validTo && new Date(grant.validTo).getTime() <= now) return 'Expired'
  return 'Active'
}

export default function AgentAccessSection({ agent }) {
  const [grants, setGrants] = useState([])
  const [customers, setCustomers] = useState([])
  const [groups, setGroups] = useState([])
  const [roles, setRoles] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)

  // Whether this agent's role lets them act for every customer.
  const isGlobalRole = hasGlobalScope(roles, agent.role)

  function loadGrants() {
    agentGrantsApi.list(agent._id).then(setGrants)
  }

  useEffect(() => {
    agentGrantsApi.list(agent._id).then(setGrants)
    customersApi.list().then(setCustomers)
    customerGroupsApi.list().then(setGroups)
    rolesApi.list().then((data) => setRoles(data.roles))
  }, [agent._id])

  const targetCustomers = useMemo(
    () => customers.filter((c) => c._id !== agent._id && c.shopifyCustomerId),
    [customers, agent._id],
  )

  function targetName(grant) {
    if (grant.scopeType === 'all') return 'All customers'
    if (grant.scopeType === 'territory') return grant.scopeId
    if (grant.scopeType === 'customer') {
      const c = customers.find((x) => x._id === grant.scopeId)
      return c ? `${c.name}${c.company ? ` (${c.company})` : ''}` : 'Unknown customer'
    }
    return groups.find((g) => g._id === grant.scopeId)?.name || 'Unknown group'
  }

  function setField(field, value) {
    setPreview(null)
    setForm((f) => ({ ...f, [field]: value, ...(field === 'scopeType' ? { scopeId: '' } : {}) }))
  }

  // Shows what the rule would do before it is saved.
  async function handlePreview() {
    setError('')
    if (!form.scopeId.trim()) {
      setError('Choose who this applies to.')
      return
    }
    try {
      setPreview(
        await agentGrantsApi.preview(agent._id, {
          scopeType: form.scopeType,
          scopeId: form.scopeId,
          effect: form.effect,
          validFrom: form.validFrom || undefined,
          validTo: form.validTo || undefined,
        }),
      )
    } catch (err) {
      setPreview(null)
      setError(err.response?.data?.message || 'Could not check this rule.')
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')

    if (!form.scopeId.trim()) {
      setError('Choose who this applies to.')
      return
    }

    setSaving(true)
    try {
      await agentGrantsApi.create(agent._id, {
        scopeType: form.scopeType,
        scopeId: form.scopeId,
        effect: form.effect,
        validFrom: form.validFrom || undefined,
        validTo: form.validTo || undefined,
      })
      setForm(EMPTY_FORM)
      setPreview(null)
      loadGrants()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this rule.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(grantId) {
    setError('')
    try {
      await agentGrantsApi.remove(agent._id, grantId)
      loadGrants()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove this rule.')
    }
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none'

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Customer access</h2>
      <p className="mb-4 mt-1 text-sm text-gray-500">
        Choose which customers this agent can place orders for. With no rules, an agent cannot act for
        anyone. A deny rule always wins over an allow rule.
      </p>

      {isGlobalRole && (
        <p className="mb-4 rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-700">
          This agent's role can act for every customer. Add a deny rule below to exclude someone.
        </p>
      )}

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleAdd} className="space-y-3 rounded-lg bg-gray-50 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Applies to</span>
            <select
              value={form.scopeType}
              onChange={(e) => setField('scopeType', e.target.value)}
              className={inputClass}
            >
              {Object.entries(SCOPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-gray-700">{SCOPE_LABELS[form.scopeType]}</span>
            {form.scopeType === 'customer' && (
              <select value={form.scopeId} onChange={(e) => setField('scopeId', e.target.value)} className={inputClass}>
                <option value="">Select a customer…</option>
                {targetCustomers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} — {c.email}
                  </option>
                ))}
              </select>
            )}
            {form.scopeType === 'group' && (
              <select value={form.scopeId} onChange={(e) => setField('scopeId', e.target.value)} className={inputClass}>
                <option value="">Select a customer group…</option>
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
            {form.scopeType === 'territory' && (
              <input
                type="text"
                value={form.scopeId}
                onChange={(e) => setField('scopeId', e.target.value)}
                placeholder="e.g. North"
                className={inputClass}
              />
            )}
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Rule</span>
            <select value={form.effect} onChange={(e) => setField('effect', e.target.value)} className={inputClass}>
              <option value="allow">Allow</option>
              <option value="deny">Deny</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Starts (optional)</span>
            <input type="date" value={form.validFrom} onChange={(e) => setField('validFrom', e.target.value)} className={inputClass} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Ends (optional)</span>
            <input type="date" value={form.validTo} onChange={(e) => setField('validTo', e.target.value)} className={inputClass} />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add rule'}
        </button>
        <button
          type="button"
          onClick={handlePreview}
          className="ml-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Check what this does
        </button>

        {preview && (
          <output className="block rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700">
            <p>
              This rule covers <strong>{preview.customersCovered}</strong> customer(s)
              {preview.sample.length > 0 && <span className="text-gray-500"> ({preview.sample.join(', ')}{preview.customersCovered > preview.sample.length ? ', …' : ''})</span>}.
            </p>
            {form.effect === 'allow' ? (
              <p className="mt-1">
                {preview.willBeAdded} would be new for this agent
                {preview.alreadyReached > 0 && `, ${preview.alreadyReached} they can already reach`}
                {preview.blockedByDeny > 0 && `, ${preview.blockedByDeny} stay blocked by a deny rule`}.
              </p>
            ) : (
              <p className="mt-1">{preview.willBeRemoved} customer(s) they can reach now would be taken away.</p>
            )}
            {preview.conflicts.filter((c) => c.code !== 'REMOVES_ACCESS').length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {preview.conflicts.filter((c) => c.code !== 'REMOVES_ACCESS').map((c, i) => (
                  <li key={i} className={c.info ? 'text-gray-600' : 'text-amber-800'}>{c.message}</li>
                ))}
              </ul>
            )}
          </output>
        )}
      </form>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Applies to</th>
              <th className="px-4 py-2 font-medium">Rule</th>
              <th className="px-4 py-2 font-medium">Dates</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {grants.map((g) => (
              <tr key={g._id}>
                <td className="px-4 py-2">
                  <span className="block text-gray-900">{targetName(g)}</span>
                  <span className="block text-xs text-gray-400">{SCOPE_LABELS[g.scopeType] || 'All'}</span>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      g.effect === 'deny' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                    }`}
                  >
                    {g.effect === 'deny' ? 'Deny' : 'Allow'}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {formatDate(g.validFrom) || 'Any time'} → {formatDate(g.validTo) || 'No end'}
                </td>
                <td className="px-4 py-2 text-gray-500">{grantStatus(g)}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleRemove(g._id)}
                    className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {grants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No rules yet — this agent cannot act for any customer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
