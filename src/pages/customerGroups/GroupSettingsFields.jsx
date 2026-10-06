import { useState } from 'react'

const DEFAULT_PAYMENT_METHODS = {
  invoice: false,
  onAccount: false,
  cardAtCheckout: false,
  requestForQuote: false,
}
const DEFAULT_ORDER_LIMITS = {
  quantity: { min: null, max: null },
  total: [],
}
const DEFAULT_STOCK_DISPLAY = {
  showAvailability: true,
  hidePreOrder: false,
  showUnitsOfStock: false,
  max: 9999,
  low: 20,
  last: 5,
}
const DEFAULT_ADDRESS_MANAGEMENT = {
  allowAddressEditing: true,
  allowBillingAddress: true,
}
const DEFAULT_CREDIT_SETTINGS = {
  preventOrderIfExceeded: false,
}
const DEFAULT_CHECKOUT_ACCESS = {
  disableCheckout: false,
}

export {
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_ORDER_LIMITS,
  DEFAULT_STOCK_DISPLAY,
  DEFAULT_ADDRESS_MANAGEMENT,
  DEFAULT_CREDIT_SETTINGS,
  DEFAULT_CHECKOUT_ACCESS,
}

const RULE_ICON_PATHS = {
  cube: [
    'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
  ],
  bag: [
    'M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z',
  ],
  archive: [
    'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
  ],
  pin: [
    'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    'M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
  ],
  lock: [
    'M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z',
  ],
  calculator: [
    'M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z',
  ],
  warning: [
    'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
  ],
}

const POPULAR_CURRENCIES = ['USD', 'GBP', 'EUR', 'NZD', 'AUD', 'CAD']

const CURRENCY_NAMES = {
  USD: 'US Dollar',
  GBP: 'Pound Sterling',
  EUR: 'Euro',
  NZD: 'New Zealand Dollar',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  AED: 'UAE Dirham',
  AFN: 'Afghani',
  ALL: 'Lek',
  AMD: 'Armenian Dram',
  ANG: 'Netherlands Antillean Guilder',
  AOA: 'Kwanza',
  ARS: 'Argentine Peso',
  AWG: 'Aruban Florin',
  AZN: 'Azerbaijani Manat',
  BAM: 'Convertible Mark',
  BBD: 'Barbados Dollar',
  BDT: 'Taka',
  BGN: 'Bulgarian Lev',
  BHD: 'Bahraini Dinar',
  BND: 'Brunei Dollar',
  BOB: 'Boliviano',
  BRL: 'Brazilian Real',
  BSD: 'Bahamian Dollar',
  BWP: 'Pula',
  BZD: 'Belize Dollar',
  CHF: 'Swiss Franc',
  CLP: 'Chilean Peso',
  CNY: 'Yuan Renminbi',
  COP: 'Colombian Peso',
  CRC: 'Costa Rican Colon',
  CZK: 'Czech Koruna',
  DKK: 'Danish Krone',
  DOP: 'Dominican Peso',
  DZD: 'Algerian Dinar',
  EGP: 'Egyptian Pound',
  ETB: 'Ethiopian Birr',
  FJD: 'Fiji Dollar',
  GEL: 'Lari',
  GHS: 'Ghana Cedi',
  GTQ: 'Quetzal',
  HKD: 'Hong Kong Dollar',
  HNL: 'Lempira',
  HRK: 'Kuna',
  HUF: 'Forint',
  IDR: 'Rupiah',
  ILS: 'New Israeli Sheqel',
  INR: 'Indian Rupee',
  ISK: 'Iceland Krona',
  JMD: 'Jamaican Dollar',
  JOD: 'Jordanian Dinar',
  JPY: 'Yen',
  KES: 'Kenyan Shilling',
  KRW: 'Won',
  KWD: 'Kuwaiti Dinar',
  KZT: 'Tenge',
  LKR: 'Sri Lanka Rupee',
  MAD: 'Moroccan Dirham',
  MXN: 'Mexican Peso',
  MYR: 'Malaysian Ringgit',
  NGN: 'Naira',
  NOK: 'Norwegian Krone',
  NPR: 'Nepalese Rupee',
  OMR: 'Rial Omani',
  PEN: 'Sol',
  PHP: 'Philippine Peso',
  PKR: 'Pakistan Rupee',
  PLN: 'Zloty',
  QAR: 'Qatari Rial',
  RON: 'Romanian Leu',
  RSD: 'Serbian Dinar',
  RUB: 'Russian Ruble',
  SAR: 'Saudi Riyal',
  SEK: 'Swedish Krona',
  SGD: 'Singapore Dollar',
  THB: 'Baht',
  TRY: 'Turkish Lira',
  TWD: 'New Taiwan Dollar',
  TZS: 'Tanzanian Shilling',
  UAH: 'Hryvnia',
  UGX: 'Uganda Shilling',
  UYU: 'Peso Uruguayo',
  VND: 'Dong',
  XCD: 'East Caribbean Dollar',
  ZAR: 'Rand',
}

const ALPHABETICAL_CURRENCIES = Object.keys(CURRENCY_NAMES).sort()

export function RuleIcon({ name, className = 'h-4 w-4 flex-none text-gray-900' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {RULE_ICON_PATHS[name].map((d, i) => (
        <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
      ))}
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-4 w-4 flex-none text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function useSectionOpen(openProp, onToggle) {
  const [internalOpen, setInternalOpen] = useState(true)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const toggle = () => (isControlled ? onToggle(!open) : setInternalOpen((o) => !o))
  return [open, toggle]
}

function CollapsibleHeader({ icon, title, isBase, override, onOverrideChange, open, toggle }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button type="button" onClick={toggle} className="flex flex-1 cursor-pointer items-center gap-2 text-left">
        <RuleIcon name={icon} />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </button>
      <div className="flex flex-none items-center gap-3">
        {!isBase && onOverrideChange && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={override}
              onChange={(e) => onOverrideChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            Override base group
          </label>
        )}
        <button type="button" onClick={toggle} className="cursor-pointer">
          <ChevronIcon open={open} />
        </button>
      </div>
    </div>
  )
}

function FeatureNotEnabledBanner({ children }) {
  return (
    <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      <p className="flex items-center gap-2 font-medium">
        <svg className="h-4 w-4 flex-none" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M18 10A8 8 0 112 10a8 8 0 0116 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9zm1-4a1 1 0 100 2 1 1 0 000-2z"
            clipRule="evenodd"
          />
        </svg>
        Feature is not enabled
      </p>
      <div className="mt-1 text-blue-700">{children}</div>
    </div>
  )
}

function SectionHeader({ id, title, isBase, override, onOverrideChange }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 id={id} className="scroll-mt-6 text-lg font-semibold text-gray-900">
        {title}
      </h2>
      {!isBase && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={override}
            onChange={(e) => onOverrideChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          Override base group
        </label>
      )}
    </div>
  )
}

export function PriceListsSection({
  isBase,
  override,
  onOverrideChange,
  value,
  onChange,
  baseValue,
  priceListOptions,
}) {
  const shown = override || isBase ? value : baseValue || []
  const disabled = !isBase && !override

  function updateRow(index, priceListId) {
    const next = [...shown]
    next[index] = priceListId
    onChange(next)
  }

  function removeRow(index) {
    onChange(shown.filter((_, i) => i !== index))
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <SectionHeader
        id="price-lists"
        title="Price lists"
        isBase={isBase}
        override={override}
        onOverrideChange={onOverrideChange}
      />
      <p className="mb-3 text-sm text-gray-500">
        Choose which price lists will be used for this customer group. If a product SKU exists in
        multiple lists, SparkLayer uses the first one it finds.
      </p>
      <div className="space-y-2">
        {shown.map((plId, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md border border-gray-300 text-xs text-gray-500">
              {i + 1}
            </span>
            <select
              disabled={disabled}
              value={plId || ''}
              onChange={(e) => updateRow(i, e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Select a price list</option>
              {priceListOptions.map((pl) => (
                <option key={pl._id} value={pl._id}>
                  {pl.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeRow(i)}
              className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              aria-label="Remove price list"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482 41.03 41.03 0 00-2.365-.298V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
        {shown.length === 0 && (
          <p className="rounded-md border border-dashed border-gray-200 px-3 py-4 text-center text-sm text-gray-400">
            {disabled ? 'Inheriting from the base group.' : 'No price lists assigned yet.'}
          </p>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...shown, ''])}
          className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Add price list
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([])}
          className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </section>
  )
}

export function PaymentMethodsSection({ isBase, override, onOverrideChange, value, onChange, baseValue }) {
  const shown = override || isBase ? value : baseValue || DEFAULT_PAYMENT_METHODS
  const disabled = !isBase && !override

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <SectionHeader
        id="payment-methods"
        title="Payment methods"
        isBase={isBase}
        override={override}
        onOverrideChange={onOverrideChange}
      />
      <p className="mb-3 text-sm text-gray-500">Choose which payment methods will be shown at checkout.</p>
      <div className="space-y-2">
        {[
          ['invoice', 'Pay by invoice', 'Allow customers to place an order and invoice them later'],
          ['onAccount', 'Payment on account', 'Allow customers to place orders on account, e.g. net terms and credit'],
          ['cardAtCheckout', 'Card at checkout', 'Allow customers to pay online by card'],
          ['requestForQuote', 'Request For Quote', 'Allow customers to submit orders for review'],
        ].map(([key, label, help]) => (
          <label
            key={key}
            className={`flex items-start gap-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}
          >
            <input
              type="checkbox"
              disabled={disabled}
              checked={!!shown[key]}
              onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
            />
            <span>
              <span className="block font-medium">{label}</span>
              <span className="block text-xs text-gray-400">{help}</span>
            </span>
          </label>
        ))}
      </div>
      {shown.requestForQuote && (
        <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <p className="font-medium">Feature is not enabled</p>
          <p className="mt-1 text-blue-700">
            "Request for quote" isn't backed by a quoting engine in this app yet — checking it here
            won't change checkout behavior.
          </p>
        </div>
      )}
    </section>
  )
}

export function StockDisplaySection({ isBase, override, onOverrideChange, value, onChange, baseValue }) {
  const shown = override || isBase ? value : baseValue || DEFAULT_STOCK_DISPLAY
  const disabled = !isBase && !override

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <SectionHeader
        id="stock-display"
        title="Stock display"
        isBase={isBase}
        override={override}
        onOverrideChange={onOverrideChange}
      />
      <p className="mb-3 text-sm text-gray-500">Choose how stock levels are shown to this customer group.</p>
      <div className="space-y-3">
        <label className={`flex items-start gap-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
          <input
            type="checkbox"
            disabled={disabled}
            checked={!!shown.showAvailability}
            onChange={(e) => onChange({ ...value, showAvailability: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
          />
          <span>
            <span className="block font-medium">Show stock availability to customers</span>
            <span className="block text-xs text-gray-400">
              Customers can see the availability of your products (pre-order is always shown unless
              "Hide pre-order" below is checked)
            </span>
          </span>
        </label>
        <label className={`flex items-start gap-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
          <input
            type="checkbox"
            disabled={disabled}
            checked={!!shown.hidePreOrder}
            onChange={(e) => onChange({ ...value, hidePreOrder: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
          />
          <span>
            <span className="block font-medium">Hide pre-order</span>
            <span className="block text-xs text-gray-400">
              Hides the "pre-order" stock status from being displayed to customers
            </span>
          </span>
        </label>
        <label className={`flex items-start gap-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
          <input
            type="checkbox"
            disabled={disabled}
            checked={!!shown.showUnitsOfStock}
            onChange={(e) => onChange({ ...value, showUnitsOfStock: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
          />
          <span>
            <span className="block font-medium">Show number of units of stock</span>
            <span className="block text-xs text-gray-400">
              Show the specific stock number up to the "Max" specified below
            </span>
          </span>
        </label>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Max
            </label>
            <input
              type="number"
              min="0"
              disabled={disabled}
              value={shown.max}
              onChange={(e) => onChange({ ...value, max: Number(e.target.value) })}
              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Low
            </label>
            <input
              type="number"
              min="0"
              disabled={disabled}
              value={shown.low}
              onChange={(e) => onChange({ ...value, low: Number(e.target.value) })}
              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Last
            </label>
            <input
              type="number"
              min="0"
              disabled={disabled}
              value={shown.last}
              onChange={(e) => onChange({ ...value, last: Number(e.target.value) })}
              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <p className="col-span-3 text-xs text-gray-400">
            Max: this shows to the customer in green. Anything above will show as {shown.max}+. Low:
            shows in amber and denotes low stock. Last: shows in amber and denotes the last remaining
            stock.
          </p>
        </div>
      </div>
    </section>
  )
}

function LimitField({ label, value, disabled, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        min="0"
        disabled={disabled}
        placeholder="No limit"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  )
}

function OrderLimitPairSection({
  id,
  icon,
  title,
  description,
  minLabel,
  maxLabel,
  addLabel,
  isBase,
  override,
  onOverrideChange,
  value,
  onChange,
  baseValue,
  open: openProp,
  onToggle,
}) {
  const [internalOpen, setInternalOpen] = useState(true)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const toggle = () => (isControlled ? onToggle(!open) : setInternalOpen((o) => !o))
  const shown = override || isBase ? value : baseValue || { min: null, max: null }
  const disabled = !isBase && !override
  const hasValue = shown.min != null || shown.max != null
  const [fieldsVisible, setFieldsVisible] = useState(hasValue)

  function reset() {
    onChange({ min: null, max: null })
    setFieldsVisible(false)
  }

  return (
    <section id={id} className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={toggle}
          className="flex flex-1 cursor-pointer items-center gap-2 text-left"
        >
          <RuleIcon name={icon} />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </button>
        <div className="flex flex-none items-center gap-3">
          {!isBase && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={override}
                onChange={(e) => onOverrideChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Override base group
            </label>
          )}
          <button type="button" onClick={toggle} className="cursor-pointer">
            <ChevronIcon open={open} />
          </button>
        </div>
      </div>
      {open && (
        <>
          <p className="mb-3 mt-1 text-sm text-gray-500">{description}</p>
          {fieldsVisible ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <LimitField label={minLabel} value={shown.min} disabled={disabled} onChange={(v) => onChange({ ...shown, min: v })} />
                <LimitField label={maxLabel} value={shown.max} disabled={disabled} onChange={(v) => onChange({ ...shown, max: v })} />
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={reset}
                className="mt-3 cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Reset
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => setFieldsVisible(true)}
                className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {addLabel}
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={reset}
                className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export function OrderQuantityLimitsSection(props) {
  return (
    <OrderLimitPairSection
      id="order-quantity-limits"
      icon="cube"
      title="Order quantity limits"
      description="Specify the order quantity limits customers must meet before checking out."
      minLabel="Minimum order quantity"
      maxLabel="Maximum order quantity"
      addLabel="Add order quantity limit"
      {...props}
    />
  )
}

function CurrencySelect({ value, onChange, disabled }) {
  return (
    <select
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
    >
      {POPULAR_CURRENCIES.map((code) => (
        <option key={`popular-${code}`} value={code}>
          {code} - {CURRENCY_NAMES[code]}
        </option>
      ))}
      {ALPHABETICAL_CURRENCIES.map((code) => (
        <option key={code} value={code}>
          {code} - {CURRENCY_NAMES[code]}
        </option>
      ))}
    </select>
  )
}

export function OrderTotalLimitsSection({
  isBase,
  override,
  onOverrideChange,
  value,
  onChange,
  baseValue,
  open: openProp,
  onToggle,
}) {
  const [open, toggle] = useSectionOpen(openProp, onToggle)
  const shown = override || isBase ? value : baseValue || []
  const disabled = !isBase && !override

  function updateRow(index, patch) {
    onChange(shown.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function removeRow(index) {
    onChange(shown.filter((_, i) => i !== index))
  }

  return (
    <section id="order-total-limits" className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <CollapsibleHeader
        icon="bag"
        title="Order total limits"
        isBase={isBase}
        override={override}
        onOverrideChange={onOverrideChange}
        open={open}
        toggle={toggle}
      />
      {open && (
        <>
          <p className="mb-3 mt-1 text-sm text-gray-500">
            Specify the order total limits customers must reach before checking out.
          </p>
          {shown.length > 0 && (
            <div className="space-y-3">
              {shown.map((row, i) => (
                <div key={i} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
                    <CurrencySelect
                      value={row.currency}
                      disabled={disabled}
                      onChange={(currency) => updateRow(i, { currency })}
                    />
                  </div>
                  <LimitField
                    label="Minimum order total"
                    value={row.min}
                    disabled={disabled}
                    onChange={(v) => updateRow(i, { min: v })}
                  />
                  <LimitField
                    label="Maximum order total"
                    value={row.max}
                    disabled={disabled}
                    onChange={(v) => updateRow(i, { max: v })}
                  />
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeRow(i)}
                    aria-label="Remove currency limit"
                    className="flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482 41.03 41.03 0 00-2.365-.298V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange([...shown, { currency: 'USD', min: 0, max: null }])}
              className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Add order total limit
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange([])}
              className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export function AddressManagementSection({
  isBase,
  override,
  onOverrideChange,
  value,
  onChange,
  baseValue,
  open: openProp,
  onToggle,
}) {
  const [internalOpen, setInternalOpen] = useState(true)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const toggle = () => (isControlled ? onToggle(!open) : setInternalOpen((o) => !o))
  const shown = override || isBase ? value : baseValue || DEFAULT_ADDRESS_MANAGEMENT
  const disabled = !isBase && !override

  return (
    <section id="address-management" className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={toggle}
          className="flex flex-1 cursor-pointer items-center gap-2 text-left"
        >
          <RuleIcon name="archive" />
          <h2 className="text-lg font-semibold text-gray-900">Address management</h2>
        </button>
        <div className="flex flex-none items-center gap-3">
          {!isBase && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={override}
                onChange={(e) => onOverrideChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Override base group
            </label>
          )}
          <button type="button" onClick={toggle} className="cursor-pointer">
            <ChevronIcon open={open} />
          </button>
        </div>
      </div>
      {open && (
        <>
          <p className="mb-3 mt-1 text-sm text-gray-500">
            Specify if you want customers to be able to edit their addresses.
          </p>
          <div className="space-y-3">
            <label className={`flex items-start gap-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
              <input
                type="checkbox"
                disabled={disabled}
                checked={!!shown.allowAddressEditing}
                onChange={(e) => onChange({ ...value, allowAddressEditing: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
              />
              <span>
                <span className="block font-medium">Allow address editing in My Account</span>
                <span className="block text-xs text-gray-400">
                  Allow customers to add or edit their addresses
                </span>
              </span>
            </label>
            <label className={`flex items-start gap-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
              <input
                type="checkbox"
                disabled={disabled}
                checked={!!shown.allowBillingAddress}
                onChange={(e) => onChange({ ...value, allowBillingAddress: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
              />
              <span>
                <span className="block font-medium">Allow customers to add and edit billing addresses</span>
                <span className="block text-xs text-gray-400">Let customers set a default billing address</span>
              </span>
            </label>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(DEFAULT_ADDRESS_MANAGEMENT)}
            className="mt-3 cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Reset
          </button>
        </>
      )}
    </section>
  )
}

export function QuotingEngineSection({ open: openProp, onToggle }) {
  const [open, toggle] = useSectionOpen(openProp, onToggle)

  return (
    <section id="quoting-engine" className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <CollapsibleHeader icon="calculator" title="Quoting engine" open={open} toggle={toggle} />
      {open && (
        <>
          <p className="mb-3 mt-1 text-sm text-gray-500">
            Simplify how your sales team and B2B customers create and manage quotes.
          </p>
          <FeatureNotEnabledBanner>
            <p>
              The quoting engine is not currently enabled. Enable it by removing the "Request For
              Quote" payment method from all customer groups or reset your configuration.
            </p>
          </FeatureNotEnabledBanner>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-400"
            >
              Reset
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export function CreditSettingsSection({
  isBase,
  override,
  onOverrideChange,
  value,
  onChange,
  baseValue,
  open: openProp,
  onToggle,
}) {
  const [open, toggle] = useSectionOpen(openProp, onToggle)
  const shown = override || isBase ? value : baseValue || DEFAULT_CREDIT_SETTINGS
  const disabled = !isBase && !override

  return (
    <section id="credit-settings" className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <CollapsibleHeader
        icon="lock"
        title="Credit settings"
        isBase={isBase}
        override={override}
        onOverrideChange={onOverrideChange}
        open={open}
        toggle={toggle}
      />
      {open && (
        <>
          <p className="mb-3 mt-1 text-sm text-gray-500">
            Manage how credit limits apply to this customer group, including visibility, order
            restrictions, and account payment limits.
          </p>
          <label className={`flex items-start gap-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            <input
              type="checkbox"
              disabled={disabled}
              checked={!!shown.preventOrderIfExceeded}
              onChange={(e) => onChange({ ...value, preventOrderIfExceeded: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
            />
            <span>
              <span className="block font-medium">Prevent placing an order if exceeding credit limit</span>
              <span className="block text-xs text-gray-400">
                Restrict customers completing an order if they're paying on account
              </span>
            </span>
          </label>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(DEFAULT_CREDIT_SETTINGS)}
            className="mt-3 cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Reset
          </button>
        </>
      )}
    </section>
  )
}

export function CheckoutAccessSection({
  isBase,
  override,
  onOverrideChange,
  value,
  onChange,
  baseValue,
  open: openProp,
  onToggle,
}) {
  const [open, toggle] = useSectionOpen(openProp, onToggle)
  const shown = override || isBase ? value : baseValue || DEFAULT_CHECKOUT_ACCESS
  const disabled = !isBase && !override

  return (
    <section id="checkout-access" className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <CollapsibleHeader
        icon="warning"
        title="Checkout access"
        isBase={isBase}
        override={override}
        onOverrideChange={onOverrideChange}
        open={open}
        toggle={toggle}
      />
      {open && (
        <>
          <p className="mb-3 mt-1 text-sm text-gray-500">
            Control whether this customer group can complete purchases.
          </p>
          <label className={`flex items-start gap-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            <input
              type="checkbox"
              disabled={disabled}
              checked={!!shown.disableCheckout}
              onChange={(e) => onChange({ ...value, disableCheckout: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
            />
            <span>
              <span className="block font-medium">Disable checkout</span>
              <span className="block text-xs text-gray-400">
                Customers in this group cannot access the checkout, but they can still submit quotes
                if quoting is enabled
              </span>
            </span>
          </label>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(DEFAULT_CHECKOUT_ACCESS)}
            className="mt-3 cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Reset
          </button>
        </>
      )}
    </section>
  )
}
