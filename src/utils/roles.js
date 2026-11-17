// Role helpers shared by the customer pages. Roles come from the Roles page
// (built-in and custom), so names and "is this a sales role" are never
// hardcoded to a fixed list.

export const CUSTOMER_ROLE = 'customer'

export function isAgentRole(role) {
  return !!role && role !== CUSTOMER_ROLE
}

// Display name for a role key: "Standard" for plain customers, the role's own
// name otherwise, and the raw key if the role no longer exists.
export function roleName(roles, key) {
  if (!key || key === CUSTOMER_ROLE) return 'Standard'
  return roles.find((r) => r.key === key)?.name || key
}

// Whether a role can act for every customer (its "Order for a customer"
// permission is set to every customer), following the role it inherits from.
export function hasGlobalScope(roles, key) {
  let roleKey = key
  for (let depth = 0; roleKey && depth < 6; depth++) {
    const role = roles.find((r) => r.key === roleKey)
    if (!role) return false

    const entry = role.permissions.find((p) => p.key === 'customer.context.enter')
    if (entry) return entry.effect === 'allow' && entry.constraints?.scope === 'all'

    roleKey = role.inheritsFrom
  }
  return false
}
