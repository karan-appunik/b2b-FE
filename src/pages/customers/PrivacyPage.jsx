import { useEffect, useState } from 'react'
import * as privacyApi from '../../api/privacy.api'
import * as approvalsApi from '../../api/approvals.api'
import * as customersApi from '../../api/customers.api'
import { isAgentRole } from '../../utils/roles'

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all'

const selectClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-xs focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all'

const KINDS = [
  { key: 'contextsDays', label: 'Finished Customer Sessions', desc: 'Agent mode temporary browsing sessions' },
  { key: 'notificationsDays', label: 'Notifications', desc: 'In-app agent notification records' },
  { key: 'closedQuotesDays', label: 'Closed Quotes', desc: 'Declined, expired, withdrawn, or converted quotes' },
  { key: 'inactiveCartsDays', label: 'Inactive Abandoned Carts', desc: 'Saved carts untouched by any agent' },
]

function saveJson(data, name) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
        checked
          ? 'border-purple-200 bg-purple-50/40 hover:bg-purple-50/70'
          : 'border-gray-200 bg-white hover:bg-gray-50/60'
      }`}
    >
      <div className="flex flex-col pr-2">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        {description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.stopPropagation()
          onChange(!checked)
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-purple-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

export default function PrivacyPage() {
  const [policy, setPolicy] = useState(null)
  const [days, setDays] = useState({})
  const [preview, setPreview] = useState(null)
  const [holds, setHolds] = useState([])
  const [requests, setRequests] = useState([])
  const [customers, setCustomers] = useState([])
  const [holdForm, setHoldForm] = useState({ scope: 'customer', customerId: '', reason: '' })
  const [requestForm, setRequestForm] = useState({ customerId: '', type: 'access' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [runningPurge, setRunningPurge] = useState(false)
  const [placingHold, setPlacingHold] = useState(false)
  const [processingRequest, setProcessingRequest] = useState(false)

  function load() {
    privacyApi.retention().then((d) => {
      setPolicy(d.policy)
      setPreview(d.preview)
      setDays(Object.fromEntries(KINDS.map(({ key }) => [key, String(d.policy[key])])))
    })
    privacyApi.holds().then((d) => setHolds(d.holds))
    privacyApi.requests().then((d) => setRequests(d.requests))
  }

  useEffect(() => {
    load()
    customersApi.list().then((all) => {
      const list = Array.isArray(all) ? all : all.customers || []
      setCustomers(list.filter((c) => !isAgentRole(c.role)))
    })
  }, [])

  async function run(fn, done) {
    setMessage('')
    setError('')
    try {
      const result = await fn()
      if (done) setMessage(done(result))
      load()
      return result
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.')
      return null
    }
  }

  const saveSchedule = async () => {
    setSavingSchedule(true)
    await run(
      () =>
        approvalsApi.updateSettings({
          retention: { autoPurge: policy.autoPurge, ...Object.fromEntries(KINDS.map(({ key }) => [key, Number(days[key])])) },
        }),
      () => 'Retention schedule saved successfully.',
    )
    setSavingSchedule(false)
  }

  const deleteNow = async () => {
    if (!window.confirm('Delete everything the retention schedule marks as expired? Held customers will be skipped. This action cannot be undone.')) return
    setRunningPurge(true)
    await run(
      () => privacyApi.runRetention(false),
      (r) =>
        r.skippedBecause
          ? 'Purge skipped: A legal hold currently covers the entire shop.'
          : `Purge completed: Deleted ${r.contexts} sessions, ${r.notifications} notifications, ${r.closedQuotes} quotes, and ${r.inactiveCarts} carts.`,
    )
    setRunningPurge(false)
  }

  const placeHold = async (e) => {
    if (e) e.preventDefault()
    setPlacingHold(true)
    await run(() => privacyApi.placeHold(holdForm), () => 'Legal hold placed successfully.')
    setHoldForm({ scope: 'customer', customerId: '', reason: '' })
    setPlacingHold(false)
  }

  async function submitRequest(e) {
    if (e) e.preventDefault()
    if (requestForm.type === 'erasure' && !window.confirm('Erase this customer’s profile data? Orders, sent quotes, and activity logs are permanently retained. This action cannot be undone.')) return
    setProcessingRequest(true)
    const result = await run(() => privacyApi.createRequest(requestForm))
    setProcessingRequest(false)
    if (!result) return
    if (result.request.status === 'refused') {
      setError(
        {
          LEGAL_HOLD: 'Action Refused: This customer is currently protected under an active legal hold.',
          AGENT_ACCOUNT: 'Action Refused: This account is assigned to a sales agent. Change their role before requesting erasure.',
          ALREADY_ERASED: 'Action Refused: This customer account was already erased.',
        }[result.request.refusedReason] || 'Request refused.',
      )
    } else if (result.data) {
      saveJson(result.data, `customer-${requestForm.customerId}-data.json`)
      setMessage('Customer data export was successfully downloaded.')
    } else {
      setMessage(result.shopifyNote || 'Customer data successfully erased.')
    }
  }

  if (!policy) {
    return (
      <div className="mx-auto flex h-64 w-full max-w-5xl items-center justify-center text-sm text-gray-500">
        <svg className="mr-2 h-5 w-5 animate-spin text-purple-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span>Loading privacy and retention policy…</span>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Privacy & Data Retention</h1>
            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 border border-purple-100">
              GDPR & Compliance
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 max-w-2xl leading-relaxed">
            Manage data lifecycle timelines, enforce legal holds that freeze deletion, and fulfill customer data access or erasure requests.
            The audit activity log is tamper-proof and perpetually preserved.
          </p>
        </div>

        <button
          type="button"
          onClick={saveSchedule}
          disabled={savingSchedule}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600/30 transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          {savingSchedule ? (
            <>
              <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Saving…</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Save schedule</span>
            </>
          )}
        </button>
      </div>

      {/* Status Messages */}
      {message && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50/80 p-4 text-sm font-medium text-green-800 shadow-xs animate-in fade-in duration-200">
          <svg className="h-5 w-5 shrink-0 text-green-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm font-medium text-red-800 shadow-xs animate-in fade-in duration-200">
          <svg className="h-5 w-5 shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Retention Schedule */}
      <section className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col gap-1 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 text-sm font-bold">
              🗓️
            </span>
            <h2 className="text-base font-bold text-gray-900">Data Retention Schedule</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Specify how many days records must be retained before becoming eligible for automatic or manual deletion (minimum 30 days).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {KINDS.map(({ key, label, desc }) => {
            const previewKey = {
              contextsDays: 'contexts',
              notificationsDays: 'notifications',
              closedQuotesDays: 'closedQuotes',
              inactiveCartsDays: 'inactiveCarts',
            }[key]
            const expiredCount = preview ? preview[previewKey] : 0

            return (
              <div key={key} className="flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/40 p-4 hover:border-purple-200 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-900">{label}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      expiredCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      Old enough: <strong>{expiredCount}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{desc}</p>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="30"
                    value={days[key] || ''}
                    onChange={(e) => setDays((d) => ({ ...d, [key]: e.target.value }))}
                    className={inputClass}
                    placeholder="30"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs text-gray-400">
                    days
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-2">
          <ToggleSwitch
            checked={policy.autoPurge}
            onChange={(val) => setPolicy((p) => ({ ...p, autoPurge: val }))}
            label="Automatic Daily Purge"
            description="Run an automated background clean-up task every midnight to delete records exceeding the retention schedule."
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Records under an active legal hold are automatically protected and skipped from purging.
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={deleteNow}
              disabled={runningPurge}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
            >
              {runningPurge ? (
                <span>Purging records…</span>
              ) : (
                <>
                  <svg className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Delete what is old enough now</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={saveSchedule}
              disabled={savingSchedule}
              className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              Save schedule
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: Legal Holds */}
      <section className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col gap-1 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 text-sm font-bold">
              ⚖️
            </span>
            <h2 className="text-base font-bold text-gray-900">Legal Holds</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            While an active legal hold stands, all data for that specific customer (or across the entire shop) is strictly locked against deletion or erasure.
          </p>
        </div>

        {/* Place Hold Form */}
        <form onSubmit={placeHold} className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 space-y-3">
          <span className="block text-xs font-bold uppercase tracking-wider text-gray-700">Place New Legal Hold</span>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Scope</label>
              <select
                value={holdForm.scope}
                onChange={(e) => setHoldForm((f) => ({ ...f, scope: e.target.value }))}
                className={selectClass}
              >
                <option value="customer">One Customer</option>
                <option value="shop">Entire Store (All Data)</option>
              </select>
            </div>

            {holdForm.scope === 'customer' ? (
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Select Customer</label>
                <select
                  value={holdForm.customerId}
                  onChange={(e) => setHoldForm((f) => ({ ...f, customerId: e.target.value }))}
                  className={selectClass}
                  required
                >
                  <option value="">Choose a customer…</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>{c.name || c.email}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center pt-5">
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 w-full">
                  ⚠️ Freezes all records shop-wide
                </span>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Hold Justification / Reason</label>
              <input
                type="text"
                placeholder="e.g. Audit review, Litigation hold"
                value={holdForm.reason}
                onChange={(e) => setHoldForm((f) => ({ ...f, reason: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={placingHold || (holdForm.scope === 'customer' && !holdForm.customerId)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {placingHold ? 'Placing hold…' : 'Place hold'}
            </button>
          </div>
        </form>

        {/* Holds List */}
        <div className="space-y-2.5">
          <span className="block text-xs font-bold uppercase tracking-wider text-gray-700">Active & Historical Holds</span>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {holds.map((h) => {
              const isReleased = !!h.releasedAt
              return (
                <div key={h._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">
                        {h.scope === 'shop' ? 'Shop-Wide Hold (All Customers)' : h.customer?.name || 'Customer Account'}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isReleased ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {isReleased ? 'Released' : 'Active Hold'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Reason: <strong className="text-gray-700 font-medium">"{h.reason}"</strong> · Placed on {new Date(h.createdAt).toLocaleDateString()}
                      {isReleased && ` · Released on ${new Date(h.releasedAt).toLocaleDateString()}`}
                    </div>
                  </div>

                  {!isReleased && (
                    <button
                      type="button"
                      onClick={() => run(() => privacyApi.releaseHold(h._id), () => 'Legal hold released.')}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer self-start sm:self-center"
                    >
                      Release hold
                    </button>
                  )}
                </div>
              )
            })}
            {holds.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-400">
                No active or past legal holds recorded.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: Data Subject Requests (GDPR / CCPA) */}
      <section className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col gap-1 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-sm font-bold">
              👤
            </span>
            <h2 className="text-base font-bold text-gray-900">Customer Data Requests (Access & Erasure)</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Fulfill GDPR / CCPA requests by exporting all data stored on a customer, or erasing their profile data.
            Completed orders, legally binding invoices, and audit chains remain permanently archived.
          </p>
        </div>

        {/* Create Request Form */}
        <form onSubmit={submitRequest} className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 space-y-3">
          <span className="block text-xs font-bold uppercase tracking-wider text-gray-700">Submit Access / Erasure Action</span>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Select Customer</label>
              <select
                value={requestForm.customerId}
                onChange={(e) => setRequestForm((f) => ({ ...f, customerId: e.target.value }))}
                className={selectClass}
                required
              >
                <option value="">Choose a customer…</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>{c.name || c.email}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Request Type</label>
              <select
                value={requestForm.type}
                onChange={(e) => setRequestForm((f) => ({ ...f, type: e.target.value }))}
                className={selectClass}
              >
                <option value="access">Access: Export JSON Data File</option>
                <option value="erasure">Erasure: Right to be Forgotten</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={processingRequest || !requestForm.customerId}
                className={`w-full rounded-xl py-2.5 px-4 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                  requestForm.type === 'erasure'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {processingRequest ? (
                  'Processing…'
                ) : requestForm.type === 'erasure' ? (
                  'Erase Profile Data'
                ) : (
                  'Export Data File'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Requests Audit Log */}
        <div className="space-y-2.5">
          <span className="block text-xs font-bold uppercase tracking-wider text-gray-700">Request Audit Log</span>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {requests.map((r) => {
              const isAccess = r.type === 'access'
              return (
                <div key={r._id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isAccess ? 'text-purple-700' : 'text-red-700'}`}>
                        {isAccess ? '📄 Data Export (Access)' : '🗑️ Erasure Request'}
                      </span>
                      <span className="font-semibold text-gray-900">{r.customer?.name || 'Customer'}</span>
                    </div>
                    <p className="text-gray-500">
                      Submitted on {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      r.status === 'fulfilled'
                        ? 'bg-green-100 text-green-800'
                        : r.status === 'refused'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {r.status}
                      {r.refusedReason ? ` (${r.refusedReason.toLowerCase().replace('_', ' ')})` : ''}
                    </span>
                  </div>
                </div>
              )
            })}
            {requests.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-400">
                No access or erasure requests recorded yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
