const DEFAULT_PAYMENT_METHODS = { invoice: false, onAccount: false, cardAtCheckout: false }
const DEFAULT_ORDER_LIMITS = {
  valueBased: { enabled: false, minValue: 0 },
  unitBased: { enabled: false, minUnits: 0 },
}

export { DEFAULT_PAYMENT_METHODS, DEFAULT_ORDER_LIMITS }

export function PaymentMethodsSection({ isBase, override, onOverrideChange, value, onChange, baseValue }) {
  const shown = override || isBase ? value : baseValue || DEFAULT_PAYMENT_METHODS
  const disabled = !isBase && !override

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Payment methods</h2>
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
      <p className="mb-3 text-sm text-gray-500">
        Payment methods for this group (select all that apply).
      </p>
      <div className="space-y-2">
        {[
          ['invoice', 'Pay by invoice', 'Allow customers to place an order and invoice them later'],
          ['onAccount', 'Payment on account', 'Allow customers to place orders on account, e.g. net terms and credit'],
          ['cardAtCheckout', 'Card at checkout', 'Allow customers to pay online by card'],
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
    </section>
  )
}

export function OrderLimitsSection({ isBase, override, onOverrideChange, value, onChange, baseValue }) {
  const shown = override || isBase ? value : baseValue || DEFAULT_ORDER_LIMITS
  const disabled = !isBase && !override

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Minimum order requirements</h2>
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
      <div className="space-y-3">
        <div>
          <label className={`flex items-center gap-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            <input
              type="checkbox"
              disabled={disabled}
              checked={shown.valueBased.enabled}
              onChange={(e) =>
                onChange({ ...value, valueBased: { ...value.valueBased, enabled: e.target.checked } })
              }
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
            />
            Value based minimum (e.g. minimum order value)
          </label>
          {shown.valueBased.enabled && (
            <input
              type="number"
              min="0"
              step="0.01"
              disabled={disabled}
              placeholder="e.g. 500"
              value={shown.valueBased.minValue}
              onChange={(e) =>
                onChange({
                  ...value,
                  valueBased: { ...value.valueBased, minValue: Number(e.target.value) },
                })
              }
              className="mt-2 ml-6 w-40 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
            />
          )}
        </div>
        <div>
          <label className={`flex items-center gap-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            <input
              type="checkbox"
              disabled={disabled}
              checked={shown.unitBased.enabled}
              onChange={(e) =>
                onChange({ ...value, unitBased: { ...value.unitBased, enabled: e.target.checked } })
              }
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
            />
            Unit based minimum (e.g. minimum number of items)
          </label>
          {shown.unitBased.enabled && (
            <input
              type="number"
              min="0"
              disabled={disabled}
              placeholder="e.g. 10"
              value={shown.unitBased.minUnits}
              onChange={(e) =>
                onChange({
                  ...value,
                  unitBased: { ...value.unitBased, minUnits: Number(e.target.value) },
                })
              }
              className="mt-2 ml-6 w-40 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
            />
          )}
        </div>
      </div>
    </section>
  )
}
