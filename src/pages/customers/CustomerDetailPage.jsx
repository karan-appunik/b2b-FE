import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as customersApi from '../../api/customers.api'
import * as customerGroupsApi from '../../api/customerGroups.api'

const ROLES = [
  { value: 'customer', label: 'Customer', description: 'Can log in and place orders.' },
  {
    value: 'sales_agent',
    label: 'Sales agent',
    description:
      'Can place orders and manage addresses, shopping lists, and company access on behalf of customers.',
  },
  {
    value: 'sales_admin',
    label: 'Sales administrator',
    description: 'All sales agent permissions, plus the ability to edit order prices and create new customers.',
  },
  {
    value: 'external_sales_rep',
    label: 'External Sales Representative',
    description: 'This is a custom role.',
  },
]

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
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function loadAll() {
    Promise.all([customersApi.get(id), customerGroupsApi.list()]).then(([c, groups]) => {
      setCustomer(c)
      setRole(c.role || 'customer')
      const matched = groups.find((g) => !g.isBase && c.tags?.includes(g.shopifyTag))
      setGroup(matched || groups.find((g) => g.isBase) || null)
    })
  }

  useEffect(loadAll, [id])

  async function handleSaveRole() {
    setSaving(true)
    setMessage('')
    try {
      await customersApi.update(id, { role })
      setMessage('Role updated.')
    } finally {
      setSaving(false)
    }
  }

  if (!customer) {
    return <p className="text-gray-500">Loading…</p>
  }

  const shopifyHandle = import.meta.env.VITE_SHOPIFY_SHOP?.replace(/^https?:\/\//, '')
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
          <Row label="Balance">{NONE_SET}</Row>
          <Row label="Credit limit">{NONE_SET}</Row>
          <Row label="Net terms">{NONE_SET}</Row>
          <Row label="Currency">{NONE_SET}</Row>
        </dl>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Role</h2>
        <p className="mb-4 mt-1 text-sm text-gray-500">
          Assign a role to manage permissions for this person.
        </p>
        <div className="space-y-3">
          {ROLES.map((r) => (
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
        <button
          onClick={handleSaveRole}
          disabled={saving}
          className="mt-4 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save role'}
        </button>
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
