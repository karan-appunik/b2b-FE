// Labels and formatting shared by the approval screens.

export const TYPE_LABELS = {
  UNIT_PRICE: 'Unit price',
  ORDER_DISCOUNT: 'Order discount',
  QUANTITY_RULE: 'Quantity rule',
  SHIPPING_PRICE: 'Shipping price',
  CUSTOM_LINE: 'Custom line',
  ADDRESS: 'One-off delivery address',
  CREDIT_LIMIT: 'Credit limit',
  ORDER_APPROVAL: 'Whole order',
}

export const REASON_LABELS = {
  VOLUME_COMMITMENT: 'Volume commitment',
  COMPETITOR_MATCH: 'Competitor match',
  LOYALTY: 'Loyalty',
  CONTRACT_TERMS: 'Contract terms',
  DAMAGED_OR_CLOSEOUT: 'Damaged or closeout',
  SERVICE_RECOVERY: 'Service recovery',
  OTHER: 'Other',
}

export const STATUS_LABELS = {
  REQUESTED: 'Requested',
  AUTO_APPROVED: 'Auto-approved',
  PENDING_APPROVAL: 'Waiting for approval',
  DENIED: 'Denied',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  APPLIED: 'Used on an order',
  INVALIDATED: 'Cart changed',
}

export const STATUS_STYLES = {
  PENDING_APPROVAL: 'bg-amber-50 text-amber-800',
  APPROVED: 'bg-green-50 text-green-700',
  AUTO_APPROVED: 'bg-green-50 text-green-700',
  APPLIED: 'bg-sky-50 text-sky-700',
  REJECTED: 'bg-red-50 text-red-700',
  DENIED: 'bg-red-50 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-gray-100 text-gray-500',
  INVALIDATED: 'bg-gray-100 text-gray-500',
  REQUESTED: 'bg-gray-100 text-gray-500',
}

// Amounts are stored in minor units (cents). A quantity rule is a plain count.
export function formatMoney(money) {
  if (!money) return '—'
  if (money.currency === 'QTY') return String(money.amount)

  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: money.currency }).format(
      money.amount / 100,
    )
  } catch {
    return `${money.amount / 100} ${money.currency}`
  }
}

export function formatDelta(delta) {
  if (delta === null || delta === undefined) return '—'
  return `${delta}%`
}
