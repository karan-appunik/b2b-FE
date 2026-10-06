import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import * as discountsApi from '../../api/discounts.api'
import * as customerGroupsApi from '../../api/customerGroups.api'
import * as productsApi from '../../api/products.api'
import { slugify } from '../../utils/csv'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']

// Splits a textarea of emails/customer ids on commas or newlines into a
// clean list — the same shape the backend stores (Discount.excludedCustomerIdentifiers).
function parseIdentifierList(text) {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const TEMPLATE_DEFAULTS = {
  'coupon-20-off': {
    internalName: '20% off orders for new B2B customers',
    handle: '20-off-orders',
    publicName: '20% off your first B2B order',
    valueType: 'percentage',
    value: '20',
    requireCoupon: true,
    couponCodes: ['20-OFF'],
  },
  'order-100-off-1000': {
    internalName: 'US$100 off orders over US$1,000',
    handle: '100-off-orders-over-1000',
    publicName: 'US$100 off orders over US$1,000',
    valueType: 'fixed',
    value: '100',
    requireSubtotalLimits: true,
    minSubtotal: '1000',
  },
}

const TYPE_OPTIONS = [
  { value: 'amount-off-order', label: 'Give an amount off an order', enabled: true, mode: 'simple', appliesTo: 'order' },
  { value: 'free-product', label: 'Give a free product', enabled: true, mode: 'simple', appliesTo: 'free_product' },
  { value: 'percentage-off-products', label: 'Give a percentage off products', enabled: true, mode: 'simple', appliesTo: 'line_item' },
  {
    value: 'shipping-reward',
    label: 'Give a shipping reward',
    enabled: true,
    mode: 'simple',
    appliesTo: 'shipping',
    note: 'Currently only applies to "Advance before shipping" and "Payment on Account" orders',
  },
  { value: 'advanced-requirements-rewards', label: 'Advanced requirements and rewards', enabled: true, mode: 'advanced' },
  { value: 'advanced-free-products', label: 'Advanced free products', enabled: true, mode: 'advanced_free_product' },
]

const EMPTY_FREE_PRODUCT_GROUP = () => ({
  products: [{ sku: '', quantity: '1', perQuantity: '' }],
  application: 'once',
  limitedMaxTimes: '',
})

const EMPTY_CONDITION = { attribute: 'sku', operator: 'equals', value: '' }
const REWARD_TYPE_LABELS = {
  subtotal: 'Percentage/fixed off order sub-total',
  shipping: 'Percentage/fixed/free off shipping',
  cart_lines: 'Percentage/fixed off matching cart lines',
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-purple-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function InfoIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-blue-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0ZM9 9a1 1 0 0 1 2 0v4a1 1 0 1 1-2 0V9Zm1-4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ReceiptPercentIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
    </svg>
  )
}

function SubtotalIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
      />
    </svg>
  )
}

const UPCOMING_REQUIREMENTS = []

function UserMinusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
      />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  )
}

function UserGroupIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
      />
    </svg>
  )
}

function XCircleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  )
}

function TagIcon2() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  )
}

function CombineIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function validate({ internalName, requireCoupon, couponCodes, mode, appliesTo, valueType, value, freeProductSku, lineItemSkusText, requireSubtotalLimits, minSubtotal, maxSubtotal, requireItemLimits, minItemQuantity, maxItemQuantity, requireProductRequirement, productRequirementValue, requireScheduling, startsAt, endsAt, requireCustomerGroups, selectedGroupIds, requireUsageLimit, usageLimitPerCustomer, requireExcludeCustomers, excludeCustomersText, requirementGroups, rewards, freeProductGroups }) {
  if (!internalName.trim()) return 'Discount Internal Name is required.'
  if (requireCoupon && couponCodes.length === 0) return 'Add at least one coupon code when "Coupon codes" is enabled.'

  if (mode === 'advanced') {
    const hasValidGroup = requirementGroups.some(
      (group) => group.length > 0 && group.every((condition) => condition.value.trim()),
    )
    if (!hasValidGroup) return 'Add at least one requirement group with every condition filled in.'

    if (rewards.length === 0) return 'Add at least one reward.'
    for (const reward of rewards) {
      if (reward.valueType !== 'free') {
        const numericValue = Number(reward.value)
        if (reward.value === '' || Number.isNaN(numericValue) || numericValue < 0) {
          return 'Each reward value must be a non-negative number.'
        }
        if (reward.valueType === 'percentage' && numericValue > 100) {
          return 'Each reward percentage value cannot exceed 100.'
        }
      }
      if (reward.type === 'cart_lines' && !reward.cartLineMatch.value.trim()) {
        return 'Each "cart lines" reward needs a product-matching value.'
      }
    }
  } else if (mode === 'advanced_free_product') {
    const hasValidGroup = requirementGroups.some(
      (group) => group.length > 0 && group.every((condition) => condition.value.trim()),
    )
    if (!hasValidGroup) return 'Add at least one requirement group with every condition filled in.'

    for (const group of freeProductGroups) {
      const hasValidProduct = group.products.some((p) => p.sku.trim())
      if (!hasValidProduct) return 'Each requirement group needs at least one free product with a SKU.'
      if (group.application === 'limited') {
        const max = Number(group.limitedMaxTimes)
        if (group.limitedMaxTimes === '' || !Number.isInteger(max) || max < 1) {
          return 'Maximum times must be a whole number of 1 or more when application is "Limited".'
        }
      }
    }
  } else if (appliesTo === 'free_product') {
    if (!freeProductSku.trim()) return 'Enter the SKU of the product to give away.'
  } else if (appliesTo === 'line_item') {
    const skus = parseIdentifierList(lineItemSkusText)
    if (skus.length === 0) return 'Enter at least one SKU.'
    if (skus.length > 25) return 'A maximum of 25 SKUs are allowed.'
    const numericValue = Number(value)
    if (value === '' || Number.isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
      return 'Percentage value must be between 0 and 100.'
    }
  } else if (valueType !== 'free') {
    const numericValue = Number(value)
    if (value === '' || Number.isNaN(numericValue) || numericValue < 0) {
      return 'Value must be a non-negative number.'
    }
    if (valueType === 'percentage' && numericValue > 100) return 'Percentage value cannot exceed 100.'
  }

  if (requireSubtotalLimits) {
    if (minSubtotal !== '' && (Number.isNaN(Number(minSubtotal)) || Number(minSubtotal) < 0)) {
      return 'Minimum subtotal must be a non-negative number.'
    }
    if (maxSubtotal !== '' && (Number.isNaN(Number(maxSubtotal)) || Number(maxSubtotal) < 0)) {
      return 'Maximum subtotal must be a non-negative number.'
    }
    if (minSubtotal !== '' && maxSubtotal !== '' && Number(maxSubtotal) < Number(minSubtotal)) {
      return 'Maximum subtotal must be greater than or equal to minimum subtotal.'
    }
  }

  if (requireItemLimits) {
    if (minItemQuantity !== '' && (!Number.isInteger(Number(minItemQuantity)) || Number(minItemQuantity) < 0)) {
      return 'Minimum item quantity must be a non-negative whole number.'
    }
    if (maxItemQuantity !== '' && (!Number.isInteger(Number(maxItemQuantity)) || Number(maxItemQuantity) < 0)) {
      return 'Maximum item quantity must be a non-negative whole number.'
    }
    if (minItemQuantity !== '' && maxItemQuantity !== '' && Number(maxItemQuantity) < Number(minItemQuantity)) {
      return 'Maximum item quantity must be greater than or equal to minimum item quantity.'
    }
  }

  if (mode === 'simple' && requireProductRequirement && !productRequirementValue.trim()) {
    return 'A value is required when "Product requirements" is enabled.'
  }

  if (requireExcludeCustomers && !parseIdentifierList(excludeCustomersText).length) {
    return 'Enter at least one email or customer id when "Exclude customers" is enabled.'
  }

  if (requireCustomerGroups && selectedGroupIds.length === 0) {
    return 'Select at least one customer group when "Customer groups" is enabled.'
  }

  if (requireUsageLimit) {
    const limit = Number(usageLimitPerCustomer)
    if (usageLimitPerCustomer === '' || !Number.isInteger(limit) || limit < 1) {
      return 'Usage limit per customer must be a whole number of 1 or more.'
    }
  }

  if (requireScheduling && startsAt && endsAt && endsAt < startsAt) {
    return 'End date must be on or after the start date.'
  }

  return ''
}

export default function DiscountCreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const template = TEMPLATE_DEFAULTS[location.state?.template] || {}

  const [enabled, setEnabled] = useState(true)
  const [internalName, setInternalName] = useState(template.internalName || '')
  const [handle, setHandle] = useState(template.handle || '')
  const [handleTouched, setHandleTouched] = useState(Boolean(template.handle))
  const [publicName, setPublicName] = useState(template.publicName || '')
  const [description, setDescription] = useState('')

  const [mode, setMode] = useState('simple')
  const [requirementGroups, setRequirementGroups] = useState([[{ ...EMPTY_CONDITION }]])
  const [rewards, setRewards] = useState([
    { type: 'subtotal', valueType: 'percentage', value: '', cartLineMatch: { ...EMPTY_CONDITION } },
  ])
  const [rewardApplication, setRewardApplication] = useState('all')
  // Parallel to requirementGroups (same index = same OR group) — kept in
  // sync by addRequirementGroup/removeRequirementGroup below regardless of
  // mode, since it's harmless to carry around and only sent when mode ===
  // 'advanced_free_product'.
  const [freeProductGroups, setFreeProductGroups] = useState([EMPTY_FREE_PRODUCT_GROUP()])

  const [appliesTo, setAppliesTo] = useState('order')
  const [valueType, setValueType] = useState(template.valueType || 'percentage')
  const [value, setValue] = useState(template.value || '')
  const [currency, setCurrency] = useState('USD')
  const [freeProductSku, setFreeProductSku] = useState('')
  const [freeProductQuantity, setFreeProductQuantity] = useState('1')
  const [freeProductPerQuantity, setFreeProductPerQuantity] = useState('')
  const [freeProductResults, setFreeProductResults] = useState([])
  const [showFreeProductDropdown, setShowFreeProductDropdown] = useState(false)
  const [lineItemSkusText, setLineItemSkusText] = useState('')

  // Searches by SKU or product name as the merchant types, so they can pick
  // the exact variant from a dropdown instead of typing a SKU by hand and
  // finding out at checkout time whether it matched.
  useEffect(() => {
    const query = freeProductSku.trim()
    if (!query) {
      setFreeProductResults([])
      return
    }
    let cancelled = false
    const timer = setTimeout(() => {
      productsApi
        .search(query)
        .then((groups) => {
          if (cancelled) return
          setFreeProductResults(groups.flatMap((group) => group.variants.map((variant) => ({ group, variant }))))
        })
        .catch(() => {
          if (!cancelled) setFreeProductResults([])
        })
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [freeProductSku])

  function handleSelectFreeProduct(variant) {
    setFreeProductSku(variant.sku || '')
    setFreeProductResults([])
    setShowFreeProductDropdown(false)
  }

  function handleTypeOptionChange(opt) {
    if (opt.mode === 'advanced' || opt.mode === 'advanced_free_product') {
      setMode(opt.mode)
    } else {
      setMode('simple')
      handleAppliesToChange(opt.appliesTo)
    }
  }

  function addRequirementGroup() {
    setRequirementGroups((prev) => [...prev, [{ ...EMPTY_CONDITION }]])
    setFreeProductGroups((prev) => [...prev, EMPTY_FREE_PRODUCT_GROUP()])
  }

  function removeRequirementGroup(groupIndex) {
    setRequirementGroups((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== groupIndex) : prev))
    setFreeProductGroups((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== groupIndex) : prev))
  }

  function addFreeProductToGroup(groupIndex) {
    setFreeProductGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex ? { ...group, products: [...group.products, { sku: '', quantity: '1', perQuantity: '' }] } : group,
      ),
    )
  }

  function removeFreeProductFromGroup(groupIndex, productIndex) {
    setFreeProductGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex && group.products.length > 1
          ? { ...group, products: group.products.filter((_, pi) => pi !== productIndex) }
          : group,
      ),
    )
  }

  function updateFreeProductInGroup(groupIndex, productIndex, field, fieldValue) {
    setFreeProductGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex
          ? {
              ...group,
              products: group.products.map((p, pi) => (pi === productIndex ? { ...p, [field]: fieldValue } : p)),
            }
          : group,
      ),
    )
  }

  function updateFreeProductGroupField(groupIndex, field, fieldValue) {
    setFreeProductGroups((prev) => prev.map((group, i) => (i === groupIndex ? { ...group, [field]: fieldValue } : group)))
  }

  function addRequirementCondition(groupIndex) {
    setRequirementGroups((prev) =>
      prev.map((group, i) => (i === groupIndex ? [...group, { ...EMPTY_CONDITION }] : group)),
    )
  }

  function removeRequirementCondition(groupIndex, conditionIndex) {
    setRequirementGroups((prev) =>
      prev.map((group, i) => (i === groupIndex ? group.filter((_, ci) => ci !== conditionIndex) : group)),
    )
  }

  function updateRequirementCondition(groupIndex, conditionIndex, field, fieldValue) {
    setRequirementGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex
          ? group.map((condition, ci) => (ci === conditionIndex ? { ...condition, [field]: fieldValue } : condition))
          : group,
      ),
    )
  }

  function addReward() {
    setRewards((prev) => [
      ...prev,
      { type: 'subtotal', valueType: 'percentage', value: '', cartLineMatch: { ...EMPTY_CONDITION } },
    ])
  }

  function removeReward(index) {
    setRewards((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  function updateReward(index, field, fieldValue) {
    setRewards((prev) =>
      prev.map((reward, i) => {
        if (i !== index) return reward
        const next = { ...reward, [field]: fieldValue }
        // "free" only makes sense for shipping rewards, same rule as the
        // simple-mode Reward section's own valueType switching.
        if (field === 'type' && fieldValue !== 'shipping' && next.valueType === 'free') {
          next.valueType = 'percentage'
        }
        return next
      }),
    )
  }

  function updateRewardCartLineMatch(index, field, fieldValue) {
    setRewards((prev) =>
      prev.map((reward, i) =>
        i === index ? { ...reward, cartLineMatch: { ...reward.cartLineMatch, [field]: fieldValue } } : reward,
      ),
    )
  }

  function handleAppliesToChange(next) {
    setAppliesTo(next)
    if (next === 'free_product') {
      // The Reward section becomes the product picker for this type — value/
      // valueType aren't shown, but the backend still requires 'free'.
      setValueType('free')
    } else if (next === 'line_item') {
      // Percentage-off-products only supports a percentage value.
      setValueType('percentage')
    } else if (valueType === 'free') {
      // "free" only makes sense for shipping/free-product; switching to
      // "order" with it selected would silently fail validation.
      setValueType('percentage')
    }
  }

  const [requireCoupon, setRequireCoupon] = useState(template.requireCoupon || false)
  const [couponCodes, setCouponCodes] = useState(template.couponCodes || [])
  const [couponCodeInput, setCouponCodeInput] = useState('')

  function handleAddCoupon() {
    const code = couponCodeInput.trim().toUpperCase()
    if (!code) return
    setCouponCodes((prev) => (prev.includes(code) ? prev : [...prev, code]))
    setCouponCodeInput('')
  }

  function handleRemoveCoupon(code) {
    setCouponCodes((prev) => prev.filter((c) => c !== code))
  }
  const [requireScheduling, setRequireScheduling] = useState(false)
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [requireSubtotalLimits, setRequireSubtotalLimits] = useState(template.requireSubtotalLimits || false)
  const [minSubtotal, setMinSubtotal] = useState(template.minSubtotal || '')
  const [maxSubtotal, setMaxSubtotal] = useState('')

  const [requireItemLimits, setRequireItemLimits] = useState(false)
  const [itemQuantityMethod, setItemQuantityMethod] = useState('total')
  const [minItemQuantity, setMinItemQuantity] = useState('')
  const [maxItemQuantity, setMaxItemQuantity] = useState('')

  const [requireProductRequirement, setRequireProductRequirement] = useState(false)
  const [productRequirementAttribute, setProductRequirementAttribute] = useState('sku')
  const [productRequirementOperator, setProductRequirementOperator] = useState('equals')
  const [productRequirementValue, setProductRequirementValue] = useState('')

  const [requireExcludeCustomers, setRequireExcludeCustomers] = useState(false)
  const [excludeCustomersText, setExcludeCustomersText] = useState('')

  const [compatibleWithOthers, setCompatibleWithOthers] = useState(false)
  const [compatibleDiscountIds, setCompatibleDiscountIds] = useState([])
  const [allDiscounts, setAllDiscounts] = useState([])

  const [customerGroups, setCustomerGroups] = useState([])
  const [requireCustomerGroups, setRequireCustomerGroups] = useState(false)
  const [selectedGroupIds, setSelectedGroupIds] = useState([])
  const [requireUsageLimit, setRequireUsageLimit] = useState(false)
  const [usageLimitPerCustomer, setUsageLimitPerCustomer] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    customerGroupsApi.list().then(setCustomerGroups).catch(() => setCustomerGroups([]))
  }, [])

  useEffect(() => {
    discountsApi.list().then(setAllDiscounts).catch(() => setAllDiscounts([]))
  }, [])

  function toggleCompatibleDiscountId(id) {
    setCompatibleDiscountIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleGroupId(id) {
    setSelectedGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }

  function handleNameChange(v) {
    setInternalName(v)
    if (!handleTouched) setHandle(slugify(v))
  }

  function handleHandleChange(v) {
    setHandleTouched(true)
    setHandle(slugify(v))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const validationError = validate({
      internalName,
      requireCoupon,
      couponCodes,
      mode,
      appliesTo,
      valueType,
      value,
      freeProductSku,
      lineItemSkusText,
      requireSubtotalLimits,
      minSubtotal,
      maxSubtotal,
      requireItemLimits,
      minItemQuantity,
      maxItemQuantity,
      requireProductRequirement,
      productRequirementValue,
      requireScheduling,
      startsAt,
      endsAt,
      requireCustomerGroups,
      selectedGroupIds,
      requireUsageLimit,
      usageLimitPerCustomer,
      requireExcludeCustomers,
      excludeCustomersText,
      requirementGroups,
      rewards,
      freeProductGroups,
    })
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    try {
      await discountsApi.create({
        name: internalName.trim(),
        handle: handle || slugify(internalName),
        publicName: publicName.trim(),
        description: description.trim(),
        status: enabled ? 'active' : 'draft',
        method: requireCoupon ? 'coupon' : 'automatic',
        couponCodes: requireCoupon ? couponCodes : [],
        mode,
        requirementGroups: mode === 'advanced' || mode === 'advanced_free_product'
          ? requirementGroups
              .map((group) => group.filter((c) => c.value.trim()).map((c) => ({ ...c, value: c.value.trim() })))
              .filter((group) => group.length > 0)
          : [],
        rewards: mode === 'advanced'
          ? rewards.map((r) => ({
              type: r.type,
              valueType: r.valueType,
              value: r.valueType === 'free' ? 0 : Number(r.value),
              cartLineMatch: r.type === 'cart_lines'
                ? { ...r.cartLineMatch, value: r.cartLineMatch.value.trim() }
                : null,
            }))
          : [],
        rewardApplication: mode === 'advanced' ? rewardApplication : 'all',
        freeProductGroups: mode === 'advanced_free_product'
          ? freeProductGroups
              .map((group) => ({
                products: group.products
                  .filter((p) => p.sku.trim())
                  .map((p) => ({
                    sku: p.sku.trim(),
                    quantity: p.quantity !== '' ? Number(p.quantity) : 1,
                    perQuantity: p.perQuantity !== '' ? Number(p.perQuantity) : null,
                  })),
                application: group.application,
                limitedMaxTimes: group.application === 'limited' && group.limitedMaxTimes !== '' ? Number(group.limitedMaxTimes) : null,
              }))
              .filter((group) => group.products.length > 0)
          : [],
        appliesTo,
        valueType,
        value: mode === 'advanced' || mode === 'advanced_free_product' ? 0 : appliesTo === 'free_product' ? 0 : valueType === 'free' ? 100 : Number(value),
        freeProductSku: appliesTo === 'free_product' ? freeProductSku.trim() : undefined,
        freeProductQuantity:
          appliesTo === 'free_product' ? (freeProductQuantity !== '' ? Number(freeProductQuantity) : 1) : undefined,
        freeProductPerQuantity:
          appliesTo === 'free_product' && freeProductPerQuantity !== '' ? Number(freeProductPerQuantity) : null,
        lineItemSkus: appliesTo === 'line_item' ? parseIdentifierList(lineItemSkusText) : [],
        currency,
        minSubtotal: requireSubtotalLimits && minSubtotal !== '' ? Number(minSubtotal) : null,
        maxSubtotal: requireSubtotalLimits && maxSubtotal !== '' ? Number(maxSubtotal) : null,
        itemQuantityMethod: requireItemLimits ? itemQuantityMethod : 'total',
        minItemQuantity: requireItemLimits && minItemQuantity !== '' ? Number(minItemQuantity) : null,
        maxItemQuantity: requireItemLimits && maxItemQuantity !== '' ? Number(maxItemQuantity) : null,
        productRequirement: requireProductRequirement
          ? { attribute: productRequirementAttribute, operator: productRequirementOperator, value: productRequirementValue.trim() }
          : null,
        startsAt: requireScheduling && startsAt ? startsAt : null,
        endsAt: requireScheduling && endsAt ? endsAt : null,
        customerGroupIds: requireCustomerGroups ? selectedGroupIds : [],
        usageLimitPerCustomer: requireUsageLimit && usageLimitPerCustomer !== '' ? Number(usageLimitPerCustomer) : null,
        excludedCustomerIdentifiers: requireExcludeCustomers ? parseIdentifierList(excludeCustomersText) : [],
        compatibleWithOthers,
        compatibleDiscountIds: compatibleWithOthers ? compatibleDiscountIds : [],
      })
      navigate('/discounts')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create discount')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/discounts" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        ‹ Discounts
      </Link>
      <h1 className="mt-1 text-2xl font-semibold text-gray-900">Create Discount</h1>
      <p className="mt-1 text-sm text-gray-500">
        Configure your discount requirements below.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Summary */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Summary</h2>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable this discount</p>
              <p className="mt-1 text-xs text-gray-500">
                A discount is only active when enabled and the date falls within the scheduled period.
              </p>
            </div>
            <ToggleSwitch checked={enabled} onChange={setEnabled} />
          </div>

          <div className="mt-5">
            <label className="mb-1 block text-sm font-medium text-gray-700">Discount Internal Name</label>
            <input
              required
              maxLength={45}
              value={internalName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. 20% off orders for new B2B customers"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
            <p className="mt-1 flex items-center justify-between text-xs text-gray-400">
              <span>This is only visible to you.</span>
              <span>{internalName.length}/45</span>
            </p>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Discount Handle (or ID)</label>
            <input
              maxLength={45}
              value={handle}
              onChange={(e) => handleHandleChange(e.target.value)}
              placeholder="e.g. 20-off-orders"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
            <p className="mt-1 flex items-center justify-between text-xs text-gray-400">
              <span>This is used to identify the discount within your store when an order is placed.</span>
              <span>{handle.length}/45</span>
            </p>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Discount Public Name</label>
            <input
              maxLength={45}
              value={publicName}
              onChange={(e) => setPublicName(e.target.value)}
              placeholder="e.g. 20% off your first B2B order"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
            <p className="mt-1 flex items-center justify-between text-xs text-gray-400">
              <span>This is shown to your customers when a discount is applied to their order.</span>
              <span>{publicName.length}/45</span>
            </p>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50 p-3">
            <InfoIcon />
            <p className="text-sm text-blue-800">
              The public name is what your customers will see on their cart and order when this discount is
              applied.
            </p>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              maxLength={280}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
            <p className="mt-1 flex items-center justify-between text-xs text-gray-400">
              <span>Internal notes about this discount — only visible to you.</span>
              <span>{description.length}/280</span>
            </p>
          </div>
        </section>

        {/* Type */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Type</h2>
          <div className="space-y-3">
            {TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-2 text-sm ${opt.enabled ? 'text-gray-700' : 'cursor-not-allowed text-gray-400'}`}
              >
                <input
                  type="radio"
                  name="type"
                  checked={
                    opt.enabled
                      ? opt.mode === 'advanced' || opt.mode === 'advanced_free_product'
                        ? mode === opt.mode
                        : mode === 'simple' && appliesTo === opt.appliesTo
                      : false
                  }
                  disabled={!opt.enabled}
                  onChange={() => opt.enabled && handleTypeOptionChange(opt)}
                  className="mt-0.5 h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                />
                <span>
                  <span className={`block ${opt.enabled ? 'font-medium text-gray-900' : ''}`}>{opt.label}</span>
                  {opt.note && <span className="block text-xs text-gray-400">{opt.note}</span>}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Advanced requirements and rewards / Advanced free products */}
        {(mode === 'advanced' || mode === 'advanced_free_product') && (
          <>
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-1 text-lg font-semibold text-gray-900">Advanced requirements</h2>
              <p className="mb-4 text-sm text-gray-500">
                The cart must match at least one group below — every condition inside a group must match (AND),
                any one group matching is enough (OR).
              </p>
              <div className="space-y-4">
                {requirementGroups.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    {groupIndex > 0 && (
                      <div className="my-3 flex items-center gap-2">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Or</span>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                    )}
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">Group {groupIndex + 1}</p>
                        {requirementGroups.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRequirementGroup(groupIndex)}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Remove group
                          </button>
                        )}
                      </div>
                      <div className="mt-3 space-y-3">
                        {group.map((condition, conditionIndex) => (
                          <div key={conditionIndex}>
                            {conditionIndex > 0 && (
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">And</p>
                            )}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Attribute</label>
                                <select
                                  value={condition.attribute}
                                  onChange={(e) => updateRequirementCondition(groupIndex, conditionIndex, 'attribute', e.target.value)}
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                >
                                  <option value="sku">SKU</option>
                                  <option value="tag">Tag</option>
                                  <option value="vendor">Vendor</option>
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Operator</label>
                                <select
                                  value={condition.operator}
                                  onChange={(e) => updateRequirementCondition(groupIndex, conditionIndex, 'operator', e.target.value)}
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                >
                                  <option value="equals">Must equal</option>
                                  <option value="contains">Contains</option>
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Value</label>
                                <input
                                  value={condition.value}
                                  onChange={(e) => updateRequirementCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                                  placeholder={condition.attribute === 'sku' ? 'e.g. B-40880' : condition.attribute === 'tag' ? 'e.g. sale' : 'e.g. Ella Stein'}
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                />
                              </div>
                              {group.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeRequirementCondition(groupIndex, conditionIndex)}
                                  aria-label="Remove condition"
                                  className="justify-self-start text-gray-400 hover:text-red-600 sm:justify-self-center sm:pb-2"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addRequirementCondition(groupIndex)}
                        className="mt-3 text-sm font-medium text-purple-600 hover:underline"
                      >
                        + Add condition (AND)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addRequirementGroup}
                className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                + Add OR group
              </button>
            </section>

            {mode === 'advanced' && (
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-1 text-lg font-semibold text-gray-900">Advanced rewards</h2>
              <p className="mb-4 text-sm text-gray-500">
                Every reward below fires when the requirements above match, subject to Reward application.
              </p>
              <div className="space-y-4">
                {rewards.map((reward, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">Reward {index + 1}</p>
                      {rewards.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeReward(index)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Remove reward
                        </button>
                      )}
                    </div>
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-medium text-gray-700">Reward type</label>
                      <select
                        value={reward.type}
                        onChange={(e) => updateReward(index, 'type', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none sm:w-1/2"
                      >
                        {Object.entries(REWARD_TYPE_LABELS).map(([type, label]) => (
                          <option key={type} value={type}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Value type</label>
                        <select
                          value={reward.valueType}
                          onChange={(e) => updateReward(index, 'valueType', e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                        >
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed amount</option>
                          {reward.type === 'shipping' && <option value="set_cost">Set cost (exact price)</option>}
                          {reward.type === 'shipping' && <option value="free">Free</option>}
                        </select>
                      </div>
                      {reward.valueType !== 'free' && (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">Value</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            max={reward.valueType === 'percentage' ? 100 : undefined}
                            value={reward.value}
                            onChange={(e) => updateReward(index, 'value', e.target.value)}
                            placeholder={reward.valueType === 'percentage' ? 'e.g. 10' : 'e.g. 10.00'}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                    {reward.type === 'cart_lines' && (
                      <div className="mt-3">
                        <p className="mb-1 text-xs font-medium text-gray-700">Applies to cart lines matching</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <select
                            value={reward.cartLineMatch.attribute}
                            onChange={(e) => updateRewardCartLineMatch(index, 'attribute', e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                          >
                            <option value="sku">SKU</option>
                            <option value="tag">Tag</option>
                            <option value="vendor">Vendor</option>
                          </select>
                          <select
                            value={reward.cartLineMatch.operator}
                            onChange={(e) => updateRewardCartLineMatch(index, 'operator', e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                          >
                            <option value="equals">Must equal</option>
                            <option value="contains">Contains</option>
                          </select>
                          <input
                            value={reward.cartLineMatch.value}
                            onChange={(e) => updateRewardCartLineMatch(index, 'value', e.target.value)}
                            placeholder={reward.cartLineMatch.attribute === 'sku' ? 'e.g. B-40880' : reward.cartLineMatch.attribute === 'tag' ? 'e.g. sale' : 'e.g. Ella Stein'}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addReward}
                className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                + Add reward
              </button>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="mb-2 text-sm font-medium text-gray-900">Reward application</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="rewardApplication"
                      checked={rewardApplication === 'all'}
                      onChange={() => setRewardApplication('all')}
                      className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    Apply all rewards
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="rewardApplication"
                      checked={rewardApplication === 'highest'}
                      onChange={() => setRewardApplication('highest')}
                      className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    Apply only the highest value reward
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="rewardApplication"
                      checked={rewardApplication === 'lowest'}
                      onChange={() => setRewardApplication('lowest')}
                      className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    Apply only the lowest value reward
                  </label>
                </div>
              </div>
            </section>
            )}

            {mode === 'advanced_free_product' && (
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-1 text-lg font-semibold text-gray-900">Advanced free product rewards</h2>
              <p className="mb-4 text-sm text-gray-500">
                Each requirement group above awards its own free product(s) below when it matches.
              </p>
              <div className="space-y-4">
                {freeProductGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="rounded-lg border border-gray-200 p-4">
                    <p className="mb-3 text-sm font-medium text-gray-900">Group {groupIndex + 1} reward</p>
                    <div className="space-y-3">
                      {group.products.map((product, productIndex) => (
                        <div key={productIndex} className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-gray-700">Product SKU</label>
                            <input
                              value={product.sku}
                              onChange={(e) => updateFreeProductInGroup(groupIndex, productIndex, 'sku', e.target.value)}
                              placeholder="e.g. B-40880"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                          <div className="w-20 shrink-0">
                            <label className="mb-1 block text-xs font-medium text-gray-700">Qty</label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={product.quantity}
                              onChange={(e) => updateFreeProductInGroup(groupIndex, productIndex, 'quantity', e.target.value)}
                              placeholder="1"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                          <div className="w-28 shrink-0">
                            <label className="mb-1 block text-xs font-medium text-gray-700">Per qty</label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={product.perQuantity}
                              onChange={(e) => updateFreeProductInGroup(groupIndex, productIndex, 'perQuantity', e.target.value)}
                              placeholder="Optional"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                          {group.products.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFreeProductFromGroup(groupIndex, productIndex)}
                              aria-label="Remove product"
                              className="pb-2 text-gray-400 hover:text-red-600"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addFreeProductToGroup(groupIndex)}
                      className="mt-3 text-sm font-medium text-purple-600 hover:underline"
                    >
                      + Add product
                    </button>

                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <p className="mb-2 text-sm font-medium text-gray-900">Application</p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name={`freeProductApplication-${groupIndex}`}
                            checked={group.application === 'once'}
                            onChange={() => updateFreeProductGroupField(groupIndex, 'application', 'once')}
                            className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          Once — added a single time when the requirements are met
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name={`freeProductApplication-${groupIndex}`}
                            checked={group.application === 'recursive'}
                            onChange={() => updateFreeProductGroupField(groupIndex, 'application', 'recursive')}
                            className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          Recursively — added again every time "Per qty" is reached, with no limit
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name={`freeProductApplication-${groupIndex}`}
                            checked={group.application === 'limited'}
                            onChange={() => updateFreeProductGroupField(groupIndex, 'application', 'limited')}
                            className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          Limited — same as recursively, capped at a maximum number of times
                        </label>
                      </div>
                      {group.application === 'limited' && (
                        <div className="mt-2 ml-6 w-32">
                          <label className="mb-1 block text-xs font-medium text-gray-700">Maximum times</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={group.limitedMaxTimes}
                            onChange={(e) => updateFreeProductGroupField(groupIndex, 'limitedMaxTimes', e.target.value)}
                            placeholder="e.g. 3"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            )}
          </>
        )}

        {/* Reward */}
        {mode === 'simple' && (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Reward</h2>

          {appliesTo === 'free_product' ? (
            <div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Product SKU</label>
                  <input
                    value={freeProductSku}
                    onChange={(e) => {
                      setFreeProductSku(e.target.value)
                      setShowFreeProductDropdown(true)
                    }}
                    onFocus={() => setShowFreeProductDropdown(true)}
                    onBlur={() => setTimeout(() => setShowFreeProductDropdown(false), 150)}
                    placeholder="Search by SKU or product name"
                    autoComplete="off"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  />
                  {showFreeProductDropdown && freeProductResults.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                      {freeProductResults.map(({ group, variant }) => (
                        <button
                          type="button"
                          key={variant.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectFreeProduct(variant)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
                        >
                          {variant.image ? (
                            <img src={variant.image} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                          ) : (
                            <div className="h-8 w-8 shrink-0 rounded bg-gray-200" />
                          )}
                          <span className="min-w-0 text-sm">
                            <span className="block truncate font-medium text-gray-900">
                              {group.title}
                              {variant.variantTitle && variant.variantTitle !== 'Default Title' ? ` - ${variant.variantTitle}` : ''}
                            </span>
                            <span className="block text-xs text-gray-500">SKU: {variant.sku}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-24 shrink-0">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={freeProductQuantity}
                    onChange={(e) => setFreeProductQuantity(e.target.value)}
                    placeholder="1"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Award again every</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={freeProductPerQuantity}
                  onChange={(e) => setFreeProductPerQuantity(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
                <span className="text-sm text-gray-500">items in the cart (leave blank for a fixed quantity)</span>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Search by SKU or product name, then select the product that should be added to the order at no additional cost to the customer.
              </p>
            </div>
          ) : appliesTo === 'line_item' ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Product SKUs</label>
              <textarea
                rows={3}
                value={lineItemSkusText}
                onChange={(e) => setLineItemSkusText(e.target.value)}
                placeholder={'One per line or comma-separated, e.g.\nB-40880\nB-40881'}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                Enter up to 25 SKUs. The percentage below is taken off the price of any matching line item.
              </p>
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Percentage off</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max="100"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none sm:w-1/2"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="valueType"
                    checked={valueType === 'percentage'}
                    onChange={() => setValueType('percentage')}
                    className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  {appliesTo === 'shipping' ? 'Percentage off shipping (e.g. 10% off)' : 'Percentage discount (e.g. 10% off)'}
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="valueType"
                    checked={valueType === 'fixed'}
                    onChange={() => setValueType('fixed')}
                    className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  {appliesTo === 'shipping' ? 'Fixed amount off shipping (e.g. US$10 off)' : 'Fixed amount discount (e.g. US$100 off)'}
                </label>
                {appliesTo === 'shipping' && (
                  <>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="valueType"
                        checked={valueType === 'set_cost'}
                        onChange={() => setValueType('set_cost')}
                        className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      Set cost shipping (e.g. set exact shipping charge to US$15)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="valueType"
                        checked={valueType === 'free'}
                        onChange={() => setValueType('free')}
                        className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      Free shipping
                    </label>
                  </>
                )}
              </div>

              {valueType !== 'free' && (
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {valueType === 'percentage'
                      ? 'Percentage off'
                      : valueType === 'set_cost'
                      ? 'Set exact shipping cost to'
                      : 'Fixed amount off'}
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={valueType === 'percentage' ? 100 : undefined}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={
                        valueType === 'percentage'
                          ? 'e.g. 10'
                          : valueType === 'set_cost'
                          ? 'e.g. 15.00'
                          : 'e.g. 100.00'
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none sm:w-1/2"
                    />
                    {(valueType === 'fixed' || valueType === 'set_cost') && (
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    {appliesTo === 'shipping'
                      ? valueType === 'set_cost'
                        ? 'The order shipping fee will be fixed to this exact amount.'
                        : 'This will be applied against the shipping cost of the order.'
                      : 'This will be applied against the sub-total of the order excluding tax ("net").'}
                  </p>
                </div>
              )}
            </>
          )}
        </section>
        )}

        {/* Requirements */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Requirements</h2>
          <p className="mb-4 mt-1 text-sm text-gray-500">
            You can restrict when a discount is applied by requiring the customer to meet specific rules.
          </p>

          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={requireCoupon}
                  onChange={(e) => setRequireCoupon(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="flex flex-1 items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-purple-50 text-purple-600">
                    <ReceiptPercentIcon />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-gray-900">Coupon codes</span>
                    <span className="block text-xs text-gray-500">Require a coupon code to use this discount</span>
                  </span>
                </span>
              </label>
              {requireCoupon && (
                <div className="ml-9 mt-3 rounded-lg bg-gray-50 p-4">
                  <p className="mb-2 text-sm font-medium text-gray-900">Add a coupon code</p>
                  <div className="flex gap-2">
                    <input
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCoupon()
                        }
                      }}
                      placeholder="e.g. MYDISCOUNT"
                      className="w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm uppercase focus:border-purple-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCoupon}
                      className="shrink-0 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Add coupon
                    </button>
                  </div>
                  {couponCodes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {couponCodes.map((code) => (
                        <span
                          key={code}
                          className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700"
                        >
                          {code}
                          <button
                            type="button"
                            onClick={() => handleRemoveCoupon(code)}
                            aria-label={`Remove ${code}`}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    If a coupon is specified, a coupon entry field will show during the checkout.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={requireScheduling}
                  onChange={(e) => setRequireScheduling(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="flex flex-1 items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-purple-50 text-purple-600">
                    <CalendarIcon />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-gray-900">Scheduling</span>
                    <span className="block text-xs text-gray-500">Limit the discount to a specific date range</span>
                  </span>
                </span>
              </label>
              {requireScheduling && (
                <div className="ml-9 mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Start date</label>
                    <input
                      type="date"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">End date</label>
                    <input
                      type="date"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={requireSubtotalLimits}
                  onChange={(e) => setRequireSubtotalLimits(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="flex flex-1 items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-purple-50 text-purple-600">
                    <SubtotalIcon />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-gray-900">Order sub-total limits</span>
                    <span className="block text-xs text-gray-500">Require a minimum or maximum order sub-total</span>
                  </span>
                </span>
              </label>
              {requireSubtotalLimits && (
                <div className="ml-9 mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Minimum subtotal</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={minSubtotal}
                      onChange={(e) => setMinSubtotal(e.target.value)}
                      placeholder="No minimum"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Maximum subtotal</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={maxSubtotal}
                      onChange={(e) => setMaxSubtotal(e.target.value)}
                      placeholder="No maximum"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={requireItemLimits}
                  onChange={(e) => setRequireItemLimits(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="flex flex-1 items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-purple-50 text-purple-600">
                    <CartIcon />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-gray-900">Order item limits</span>
                    <span className="block text-xs text-gray-500">Require a minimum or maximum number of items</span>
                  </span>
                </span>
              </label>
              {requireItemLimits && (
                <div className="ml-9 mt-3 space-y-3">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="itemQuantityMethod"
                        checked={itemQuantityMethod === 'total'}
                        onChange={() => setItemQuantityMethod('total')}
                        className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      Total quantity across all items
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="itemQuantityMethod"
                        checked={itemQuantityMethod === 'unique'}
                        onChange={() => setItemQuantityMethod('unique')}
                        className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      Number of unique items in cart
                    </label>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Minimum quantity</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={minItemQuantity}
                        onChange={(e) => setMinItemQuantity(e.target.value)}
                        placeholder="No minimum"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Maximum quantity</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={maxItemQuantity}
                        onChange={(e) => setMaxItemQuantity(e.target.value)}
                        placeholder="No maximum"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {mode === 'simple' && (
            <div className="rounded-lg border border-gray-200 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={requireProductRequirement}
                  onChange={(e) => setRequireProductRequirement(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="flex flex-1 items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-purple-50 text-purple-600">
                    <TagIcon2 />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-gray-900">Product requirements</span>
                    <span className="block text-xs text-gray-500">Only apply when the cart contains a matching product</span>
                  </span>
                </span>
              </label>
              {requireProductRequirement && (
                <div className="ml-9 mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Attribute</label>
                    <select
                      value={productRequirementAttribute}
                      onChange={(e) => setProductRequirementAttribute(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                    >
                      <option value="sku">SKU</option>
                      <option value="tag">Tag</option>
                      <option value="vendor">Vendor</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Operator</label>
                    <select
                      value={productRequirementOperator}
                      onChange={(e) => setProductRequirementOperator(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                    >
                      <option value="equals">Must equal</option>
                      <option value="contains">Contains</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Value</label>
                    <input
                      value={productRequirementValue}
                      onChange={(e) => setProductRequirementValue(e.target.value)}
                      placeholder={productRequirementAttribute === 'sku' ? 'e.g. B-40880' : productRequirementAttribute === 'tag' ? 'e.g. sale' : 'e.g. Ella Stein'}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
            )}

            <div className="rounded-lg border border-gray-200 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={requireCustomerGroups}
                  onChange={(e) => setRequireCustomerGroups(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="flex flex-1 items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-purple-50 text-purple-600">
                    <UserGroupIcon />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-gray-900">Customer groups</span>
                    <span className="block text-xs text-gray-500">Limit discount to specific customer groups</span>
                  </span>
                </span>
              </label>
              {requireCustomerGroups && (
                <div className="ml-9 mt-3 space-y-2">
                  {customerGroups.length === 0 ? (
                    <p className="text-xs text-gray-400">No customer groups yet — create one under Customers first.</p>
                  ) : (
                    customerGroups.map((group) => (
                      <label key={group._id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.includes(group._id)}
                          onChange={() => toggleGroupId(group._id)}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        {group.name}
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={requireUsageLimit}
                  onChange={(e) => setRequireUsageLimit(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="flex flex-1 items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-purple-50 text-purple-600">
                    <XCircleIcon />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-gray-900">Usage limits</span>
                    <span className="block text-xs text-gray-500">Limit number of uses per customer</span>
                  </span>
                </span>
              </label>
              {requireUsageLimit && (
                <div className="ml-9 mt-3">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Uses per customer</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={usageLimitPerCustomer}
                    onChange={(e) => setUsageLimitPerCustomer(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none sm:w-1/2"
                  />
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={requireExcludeCustomers}
                  onChange={(e) => setRequireExcludeCustomers(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="flex flex-1 items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-purple-50 text-purple-600">
                    <UserMinusIcon />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-gray-900">Exclude customers</span>
                    <span className="block text-xs text-gray-500">Exclude specific customers from this discount</span>
                  </span>
                </span>
              </label>
              {requireExcludeCustomers && (
                <div className="ml-9 mt-3">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Emails or customer IDs</label>
                  <textarea
                    rows={3}
                    value={excludeCustomersText}
                    onChange={(e) => setExcludeCustomersText(e.target.value)}
                    placeholder={'One per line or comma-separated, e.g.\nbuyer@example.com\n8123456789'}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={compatibleWithOthers}
                  onChange={(e) => setCompatibleWithOthers(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="flex flex-1 items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-purple-50 text-purple-600">
                    <CombineIcon />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-gray-900">Compatible discounts</span>
                    <span className="block text-xs text-gray-500">
                      This discount can be used in conjunction with all other discounts by default. Enable this to
                      restrict it to only combine with specific discounts.
                    </span>
                  </span>
                </span>
              </label>
              {compatibleWithOthers && (
                <div className="ml-9 mt-3">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Select compatible discounts</label>
                  {allDiscounts.length === 0 ? (
                    <p className="text-xs text-gray-400">No other discounts yet.</p>
                  ) : (
                    <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-gray-300 p-2">
                      {allDiscounts.map((d) => (
                        <label key={d._id} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={compatibleDiscountIds.includes(d._id)}
                            onChange={() => toggleCompatibleDiscountId(d._id)}
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          {d.name}
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Select all the discounts that can be used alongside this discount within the same order. If none
                    are selected, all discounts may be used.
                  </p>
                </div>
              )}
            </div>

            {UPCOMING_REQUIREMENTS.map((req) => (
              <div key={req.key} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 opacity-60">
                <input type="checkbox" disabled className="mt-0.5 h-4 w-4 rounded border-gray-300" />
                <span className="flex flex-1 items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-200 text-gray-500">
                    <LockIcon />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-gray-500">{req.label}</span>
                    <span className="block text-xs text-gray-400">{req.description}</span>
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500">
                  Coming soon
                </span>
              </div>
            ))}
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <Link
            to="/discounts"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create Discount'}
          </button>
        </div>
      </form>
    </div>
  )
}
