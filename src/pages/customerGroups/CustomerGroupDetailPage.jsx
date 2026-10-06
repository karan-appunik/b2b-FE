import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as customerGroupsApi from '../../api/customerGroups.api'
import * as priceListsApi from '../../api/priceLists.api'
import {
  PriceListsSection,
  PaymentMethodsSection,
  StockDisplaySection,
  OrderQuantityLimitsSection,
  OrderTotalLimitsSection,
  AddressManagementSection,
  QuotingEngineSection,
  CreditSettingsSection,
  CheckoutAccessSection,
  RuleIcon,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_ORDER_LIMITS,
  DEFAULT_STOCK_DISPLAY,
  DEFAULT_ADDRESS_MANAGEMENT,
  DEFAULT_CREDIT_SETTINGS,
  DEFAULT_CHECKOUT_ACCESS,
} from './GroupSettingsFields'

function MoreActionsMenu({ onViewCustomers, onDelete, canDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
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
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => {
              setOpen(false)
              onViewCustomers()
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a5 5 0 100-10 5 5 0 000 10z" />
              <path
                fillRule="evenodd"
                d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            View tagged customers
          </button>
          {canDelete && (
            <button
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482 41.03 41.03 0 00-2.365-.298V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                  clipRule="evenodd"
                />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const NAV_LINKS = [
  ['price-lists', 'Price lists'],
  ['payment-methods', 'Payment methods'],
  ['order-quantity-limits', 'Order quantity limits'],
  ['order-total-limits', 'Order total limits'],
  ['stock-display', 'Stock display'],
]

const COLLAPSIBLE_SECTION_IDS = new Set([
  'order-quantity-limits',
  'order-total-limits',
  'address-management',
  'credit-settings',
  'quoting-engine',
  'checkout-access',
])

function formatLimitRange(limit) {
  if (!limit || (limit.min == null && limit.max == null)) return null
  if (limit.min != null && limit.max != null) return `${limit.min} – ${limit.max}`
  if (limit.min != null) return `Min ${limit.min}`
  return `Max ${limit.max}`
}

function formatTotalLimits(rows) {
  if (!rows?.length) return null
  return rows
    .map((row) => `${row.currency} ${formatLimitRange(row) || 'no limit'}`)
    .join(', ')
}

function formatAddressManagement(addressManagement) {
  if (!addressManagement) return 'Customers can edit their addresses'
  const disabled = []
  if (!addressManagement.allowAddressEditing) disabled.push('address editing')
  if (!addressManagement.allowBillingAddress) disabled.push('billing addresses')
  return disabled.length ? `Editing disabled: ${disabled.join(', ')}` : 'Customers can edit their addresses'
}

function getInheritedRules(group) {
  const orderLimits = group?.orderLimits
  const creditSettings = group?.creditSettings
  const checkoutAccess = group?.checkoutAccess
  return [
    [
      'cube',
      'Order quantity limits',
      formatLimitRange(orderLimits?.quantity) || 'No quantity limits set',
      'order-quantity-limits',
    ],
    [
      'bag',
      'Order total limits',
      formatTotalLimits(orderLimits?.total) || 'No total limits set',
      'order-total-limits',
    ],
    [
      'archive',
      'Address management',
      formatAddressManagement(group?.addressManagement),
      'address-management',
    ],
    [
      'lock',
      'Credit settings',
      creditSettings?.preventOrderIfExceeded ? 'Checkout blocked if limit exceeded' : 'No credit limit restriction',
      'credit-settings',
    ],
    ['calculator', 'Quoting engine', 'The quoting engine feature is not enabled', 'quoting-engine'],
    [
      'warning',
      'Checkout access',
      checkoutAccess?.disableCheckout ? 'Checkout is disabled' : 'Checkout is enabled',
      'checkout-access',
    ],
  ]
}

function CustomizedRulesNav({ group, onNavigate, openSections }) {
  const inheritedRules = getInheritedRules(group).filter(
    ([, , , sectionId]) => !(sectionId && openSections[sectionId])
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Customized rules</h3>
      <ul className="space-y-2 border-b border-gray-100 pb-4 text-sm">
        {NAV_LINKS.map(([id, label]) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => onNavigate(id)}
              className="cursor-pointer text-purple-600 underline-offset-2 hover:underline"
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
      <h3 className="mb-3 mt-4 text-sm font-semibold text-gray-900">Inherited rules</h3>
      <ul className="space-y-3 text-sm">
        {inheritedRules.map(([, label]) => (
          <li key={label} className="text-gray-700">
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function InheritedRulesPanel({ group, onNavigate, openSections }) {
  const rules = getInheritedRules(group).filter(
    ([, , , sectionId]) => !(sectionId && openSections[sectionId])
  )

  return (
    <section className="p-1">
      <h2 className="mb-2.5 text-base font-semibold text-gray-900">Inherited rules</h2>
      <ul>
        {rules.map(([icon, label, note, sectionId]) => {
          function activate() {
            if (sectionId) {
              onNavigate(sectionId)
            } else {
              alert('Not configurable in this app yet.')
            }
          }

          return (
          <li
            key={label}
            role="button"
            tabIndex={0}
            title={sectionId ? undefined : 'Not configurable in this app yet'}
            onClick={activate}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') activate()
            }}
            className="flex cursor-pointer items-center gap-4 rounded-lg px-3 py-2 hover:bg-gray-100"
          >
            <div className="flex w-52 flex-none items-center gap-2">
              <RuleIcon name={icon} />
              <span className="text-sm font-semibold text-gray-900">{label}</span>
            </div>
            <div className="flex flex-1 items-center gap-1.5 whitespace-nowrap text-sm text-gray-500">
              <svg
                className="h-4 w-4 flex-none text-gray-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              <svg
                className="h-4 w-4 flex-none text-gray-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
              <span className="truncate">{note}</span>
            </div>
            <span className="flex flex-none items-center justify-center text-gray-900">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </span>
          </li>
          )
        })}
      </ul>
    </section>
  )
}

export default function CustomerGroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [group, setGroup] = useState(null)
  const [priceLists, setPriceLists] = useState([])
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [shopifyTag, setShopifyTag] = useState('')

  const [overridePriceLists, setOverridePriceLists] = useState(false)
  const [priceListIds, setPriceListIds] = useState([])
  const [overridePayment, setOverridePayment] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS)
  const [overrideStockDisplay, setOverrideStockDisplay] = useState(false)
  const [stockDisplay, setStockDisplay] = useState(DEFAULT_STOCK_DISPLAY)
  const [overrideOrderLimits, setOverrideOrderLimits] = useState(false)
  const [orderLimits, setOrderLimits] = useState(DEFAULT_ORDER_LIMITS)
  const [overrideAddressManagement, setOverrideAddressManagement] = useState(false)
  const [addressManagement, setAddressManagement] = useState(DEFAULT_ADDRESS_MANAGEMENT)
  const [overrideCreditSettings, setOverrideCreditSettings] = useState(false)
  const [creditSettings, setCreditSettings] = useState(DEFAULT_CREDIT_SETTINGS)
  const [overrideCheckoutAccess, setOverrideCheckoutAccess] = useState(false)
  const [checkoutAccess, setCheckoutAccess] = useState(DEFAULT_CHECKOUT_ACCESS)

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [openSections, setOpenSections] = useState({})
  const scrollTargetRef = useRef(null)

  function navigateToSection(sectionId) {
    if (COLLAPSIBLE_SECTION_IDS.has(sectionId)) {
      setOpenSections((s) => ({ ...s, [sectionId]: true }))
      scrollTargetRef.current = sectionId
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  useEffect(() => {
    if (scrollTargetRef.current) {
      const targetId = scrollTargetRef.current
      scrollTargetRef.current = null
      requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [openSections])

  function loadAll() {
    Promise.all([customerGroupsApi.get(id), priceListsApi.list()]).then(([g, pls]) => {
      setGroup(g)
      setPriceLists(pls)
      setName(g.name)
      setHandle(g.handle || '')
      setShopifyTag(g.shopifyTag || '')

      setOverridePriceLists(!!g.priceLists?.length)
      setPriceListIds((g.priceLists?.length ? g.priceLists : g.effectivePriceLists || []).map((pl) => pl._id))

      setOverridePayment(!!g.paymentMethods)
      setPaymentMethods(g.paymentMethods || g.effectivePaymentMethods || DEFAULT_PAYMENT_METHODS)
      setOverrideStockDisplay(!!g.stockDisplay)
      setStockDisplay(g.stockDisplay || g.effectiveStockDisplay || DEFAULT_STOCK_DISPLAY)
      setOverrideOrderLimits(!!g.orderLimits)
      setOrderLimits(g.orderLimits || g.effectiveOrderLimits || DEFAULT_ORDER_LIMITS)
      setOverrideAddressManagement(!!g.addressManagement)
      setAddressManagement(
        g.addressManagement || g.effectiveAddressManagement || DEFAULT_ADDRESS_MANAGEMENT
      )
      setOverrideCreditSettings(!!g.creditSettings)
      setCreditSettings(g.creditSettings || g.effectiveCreditSettings || DEFAULT_CREDIT_SETTINGS)
      setOverrideCheckoutAccess(!!g.checkoutAccess)
      setCheckoutAccess(g.checkoutAccess || g.effectiveCheckoutAccess || DEFAULT_CHECKOUT_ACCESS)
    })
  }

  useEffect(loadAll, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      const result = await customerGroupsApi.update(id, {
        name: name.trim(),
        handle: handle.trim(),
        shopifyTag: shopifyTag.trim(),
        priceLists: group.isBase || overridePriceLists ? priceListIds.filter(Boolean) : [],
        paymentMethods: group.isBase || overridePayment ? paymentMethods : null,
        stockDisplay: group.isBase || overrideStockDisplay ? stockDisplay : null,
        orderLimits: group.isBase || overrideOrderLimits ? orderLimits : null,
        addressManagement: group.isBase || overrideAddressManagement ? addressManagement : null,
        creditSettings: group.isBase || overrideCreditSettings ? creditSettings : null,
        checkoutAccess: group.isBase || overrideCheckoutAccess ? checkoutAccess : null,
      })
      setMessage(`Updated customer group.${result.groupSync ? ' Customers re-synced.' : ''}`)
      loadAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update customer group')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this customer group? Customers already assigned keep their current price list.'))
      return
    await customerGroupsApi.remove(id)
    navigate('/customers/groups')
  }

  if (!group) {
    return <p className="text-gray-500">Loading…</p>
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/customers/groups"
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
          <h1 className="text-2xl font-semibold text-gray-900">{group.name}</h1>
        </div>
        <MoreActionsMenu
          canDelete={!group.isBase}
          onViewCustomers={() =>
            group.isBase
              ? navigate('/customers')
              : document.getElementById('group-customers')?.scrollIntoView({ behavior: 'smooth' })
          }
          onDelete={handleDelete}
        />
      </div>
      <p className="mt-1 text-sm text-gray-500">Configure how you want your customer group to work.</p>

      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  required
                  maxLength={256}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Handle (or ID)</label>
                <input
                  required
                  maxLength={128}
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Customer tag</label>
              <p className="mb-2 text-xs text-gray-400">Applied to customers to enable SparkLayer.</p>
              {group.isBase ? (
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    b2b
                  </span>
                  <Link to="/customers" className="text-xs text-purple-600 hover:underline">
                    View customers
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    required
                    value={shopifyTag}
                    onChange={(e) => setShopifyTag(e.target.value)}
                    className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById('group-customers')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="cursor-pointer whitespace-nowrap text-xs text-purple-600 hover:underline"
                  >
                    View customers
                  </button>
                </div>
              )}
            </div>
          </section>

          <PriceListsSection
            isBase={group.isBase}
            override={overridePriceLists}
            onOverrideChange={setOverridePriceLists}
            value={priceListIds}
            onChange={setPriceListIds}
            baseValue={(group.effectivePriceLists || []).map((pl) => pl._id)}
            priceListOptions={priceLists}
          />

          <PaymentMethodsSection
            isBase={group.isBase}
            override={overridePayment}
            onOverrideChange={setOverridePayment}
            value={paymentMethods}
            onChange={setPaymentMethods}
            baseValue={group.effectivePaymentMethods}
          />

          {!!openSections['order-quantity-limits'] && (
            <OrderQuantityLimitsSection
              isBase={group.isBase}
              override={overrideOrderLimits}
              onOverrideChange={setOverrideOrderLimits}
              value={orderLimits.quantity}
              onChange={(quantity) => setOrderLimits({ ...orderLimits, quantity })}
              baseValue={group.effectiveOrderLimits?.quantity}
            />
          )}

          {!!openSections['order-total-limits'] && (
            <OrderTotalLimitsSection
              isBase={group.isBase}
              override={overrideOrderLimits}
              onOverrideChange={setOverrideOrderLimits}
              value={orderLimits.total}
              onChange={(total) => setOrderLimits({ ...orderLimits, total })}
              baseValue={group.effectiveOrderLimits?.total}
            />
          )}

          {!!openSections['address-management'] && (
            <AddressManagementSection
              isBase={group.isBase}
              override={overrideAddressManagement}
              onOverrideChange={setOverrideAddressManagement}
              value={addressManagement}
              onChange={setAddressManagement}
              baseValue={group.effectiveAddressManagement}
            />
          )}

          <StockDisplaySection
            isBase={group.isBase}
            override={overrideStockDisplay}
            onOverrideChange={setOverrideStockDisplay}
            value={stockDisplay}
            onChange={setStockDisplay}
            baseValue={group.effectiveStockDisplay}
          />

          {!!openSections['credit-settings'] && (
            <CreditSettingsSection
              isBase={group.isBase}
              override={overrideCreditSettings}
              onOverrideChange={setOverrideCreditSettings}
              value={creditSettings}
              onChange={setCreditSettings}
              baseValue={group.effectiveCreditSettings}
            />
          )}

          {!!openSections['quoting-engine'] && <QuotingEngineSection />}

          {!!openSections['checkout-access'] && (
            <CheckoutAccessSection
              isBase={group.isBase}
              override={overrideCheckoutAccess}
              onOverrideChange={setOverrideCheckoutAccess}
              value={checkoutAccess}
              onChange={setCheckoutAccess}
              baseValue={group.effectiveCheckoutAccess}
            />
          )}

          {group.isBase && (
            <InheritedRulesPanel group={group} onNavigate={navigateToSection} openSections={openSections} />
          )}

          {!group.isBase && (
            <section id="group-customers" className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Customers in this group ({group.customers.length})
              </h2>
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {group.customers.map((c) => (
                  <div key={c._id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-gray-900">{c.name}</span>
                    <span className="text-gray-400">{c.email}</span>
                  </div>
                ))}
                {group.customers.length === 0 && (
                  <p className="px-4 py-6 text-center text-gray-400">
                    {`No customers currently have the "${group.shopifyTag}" tag.`}
                  </p>
                )}
              </div>
            </section>
          )}

          <div className="flex justify-end gap-3">
            <Link
              to="/customers/groups"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? 'Updating…' : 'Update customer group'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <CustomizedRulesNav group={group} onNavigate={navigateToSection} openSections={openSections} />
          </div>
        </div>
      </form>
    </div>
  )
}
