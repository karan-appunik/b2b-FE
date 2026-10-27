import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as rolesApi from '../../api/roles.api'

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Saved permissions -> the editor's { key: { effect: 'none' | 'allow' | 'deny', value } } map.
function toDraft(role, catalog) {
  const draft = {}
  for (const item of catalog) {
    const saved = role?.permissions?.find((p) => p.key === item.key)
    const value = saved?.constraints && item.constraint ? saved.constraints[item.constraint.field] ?? '' : ''
    draft[item.key] = { effect: saved ? saved.effect : 'none', value }
  }
  return draft
}

function toPermissions(draft, catalog) {
  return catalog
    .filter((item) => draft[item.key].effect !== 'none')
    .map((item) => {
      const { effect, value } = draft[item.key]
      const entry = { key: item.key, effect }
      if (effect === 'allow' && item.constraint && value !== '') {
        entry.constraints = { [item.constraint.field]: value }
      }
      return entry
    })
}

// What each choice in a permission's dropdown is called.
const OPTION_LABELS = {
  all: 'Every customer',
  own: 'Only customers assigned to them',
  direct: 'Place orders directly',
  approval_first: 'A manager must approve each order first',
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none'

export default function RoleEditorPage() {
  const { key } = useParams()
  const navigate = useNavigate()
  const isNew = !key

  const [catalog, setCatalog] = useState([])
  const [roles, setRoles] = useState([])
  const [ready, setReady] = useState(false)
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [handleEdited, setHandleEdited] = useState(false)
  const [inheritsFrom, setInheritsFrom] = useState('')
  const [requireMfa, setRequireMfa] = useState(false)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const current = useMemo(() => roles.find((r) => r.key === key) || null, [roles, key])
  const groups = useMemo(() => [...new Set(catalog.map((c) => c.group))], [catalog])

  useEffect(() => {
    rolesApi.list().then((data) => {
      setCatalog(data.catalog)
      setRoles(data.roles)

      const role = data.roles.find((r) => r.key === key)
      if (role) {
        setName(role.name)
        setHandle(role.key)
        setInheritsFrom(role.inheritsFrom || '')
        setRequireMfa(!!role.requireMfa)
      }
      setDraft(toDraft(role, data.catalog))
      setReady(true)
    })
  }, [key])

  function changeName(value) {
    setName(value)
    if (isNew && !handleEdited) setHandle(slugify(value))
  }

  function setEffect(permissionKey, effect) {
    setDraft((d) => ({ ...d, [permissionKey]: { ...d[permissionKey], effect } }))
  }

  function setValue(permissionKey, value) {
    setDraft((d) => ({ ...d, [permissionKey]: { ...d[permissionKey], value } }))
  }

  // What the chosen parent (and its parents) already grants or denies — shown
  // on rows this role doesn't set itself.
  function inheritedEffect(permissionKey) {
    let parentKey = inheritsFrom
    for (let depth = 0; parentKey && depth < 6; depth++) {
      const parent = roles.find((r) => r.key === parentKey)
      if (!parent) return null
      const entry = parent.permissions.find((p) => p.key === permissionKey)
      if (entry) return entry.effect
      parentKey = parent.inheritsFrom
    }
    return null
  }

  async function handleSave() {
    setError('')

    if (!name.trim()) {
      setError('Give the role a name.')
      return
    }

    setSaving(true)
    try {
      const body = {
        name,
        inheritsFrom: inheritsFrom || null,
        requireMfa,
        permissions: toPermissions(draft, catalog),
      }

      // Show who a change reaches before it is saved (spec §4.1 "affected-user preview").
      if (!isNew) {
        const affected = await rolesApi.members(key)
        if (affected.people.length || affected.inheritingRoles.length) {
          const names = affected.people.slice(0, 10).map((p) => p.name).join(', ')
          const more = affected.people.length > 10 ? ` and ${affected.people.length - 10} more` : ''
          const roleNames = affected.inheritingRoles.map((r) => r.name).join(', ')
          const lines = [
            `This change takes effect immediately for ${affected.people.length} ${
              affected.people.length === 1 ? 'person' : 'people'
            }${names ? `: ${names}${more}` : ''}.`,
          ]
          if (roleNames) lines.push(`Roles that inherit from it will change too: ${roleNames}.`)
          lines.push('Continue?')

          if (!confirm(lines.join('\n\n'))) {
            setSaving(false)
            return
          }
        }
        await rolesApi.update(key, body)
      } else {
        await rolesApi.create({ ...body, key: handle })
      }

      navigate('/customers/roles')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this role.')
      setSaving(false)
    }
  }

  if (!ready) return <p className="text-gray-500">Loading…</p>

  if (!isNew && !current) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <p className="text-gray-500">This role no longer exists.</p>
        <Link to="/customers/roles" className="text-purple-600 hover:underline">
          Back to roles
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-center gap-2">
        <Link
          to="/customers/roles"
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
          aria-label="Back to roles"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">{isNew ? 'Create role' : 'Edit role'}</h1>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {isNew
          ? 'This appears as an option when assigning roles to your sales team.'
          : `Version ${current.version} — every save is recorded in the activity log and takes effect on the person's next action.`}
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Role details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Name</span>
            <input
              value={name}
              onChange={(e) => changeName(e.target.value)}
              placeholder="e.g. Rep on the road"
              className={inputClass}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Handle (or ID)</span>
            <input
              value={handle}
              onChange={(e) => {
                setHandle(e.target.value)
                setHandleEdited(true)
              }}
              disabled={!isNew}
              placeholder="e.g. rep-on-the-road"
              className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-500`}
            />
          </label>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900">Permissions</h2>
        <p className="mb-4 mt-1 text-sm text-gray-500">Customise access levels for this role.</p>

        {groups.map((group) => (
          <div key={group} className="mb-5">
            <h3 className="mb-3 text-sm font-medium text-gray-700">{group}</h3>
            <div className="space-y-3">
              {catalog
                .filter((item) => item.group === group)
                .map((item) => {
                  const entry = draft[item.key] || { effect: 'none', value: '' }
                  const inherited = entry.effect === 'none' ? inheritedEffect(item.key) : null

                  return (
                    <div key={item.key}>
                      <label className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={entry.effect === 'allow'}
                          disabled={entry.effect === 'deny'}
                          onChange={(e) => setEffect(item.key, e.target.checked ? 'allow' : 'none')}
                          className="mt-0.5 h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span>
                          <span className="block font-medium text-gray-900">
                            {item.label}
                            {entry.effect === 'deny' && (
                              <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                                Always denied
                              </span>
                            )}
                            {inherited && (
                              <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                                Inherited: {inherited === 'deny' ? 'denied' : 'allowed'}
                              </span>
                            )}
                          </span>
                          <span className="block text-xs text-gray-500">{item.description}</span>
                        </span>
                      </label>

                      {entry.effect === 'allow' && item.constraint?.type === 'select' && (
                        <div className="ml-6 mt-2">
                          <select
                            value={entry.value || item.constraint.default}
                            onChange={(e) => setValue(item.key, e.target.value)}
                            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                          >
                            {item.constraint.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {OPTION_LABELS[opt] || opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {entry.effect === 'allow' && item.constraint?.type === 'number' && (
                        <div className="ml-6 mt-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={entry.value}
                            onChange={(e) => setValue(item.key, e.target.value)}
                            placeholder={`${item.constraint.label} — blank for no limit`}
                            className="w-72 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        ))}

        <details className="mt-2 rounded-lg border border-gray-200 p-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-800">Advanced</summary>

          <label className="mt-4 block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Inherits permissions from</span>
            <select value={inheritsFrom} onChange={(e) => setInheritsFrom(e.target.value)} className={inputClass}>
              <option value="">Nothing — start from no permissions</option>
              {roles
                .filter((r) => r.key !== key)
                .map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.name}
                  </option>
                ))}
            </select>
            <span className="mt-1 block text-xs text-gray-400">
              This role gets everything the chosen role has. Anything set above overrides it.
            </span>
          </label>

          <label className="mt-4 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={requireMfa}
              onChange={(e) => setRequireMfa(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
            />
            <span>
              <span className="block font-medium text-gray-900">Require an authenticator app code</span>
              <span className="block text-xs text-gray-500">
                People with this role must enter a 6-digit code before they can act for a customer, and again
                before high-risk actions such as price overrides.
              </span>
            </span>
          </label>

          <div className="mt-4">
            <span className="mb-1 block text-sm font-medium text-gray-700">Always deny</span>
            <span className="mb-2 block text-xs text-gray-400">
              A denied permission is refused even if it is allowed here or inherited.
            </span>
            <div className="grid gap-1 sm:grid-cols-2">
              {catalog.map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={(draft[item.key]?.effect || 'none') === 'deny'}
                    onChange={(e) => setEffect(item.key, e.target.checked ? 'deny' : 'none')}
                    className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        </details>
      </section>

      <div className="mt-6 flex justify-end gap-2">
        <Link
          to="/customers/roles"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
