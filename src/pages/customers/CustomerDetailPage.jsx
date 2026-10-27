import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as customersApi from '../../api/customers.api'
import * as customerGroupsApi from '../../api/customerGroups.api'
import * as rolesApi from '../../api/roles.api'
import AgentAccessSection from './AgentAccessSection'
import TemporaryPermissionsSection from './TemporaryPermissionsSection'
import AgentSecuritySection from './AgentSecuritySection'
import { isAgentRole } from '../../utils/roles'


const CUSTOMER_ROLE = { value: 'customer', label: 'Customer', description: 'Can log in and place orders.' }

function Row({ label, children }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900">{children}</dd>
    </div>
  )
}

const NONE_SET = <span className="text-gray-400">None set</span>

export default function CustomerDetailPage() {
  const { id } = useParams()
  const [customer, setCustomer] = useState(null)
  const [group, setGroup] = useState(null)
  const [role, setRole] = useState('customer')
  const [roleOptions, setRoleOptions] = useState([CUSTOMER_ROLE])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [territory, setTerritory] = useState('')
  // Who takes over an agent's open work when they stop being an agent.
  const [notes, setNotes] = useState('')
  const [accountStatus, setAccountStatus] = useState('active')
  const [profile, setProfile] = useState({ managerId: '', validFrom: '', validTo: '', locale: '', legalEntities: '' })
  const [entity, setEntity] = useState({ accountCode: '', legalEntity: '', allowedChannels: '' })
  const [otherAgents, setOtherAgents] = useState([])
  const [handoverTo, setHandoverTo] = useState('')
  const [mergeInto, setMergeInto] = useState('')
  const [allCustomers, setAllCustomers] = useState([])
  const [savingTerritory, setSavingTerritory] = useState(false)

  function loadAll() {
    Promise.all([customersApi.get(id), customerGroupsApi.list()]).then(([c, groups]) => {
      setCustomer(c)
      setRole(c.role || 'customer')
      setAccountStatus(c.accountStatus || 'active')
      setNotes(c.internalNotes || '')
      const ap = c.agentProfile || {}
      setProfile({
        managerId: ap.managerId || '',
        validFrom: ap.validFrom ? String(ap.validFrom).slice(0, 10) : '',
        validTo: ap.validTo ? String(ap.validTo).slice(0, 10) : '',
        locale: ap.locale || '',
        legalEntities: (ap.legalEntities || []).join(', '),
      })
      setEntity({ accountCode: c.accountCode || '', legalEntity: c.legalEntity || '', allowedChannels: (c.allowedChannels || []).join(', ') })
      setTerritory(c.territory || '')
      const matched = groups.find((g) => !g.isBase && c.tags?.includes(g.shopifyTag))
      setGroup(matched || groups.find((g) => g.isBase) || null)
    })
  }

  useEffect(loadAll, [id])

  useEffect(() => {
    customersApi.list().then((all) => {
      const list = Array.isArray(all) ? all : all.customers || []
      setOtherAgents(list.filter((c) => isAgentRole(c.role) && c._id !== id))
      setAllCustomers(list.filter((c) => !isAgentRole(c.role) && c._id !== id && (c.accountStatus || 'active') === 'active'))
    })
  }, [id])

  useEffect(() => {
    rolesApi.list().then((data) => {
      setRoleOptions([
        CUSTOMER_ROLE,
        ...data.roles.map((r) => ({ value: r.key, label: r.name, description: r.description })),
      ])
    })
  }, [])

  async function handleSaveRole() {
    setSaving(true)
    setMessage('')
    try {
      const result = await customersApi.update(id, { role, handoverTo: handoverTo || undefined })
      setCustomer((c) => ({ ...c, role }))

      const h = result.handover
      setMessage(
        h
          ? `Role updated. ${h.exceptionsWithdrawn} waiting exception(s) withdrawn; ${h.quotesMoved} of ${h.openQuotes} open quote(s) and ${h.cartsMoved} of ${h.savedCarts} saved cart(s) handed over${h.handedTo ? ` to ${h.handedTo}` : ''}.`
          : 'Role updated.',
      )
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not update the role.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProfile() {
    setMessage('')
    try {
      await customersApi.update(id, { agentProfile: profile })
      setMessage('Agent profile saved.')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not save the agent profile.')
    }
  }

  async function handleSaveEntity() {
    setMessage('')
    try {
      await customersApi.update(id, entity)
      setMessage('Legal entity and channels saved. Any agent now working on this account is checked again.')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not save.')
    }
  }

  async function handleSaveNotes() {
    setMessage('')
    try {
      await customersApi.update(id, { internalNotes: notes })
      setMessage('Notes saved.')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not save the notes.')
    }
  }

  async function handleSaveStatus() {
    setMessage('')
    // Merging moves what can move and closes the rest, so it is its own step.
    if (accountStatus === 'merged' && customer.accountStatus !== 'merged') {
      if (!mergeInto) {
        setMessage('Choose the account this one is merged into.')
        return
      }
      if (!window.confirm('Merge this account into the one you chose? Open quotes, carts and exceptions on it are closed, and its agents are told. This cannot be undone.')) return
      try {
        const r = await customersApi.merge(id, mergeInto)
        setCustomer((c) => ({ ...c, accountStatus: 'merged' }))
        setMessage(`Merged. ${r.quotesWithdrawn} quote(s), ${r.exceptionsCancelled} exception(s), ${r.cartsClosed} cart(s) and ${r.paymentLinksWithdrawn} payment link(s) closed; ${r.listsMoved} list(s) moved.`)
      } catch (err) {
        setMessage(err.response?.data?.message || 'Could not merge the account.')
      }
      return
    }
    try {
      await customersApi.update(id, { accountStatus })
      setCustomer((c) => ({ ...c, accountStatus }))
      setMessage(accountStatus === 'active' ? 'Account is active.' : 'Account saved. Any agent now ordering for it was taken out.')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not update the account status.')
    }
  }

  async function handleSaveTerritory() {
    setSavingTerritory(true)
    setMessage('')
    try {
      const updated = await customersApi.update(id, { territory: territory.trim() })
      setCustomer((c) => ({ ...c, territory: updated.territory }))
      setMessage('Territory updated.')
    } finally {
      setSavingTerritory(false)
    }
  }

  if (!customer) {
    return <p className="text-gray-500">Loading…</p>
  }

  const shopifyHandle = customer.shop?.replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .replace(/\.myshopify\.com$/, '')
  const shopifyNumericId = customer.shopifyCustomerId?.split('/').pop()
  const shopifyCustomerUrl =
    shopifyHandle && shopifyNumericId
      ? `https://admin.shopify.com/store/${shopifyHandle}/customers/${shopifyNumericId}`
      : null

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/customers"
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">{customer.name}</h1>
        </div>
        {shopifyCustomerUrl && (
          <a
            href={shopifyCustomerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M12.5 3a.75.75 0 000 1.5h2.19l-6.72 6.72a.75.75 0 101.06 1.06l6.72-6.72v2.19a.75.75 0 001.5 0v-4a.75.75 0 00-.75-.75h-4z" />
              <path d="M5.5 5a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-3.5a.75.75 0 011.5 0V15a2.5 2.5 0 01-2.5 2.5h-9A2.5 2.5 0 013 15V6a2.5 2.5 0 012.5-2.5H10a.75.75 0 010 1.5H5.5z" />
            </svg>
            View in Shopify
          </a>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500">This information is pulled from your connected platform.</p>

      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic information</h2>
        <dl className="space-y-3 text-sm">
          <Row label="Email">{customer.email}</Row>
          <Row label="Company">{customer.company || NONE_SET}</Row>
          <Row label="Customer Group">{group?.name || 'Base'}</Row>
          <Row label="Price list overwrites">
            {customer.priceList ? (
              <Link to={`/price-lists/${customer.priceList._id}`} className="text-purple-600 hover:underline">
                {customer.priceList.name}
              </Link>
            ) : (
              NONE_SET
            )}
          </Row>
          <Row label="Sales Agent Groups">{NONE_SET}</Row>
        </dl>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Financial details</h2>
        <dl className="space-y-3 text-sm">
          <Row label="Discount percentage">{NONE_SET}</Row>
          <Row label="Accounting ID">{NONE_SET}</Row>
        </dl>
        <h3 className="mb-3 mt-5 text-sm font-semibold text-gray-900">Payment on account</h3>
        <dl className="space-y-3 text-sm">
          <Row label="Balance">{customer.creditBalance || 0}</Row>
          <Row label="Credit limit">
            {customer.creditLimit != null ? customer.creditLimit : NONE_SET}
          </Row>
          <Row label="Net terms">{NONE_SET}</Row>
          <Row label="Currency">{NONE_SET}</Row>
        </dl>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Internal notes</h2>
        <p className="mb-3 mt-1 text-sm text-gray-500">
          What the team knows about this customer. The customer never sees it. Only sales roles with the "See internal notes" right can read it.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          onClick={handleSaveNotes}
          className="mt-3 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Save notes
        </button>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Customer code, legal entity and channels</h2>
        <p className="mb-3 mt-1 text-sm text-gray-500">
          An agent who sells for certain legal entities can only act for customers of those entities. Leave channels empty to allow every channel.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Customer code (your account number)</span>
            <input type="text" value={entity.accountCode} onChange={(e) => setEntity((x) => ({ ...x, accountCode: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Legal entity</span>
            <input type="text" value={entity.legalEntity} onChange={(e) => setEntity((x) => ({ ...x, legalEntity: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Allowed channels (comma separated)</span>
            <input type="text" value={entity.allowedChannels} onChange={(e) => setEntity((x) => ({ ...x, allowedChannels: e.target.value }))} placeholder="b2b_web" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>
        </div>
        <button onClick={handleSaveEntity} className="mt-3 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
          Save
        </button>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Account status</h2>
        <p className="mb-3 mt-1 text-sm text-gray-500">
          A suspended or merged account can't be ordered for by an agent, and any agent working on it is taken out at once.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={accountStatus}
            onChange={(e) => setAccountStatus(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="merged">Merged into another account</option>
          </select>
          {accountStatus === 'merged' && customer.accountStatus !== 'merged' && (
            <select
              value={mergeInto}
              onChange={(e) => setMergeInto(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Merge into…</option>
              {allCustomers.map((c) => (
                <option key={c._id} value={c._id}>{c.company || c.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleSaveStatus}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Save status
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Role</h2>
        <p className="mb-4 mt-1 text-sm text-gray-500">
          Assign a role to manage permissions for this person.
        </p>
        <div className="space-y-3">
          {roleOptions.map((r) => (
            <label key={r.value} className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="mt-0.5 h-4 w-4 text-purple-600 focus:ring-purple-500"
              />
              <span>
                <span className="block font-medium text-gray-900">{r.label}</span>
                <span className="block text-xs text-gray-500">{r.description}</span>
              </span>
            </label>
          ))}
        </div>
        {isAgentRole(customer.role) && role === 'customer' && (
          <label className="mt-4 block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Hand this agent&apos;s open work to</span>
            <select
              value={handoverTo}
              onChange={(e) => setHandoverTo(e.target.value)}
              className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">No one yet (managers are told what is left)</option>
              {otherAgents.map((a) => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-gray-500">
              Open quotes and saved carts move to this person. Waiting price exceptions are withdrawn.
            </span>
          </label>
        )}
        <button
          onClick={handleSaveRole}
          disabled={saving}
          className="mt-4 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save role'}
        </button>
      </section>

      {isAgentRole(customer.role) && (
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Agent profile</h2>
          <p className="mb-4 mt-1 text-sm text-gray-500">
            Who manages this agent, the dates they may work between, and their language. Outside those dates they can't work.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700">Manager</span>
              <select
                value={profile.managerId}
                onChange={(e) => setProfile((x) => ({ ...x, managerId: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">No manager</option>
                {otherAgents.map((a) => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700">Language (e.g. en, en-GB)</span>
              <input
                type="text"
                value={profile.locale}
                onChange={(e) => setProfile((x) => ({ ...x, locale: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-gray-700">Legal entities they sell for (comma separated, empty = all)</span>
              <input
                type="text"
                value={profile.legalEntities}
                onChange={(e) => setProfile((x) => ({ ...x, legalEntities: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700">Can work from</span>
              <input
                type="date"
                value={profile.validFrom}
                onChange={(e) => setProfile((x) => ({ ...x, validFrom: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700">Can work until</span>
              <input
                type="date"
                value={profile.validTo}
                onChange={(e) => setProfile((x) => ({ ...x, validTo: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button
            onClick={handleSaveProfile}
            className="mt-4 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Save agent profile
          </button>
        </section>
      )}

      {isAgentRole(customer.role) && <AgentAccessSection agent={customer} />}
      {isAgentRole(customer.role) && <TemporaryPermissionsSection agent={customer} />}
      {isAgentRole(customer.role) && <AgentSecuritySection agent={customer} />}

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Sales territory</h2>
        <p className="mb-4 mt-1 text-sm text-gray-500">
          Agents can be given access to every customer in a territory.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={territory}
            onChange={(e) => setTerritory(e.target.value)}
            placeholder="e.g. North"
            className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={handleSaveTerritory}
            disabled={savingTerritory}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {savingTerritory ? 'Saving…' : 'Save territory'}
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Addresses</h2>
        <dl className="space-y-3 text-sm">
          <Row label="Default shipping address">{NONE_SET}</Row>
          <Row label="Default billing address">{NONE_SET}</Row>
        </dl>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Identifiers</h2>
        <dl className="space-y-3 text-sm">
          <Row label="Shopify Customer ID">{customer.shopifyCustomerId || NONE_SET}</Row>
          <Row label="Internal ID">{customer._id}</Row>
        </dl>
      </section>
    </div>
  )
}
