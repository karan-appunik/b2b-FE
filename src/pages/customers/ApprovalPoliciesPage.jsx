import { useEffect, useState } from 'react'
import * as approvalsApi from '../../api/approvals.api'
import * as rolesApi from '../../api/roles.api'
import { TYPE_LABELS } from '../../utils/overrides'

const EMPTY_FORM = {
  name: '',
  overrideType: 'ANY',
  priority: '100',
  effect: 'route',
  maxDeltaPercent: '',
  approverRoles: [],
  slaHours: '24',
  selfApprovalAllowed: false,
  selfApprovalMaxPercent: '',
  commentRequiredAbovePercent: '',
  active: true,
}

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all'

const selectClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-xs focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all'

function toForm(policy) {
  const text = (v) => (v === null || v === undefined ? '' : String(v))
  return {
    name: policy.name,
    overrideType: policy.overrideType,
    priority: text(policy.priority),
    effect: policy.effect,
    maxDeltaPercent: text(policy.maxDeltaPercent),
    approverRoles: policy.approverRoles || [],
    slaHours: text(policy.slaHours),
    selfApprovalAllowed: !!policy.selfApprovalAllowed,
    selfApprovalMaxPercent: text(policy.selfApprovalMaxPercent),
    commentRequiredAbovePercent: text(policy.commentRequiredAbovePercent),
    active: policy.active !== false,
  }
}

function toPayload(form) {
  const percent = (v) => (v === '' ? null : Number(v))
  return {
    name: form.name,
    overrideType: form.overrideType,
    priority: Number(form.priority),
    effect: form.effect,
    maxDeltaPercent: percent(form.maxDeltaPercent),
    approverRoles: form.approverRoles,
    slaHours: Number(form.slaHours),
    selfApprovalAllowed: form.selfApprovalAllowed,
    selfApprovalMaxPercent: percent(form.selfApprovalMaxPercent),
    commentRequiredAbovePercent: percent(form.commentRequiredAbovePercent),
    active: form.active,
  }
}

const NOTIFICATION_TYPES = [
  ['approval.requested', 'Approval requested'],
  ['approval.decided', 'Approval decided'],
  ['approval.overdue', 'Approval overdue'],
  ['quote.expiring', 'Quote expiring'],
  ['quote.responded', 'Quote answered'],
  ['digest.daily', 'Daily summary'],
  ['agent.handover', 'Work handed over'],
  ['agent.disabled', 'Agent stopped'],
  ['order.failed', 'Order could not be placed'],
  ['integration.failed', 'Message to your system given up'],
]

function ToggleSwitch({ checked, onChange, label, description, danger = false }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
        checked
          ? danger
            ? 'border-red-200 bg-red-50/50 hover:bg-red-50/80'
            : 'border-purple-200 bg-purple-50/40 hover:bg-purple-50/70'
          : 'border-gray-200 bg-white hover:bg-gray-50/60'
      }`}
    >
      <div className="flex flex-col pr-2">
        <span className={`text-sm font-semibold ${danger && checked ? 'text-red-900' : 'text-gray-900'}`}>
          {label}
        </span>
        {description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>}
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
          checked ? (danger ? 'bg-red-600' : 'bg-purple-600') : 'bg-gray-200'
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

export default function ApprovalPoliciesPage() {
  const [policies, setPolicies] = useState([])
  const [roles, setRoles] = useState([])
  const [activeTab, setActiveTab] = useState('rules')
  const [settings, setSettings] = useState({
    hardFloorPercent: '',
    requestTtlHours: '24',
    stepUpAbovePercent: '10',
    quoteApprovalAbove: '',
    quoteValidDays: '14',
    quoteConvertDays: '14',
    paymentLinkValidHours: '72',
    newCustomerTags: 'provisional',
    provisionalOrdering: 'allow',
    requireTaxId: false,
    inventoryMode: 'informational',
    contextAbsoluteMinutes: '480',
    contextIdleMinutes: '',
    delegationMaxDays: '30',
    offlineCaptureEnabled: false,
    offlineCaptureDays: '7',
    templates: [],
    mappings: [],
    substitutes: [],
    moduleEnabled: true,
    featuresOff: [],
    alertsEnabled: true,
    escalateApprovals: true,
    digestEnabled: true,
    quoteReminderDays: '3, 1',
    quietHoursStart: '',
    quietHoursEnd: '',
    businessTimezone: 'UTC',
  })
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  function loadPolicies() {
    return approvalsApi.listPolicies().then((data) => setPolicies(data.policies))
  }

  useEffect(() => {
    approvalsApi.listPolicies().then((data) => setPolicies(data.policies))
    rolesApi.list().then((data) => setRoles(data.roles))
    approvalsApi.getSettings().then((s) =>
      setSettings({
        hardFloorPercent: s.hardFloorPercent === null ? '' : String(s.hardFloorPercent),
        requestTtlHours: String(s.requestTtlHours),
        stepUpAbovePercent: s.stepUpAbovePercent === null ? '' : String(s.stepUpAbovePercent),
        quoteApprovalAbove: s.quoteApprovalAbove === null ? '' : String(s.quoteApprovalAbove / 100),
        quoteValidDays: String(s.quoteValidDays),
        quoteConvertDays: String(s.quoteConvertDays),
        paymentLinkValidHours: String(s.paymentLinkValidHours ?? 72),
        newCustomerTags: (s.newCustomerTags || []).join(', '),
        provisionalOrdering: s.provisionalOrdering || 'allow',
        requireTaxId: !!s.requireTaxId,
        inventoryMode: s.inventoryMode || 'informational',
        contextAbsoluteMinutes: String(s.contextAbsoluteMinutes ?? 480),
        contextIdleMinutes: s.contextIdleMinutes ? String(s.contextIdleMinutes) : '',
        delegationMaxDays: String(s.delegationMaxDays ?? 30),
        offlineCaptureEnabled: !!s.offlineCaptureEnabled,
        offlineCaptureDays: String(s.offlineCaptureDays ?? 7),
        templates: Object.entries(s.notificationTemplates || {}).map(([key, v]) => {
          const [type, lang = ''] = key.split('|')
          return { type, lang, title: v.title || '', body: v.body || '' }
        }),
        mappings: (s.integrationMappings || []).map((m) => ({ kind: m.kind, from: m.from, to: m.to })),
        substitutes: (s.substitutes || []).map((x) => ({ fromSku: x.fromSku, toSku: x.toSku, note: x.note || '' })),
        moduleEnabled: s.moduleEnabled !== false,
        featuresOff: s.featuresOff || [],
        alertsEnabled: s.alertsEnabled !== false,
        escalateApprovals: s.escalateApprovals !== false,
        digestEnabled: s.digestEnabled !== false,
        quoteReminderDays: (s.quoteReminderDays || []).join(', '),
        quietHoursStart: s.quietHoursStart === null || s.quietHoursStart === undefined ? '' : String(s.quietHoursStart),
        quietHoursEnd: s.quietHoursEnd === null || s.quietHoursEnd === undefined ? '' : String(s.quietHoursEnd),
        businessTimezone: s.businessTimezone || 'UTC',
      }),
    )
  }, [])

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleRole(key) {
    setForm((f) => ({
      ...f,
      approverRoles: f.approverRoles.includes(key)
        ? f.approverRoles.filter((k) => k !== key)
        : [...f.approverRoles, key],
    }))
  }

  function openNew() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    setError('')
    setMessage('')
  }

  function openEdit(policy) {
    setEditingId(policy._id)
    setForm(toForm(policy))
    setShowForm(true)
    setError('')
    setMessage('')
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (editingId) await approvalsApi.updatePolicy(editingId, toPayload(form))
      else await approvalsApi.createPolicy(toPayload(form))

      setShowForm(false)
      await loadPolicies()
      setMessage('Rule saved successfully.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this rule.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(policy) {
    if (!confirm(`Delete the rule "${policy.name}"?`)) return

    setError('')
    try {
      await approvalsApi.removePolicy(policy._id)
      await loadPolicies()
      setMessage('Rule deleted.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this rule.')
    }
  }

  async function handleSaveSettings(e) {
    if (e && e.preventDefault) e.preventDefault()
    setError('')
    setMessage('')
    setSavingSettings(true)

    try {
      await approvalsApi.updateSettings({
        hardFloorPercent: settings.hardFloorPercent === '' ? null : Number(settings.hardFloorPercent),
        requestTtlHours: Number(settings.requestTtlHours),
        stepUpAbovePercent: settings.stepUpAbovePercent === '' ? null : Number(settings.stepUpAbovePercent),
        quoteApprovalAbove: settings.quoteApprovalAbove === '' ? null : Math.round(Number(settings.quoteApprovalAbove) * 100),
        quoteValidDays: Number(settings.quoteValidDays),
        quoteConvertDays: Number(settings.quoteConvertDays),
        paymentLinkValidHours: Number(settings.paymentLinkValidHours),
        newCustomerTags: settings.newCustomerTags.split(',').map((t) => t.trim()).filter(Boolean),
        provisionalOrdering: settings.provisionalOrdering,
        requireTaxId: settings.requireTaxId,
        inventoryMode: settings.inventoryMode,
        contextAbsoluteMinutes: Number(settings.contextAbsoluteMinutes),
        contextIdleMinutes: settings.contextIdleMinutes === '' ? null : Number(settings.contextIdleMinutes),
        delegationMaxDays: Number(settings.delegationMaxDays),
        offlineCaptureEnabled: settings.offlineCaptureEnabled,
        offlineCaptureDays: Number(settings.offlineCaptureDays),
        notificationTemplates: Object.fromEntries(
          settings.templates
            .filter((t) => t.title.trim() || t.body.trim())
            .map((t) => [t.lang.trim() ? t.type + '|' + t.lang.trim().toLowerCase() : t.type, { title: t.title, body: t.body }]),
        ),
        integrationMappings: settings.mappings.filter((m) => m.from.trim() && m.to.trim()),
        substitutes: settings.substitutes.filter((x) => x.fromSku.trim() && x.toSku.trim()),
        moduleEnabled: settings.moduleEnabled,
        featuresOff: settings.featuresOff,
        alertsEnabled: settings.alertsEnabled,
        escalateApprovals: settings.escalateApprovals,
        digestEnabled: settings.digestEnabled,
        quoteReminderDays: settings.quoteReminderDays.split(',').map((d) => d.trim()).filter(Boolean).map(Number),
        quietHoursStart: settings.quietHoursStart,
        quietHoursEnd: settings.quietHoursEnd,
        businessTimezone: settings.businessTimezone,
      })
      setMessage('Settings saved successfully.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the settings.')
    } finally {
      setSavingSettings(false)
    }
  }

  const roleName = (key) => roles.find((r) => r.key === key)?.name || key

  const tabs = [
    { id: 'rules', label: 'Rules & Pricing', icon: '⚖️' },
    { id: 'quotes', label: 'Quotes & Checkout', icon: '📝' },
    { id: 'access', label: 'Access & Switches', icon: '🛡️' },
    { id: 'reorders', label: 'Reorders & ERP Mappings', icon: '🔄' },
    { id: 'alerts', label: 'Alerts & Notifications', icon: '🔔' },
  ]

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Approval policies & Settings</h1>
            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 border border-purple-100">
              Governance
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Control price override limits, manager approval routing, agent sessions, and commerce rules.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600/30 disabled:opacity-60 transition-all cursor-pointer"
        >
          {savingSettings ? (
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
              <span>Save settings</span>
            </>
          )}
        </button>
      </div>

      {/* Feedback Messages */}
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

      {/* Modern Navigation Tabs */}
      <div className="flex overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xs scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'rules' && policies.length > 0 && (
                <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? 'bg-purple-500/40 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  {policies.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* TAB CONTENT 1: RULES & PRICING */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Card: Price Floor & Safety Thresholds */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
            <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Floor Price & Safety Limits</h2>
                <p className="text-xs text-gray-500 mt-0.5">Absolute guardrails to prevent unapproved or unprofitable discounts.</p>
              </div>
              <span className="rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">Hard Policy</span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-gray-800">
                  <span>Lowest price allowed (% of baseline)</span>
                  <span className="text-[11px] font-normal text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Hard Floor</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.hardFloorPercent}
                    onChange={(e) => setSettings((s) => ({ ...s, hardFloorPercent: e.target.value }))}
                    placeholder="Blank for no floor"
                    className={inputClass}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-400">
                    %
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  {settings.hardFloorPercent
                    ? `Active: Price cannot drop below ${settings.hardFloorPercent}% (Max discount: ${100 - Number(settings.hardFloorPercent)}%). Requests below this are instantly denied.`
                    : 'Leave blank to allow any discount (subject to manager approval). E.g., 80 means max 20% discount.'}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                  Requests & approvals validity (hours)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={settings.requestTtlHours}
                    onChange={(e) => setSettings((s) => ({ ...s, requestTtlHours: e.target.value }))}
                    className={inputClass}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-400">
                    hours
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Pending requests expire automatically if approvers do not answer within this timeframe.
                </p>
              </div>

              <div className="sm:col-span-2 rounded-xl bg-gray-50/70 p-4 border border-gray-100">
                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                  Step-up Authenticator code required on discounts of at least (% below baseline)
                </label>
                <div className="relative max-w-sm">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.stepUpAbovePercent}
                    onChange={(e) => setSettings((s) => ({ ...s, stepUpAbovePercent: e.target.value }))}
                    placeholder="Blank: prompt on every exception"
                    className={inputClass}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-400">
                    %
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Enforces MFA / TOTP verification code for high-risk actions. Smaller discounts pass without secondary authentication.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Approval Routing Rules */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
            <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Approval Routing Rules</h2>
                <p className="text-xs text-gray-500 mt-0.5">Rules execute in priority order (lowest number first). First match decides routing.</p>
              </div>
              <button
                type="button"
                onClick={openNew}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 transition-all cursor-pointer"
              >
                <span>+</span> Add rule
              </button>
            </div>

            {/* Rule Create/Edit Form */}
            {showForm && (
              <form onSubmit={handleSave} className="mb-6 rounded-xl border border-purple-200 bg-purple-50/20 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                  <h3 className="text-sm font-bold text-gray-900">
                    {editingId ? 'Edit Rule' : 'Create New Routing Rule'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Rule Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => setField('name', e.target.value)}
                      placeholder="e.g. High Discount Escalation"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Applies to</label>
                    <select
                      value={form.overrideType}
                      onChange={(e) => setField('overrideType', e.target.value)}
                      className={selectClass}
                    >
                      <option value="ANY">Any kind of exception</option>
                      {Object.entries(TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Priority (Order checked)</label>
                    <input
                      type="number"
                      value={form.priority}
                      onChange={(e) => setField('priority', e.target.value)}
                      className={inputClass}
                      required
                    />
                    <span className="text-[11px] text-gray-400">Lower numbers evaluated first.</span>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Action / Effect</label>
                    <select
                      value={form.effect}
                      onChange={(e) => setField('effect', e.target.value)}
                      className={selectClass}
                    >
                      <option value="route">Route for manager approval</option>
                      <option value="deny">Deny / Refuse immediately</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Covers reductions up to (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.maxDeltaPercent}
                      onChange={(e) => setField('maxDeltaPercent', e.target.value)}
                      placeholder="Blank for any size"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">SLA Answer Window (hours)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.slaHours}
                      onChange={(e) => setField('slaHours', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {form.effect === 'route' && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <span className="mb-1 block text-xs font-semibold text-gray-700">Eligible Approver Roles</span>
                      <p className="text-[11px] text-gray-500 mb-2">Leave all unchecked to allow any manager or administrator.</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {roles.map((r) => (
                          <label key={r.key} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2.5 text-xs font-medium text-gray-800 cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={form.approverRoles.includes(r.key)}
                              onChange={() => toggleRole(r.key)}
                              className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span>{r.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">Requires written comment above (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.commentRequiredAbovePercent}
                        onChange={(e) => setField('commentRequiredAbovePercent', e.target.value)}
                        placeholder="Blank: only rejections require a comment"
                        className={inputClass}
                      />
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-3.5">
                      <label className="flex items-start gap-2.5 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.selfApprovalAllowed}
                          onChange={(e) => setField('selfApprovalAllowed', e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <span className="block font-semibold text-gray-900">Allow agent self-approval</span>
                          <span className="block text-gray-500 mt-0.5">
                            Permitted only if the agent holds approval privileges, capped at the maximum percentage below.
                          </span>
                        </div>
                      </label>
                      {form.selfApprovalAllowed && (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={form.selfApprovalMaxPercent}
                          onChange={(e) => setField('selfApprovalMaxPercent', e.target.value)}
                          placeholder="Maximum % reduction they may self-approve"
                          className={`${inputClass} mt-2.5`}
                        />
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-purple-100">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setField('active', e.target.checked)}
                      className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Active rule</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save Rule'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Rules Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Rule Name & Scope</th>
                    <th className="px-4 py-3">Routing Destination</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {policies.map((p) => (
                    <tr key={p._id} className={`hover:bg-gray-50/50 transition-colors ${p.active ? '' : 'opacity-50 bg-gray-50/30'}`}>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center justify-center rounded-md bg-gray-100 px-2 py-1 text-xs font-bold text-gray-700">
                          #{p.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{p.name}</span>
                          {!p.active && (
                            <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">Disabled</span>
                          )}
                        </div>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          {p.overrideType === 'ANY' ? 'Any exception' : TYPE_LABELS[p.overrideType]} ·{' '}
                          {p.maxDeltaPercent === null ? 'Any size' : `Up to ${p.maxDeltaPercent}%`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {p.effect === 'deny' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-100">
                            ● Refuse / Deny
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 border border-purple-100">
                              Route for Approval
                            </span>
                            <span className="block text-xs text-gray-500">
                              {p.approverRoles.length ? p.approverRoles.map(roleName).join(', ') : 'Any approver'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {policies.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                        <p className="text-sm">No custom rules defined.</p>
                        <p className="text-xs text-gray-400 mt-1">Default behavior: Any manager whose permission covers the discount may approve.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: QUOTES & CHECKOUT */}
      {activeTab === 'quotes' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">Quotes Governance</h2>
            <div className="grid gap-5 sm:grid-cols-2 pt-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">Quotes need approval from (amount)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.quoteApprovalAbove}
                    onChange={(e) => setSettings((s) => ({ ...s, quoteApprovalAbove: e.target.value }))}
                    placeholder="Blank: no quote needs approval"
                    className={inputClass}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-400">
                    Amount
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">Quotes at or above this value must be approved by a manager before sending.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">A sent quote stays open (days)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={settings.quoteValidDays}
                    onChange={(e) => setSettings((s) => ({ ...s, quoteValidDays: e.target.value }))}
                    className={inputClass}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-400">
                    days
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">Days customer has to accept or decline before quote expires.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">Accepted quote must convert to order within (days)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={settings.quoteConvertDays}
                    onChange={(e) => setSettings((s) => ({ ...s, quoteConvertDays: e.target.value }))}
                    className={inputClass}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-400">
                    days
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">After customer acceptance, time window to place the final order.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">Payment link validity (hours)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={settings.paymentLinkValidHours}
                    onChange={(e) => setSettings((s) => ({ ...s, paymentLinkValidHours: e.target.value }))}
                    className={inputClass}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-400">
                    hours
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">Hosted link expiration window sent to customers.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">Checkout & Customer Governance</h2>
            <div className="grid gap-5 sm:grid-cols-2 pt-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">Stock for orders waiting on payment</label>
                <select
                  value={settings.inventoryMode}
                  onChange={(e) => setSettings((s) => ({ ...s, inventoryMode: e.target.value }))}
                  className={selectClass}
                >
                  <option value="informational">Only check what is in stock</option>
                  <option value="reserve_orders">Hold stock until payment link expires</option>
                </select>
                <p className="mt-1.5 text-xs text-gray-500">Whether inventory is reserved while customer completes hosted payment.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">Orders for new unapproved customer</label>
                <select
                  value={settings.provisionalOrdering}
                  onChange={(e) => setSettings((s) => ({ ...s, provisionalOrdering: e.target.value }))}
                  className={selectClass}
                >
                  <option value="allow">Allowed immediately</option>
                  <option value="block">Held until merchant approves</option>
                </select>
                <p className="mt-1.5 text-xs text-gray-500">Behavior when an agent creates a client on the spot.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">Tags applied to agent-created customers</label>
                <input
                  type="text"
                  value={settings.newCustomerTags}
                  onChange={(e) => setSettings((s) => ({ ...s, newCustomerTags: e.target.value }))}
                  className={inputClass}
                  placeholder="provisional, sales-rep"
                />
                <p className="mt-1.5 text-xs text-gray-500">Comma-separated tags added to Shopify customer profile.</p>
              </div>

              <div className="flex items-center pt-2">
                <ToggleSwitch
                  checked={settings.requireTaxId}
                  onChange={(val) => setSettings((s) => ({ ...s, requireTaxId: val }))}
                  label="Tax ID mandatory for new customers"
                  description="Enforces entering a GST / VAT / Tax ID when registering on-the-spot."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: ACCESS & SWITCHES */}
      {activeTab === 'access' && (
        <div className="space-y-6">
          {/* Master Kill Switch */}
          <div className="rounded-2xl border border-red-200 bg-red-50/30 p-6 shadow-xs">
            <h2 className="text-base font-bold text-red-900 border-b border-red-100 pb-3 flex items-center justify-between">
              <span>Emergency Master Switch (Kill Switch)</span>
              <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">Global Control</span>
            </h2>
            <div className="pt-4">
              <ToggleSwitch
                checked={settings.moduleEnabled}
                onChange={(val) => setSettings((s) => ({ ...s, moduleEnabled: val }))}
                label="Sales Agents Module Active"
                description="Turn off to immediately halt all agent operations, close active cart sessions, and disable agent banners storefront-wide."
                danger={true}
              />
            </div>
          </div>

          {/* Feature-Level Toggles */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">Feature Toggles</h2>
            <div className="grid gap-3 pt-4 sm:grid-cols-2">
              {[
                ['overrides', 'Discounts & Price Overrides', 'Enable unit price, discount, and MOQ exceptions'],
                ['quotes', 'Quotes System', 'Enable B2B quote generation, editing, and dispatch'],
                ['payment_links', 'Hosted Payment Links', 'Allow emailing checkout links to clients'],
                ['customer_creation', 'On-the-spot Customer Creation', 'Allow reps to register new clients in the field'],
              ].map(([key, label, desc]) => {
                const isEnabled = !settings.featuresOff.includes(key)
                return (
                  <ToggleSwitch
                    key={key}
                    checked={isEnabled}
                    onChange={(checked) =>
                      setSettings((s) => ({
                        ...s,
                        featuresOff: checked ? s.featuresOff.filter((f) => f !== key) : [...s.featuresOff, key],
                      }))
                    }
                    label={label}
                    description={desc}
                  />
                )
              })}
            </div>
          </div>

          {/* Agent Sessions */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">Agent Session Lifetimes</h2>
            <div className="grid gap-5 sm:grid-cols-2 pt-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">Longest an agent can stay in one customer (minutes)</label>
                <input
                  type="number"
                  min="15"
                  max="1440"
                  value={settings.contextAbsoluteMinutes}
                  onChange={(e) => setSettings((s) => ({ ...s, contextAbsoluteMinutes: e.target.value }))}
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-gray-500">Absolute session ceiling (480 mins = 8 hours). Session expires after this.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">End session sooner when idle for (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.contextIdleMinutes}
                  onChange={(e) => setSettings((s) => ({ ...s, contextIdleMinutes: e.target.value }))}
                  placeholder="Blank = never end on idle"
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-gray-500">Auto-expires session if agent is inactive. Leave blank to disable idle timeout.</p>
              </div>

              <div>
                <label htmlFor="deleg-max-days" className="mb-1.5 block text-sm font-medium text-gray-800">Longest approval delegation (days)</label>
                <input
                  id="deleg-max-days"
                  type="number"
                  min="1"
                  max="90"
                  value={settings.delegationMaxDays}
                  onChange={(e) => setSettings((s) => ({ ...s, delegationMaxDays: e.target.value }))}
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-gray-500">How long one agent may hand their approvals to another. Set up under Delegations.</p>
              </div>


            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: REORDERS & MAPPINGS */}
      {activeTab === 'reorders' && (
        <div className="space-y-6">
          {/* Substitutes for Reorders */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Substitutes for Reorders</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  When a rep reorders a discontinued or out-of-stock item, offer this replacement SKU upon rep confirmation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, substitutes: [...s.substitutes, { fromSku: '', toSku: '', note: '' }] }))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-all cursor-pointer"
              >
                + Add substitute
              </button>
            </div>

            <div className="space-y-3">
              {settings.substitutes.map((x, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                  <div className="w-full sm:w-1/3">
                    <input
                      type="text"
                      placeholder="Out-of-stock SKU (e.g. N-71949-SG)"
                      value={x.fromSku}
                      onChange={(e) => setSettings((s) => ({ ...s, substitutes: s.substitutes.map((y, j) => (j === i ? { ...y, fromSku: e.target.value } : y)) }))}
                      className={inputClass}
                    />
                  </div>
                  <span className="text-gray-400 font-bold hidden sm:inline">→</span>
                  <div className="w-full sm:w-1/3">
                    <input
                      type="text"
                      placeholder="Replacement SKU (e.g. N-71949-ST)"
                      value={x.toSku}
                      onChange={(e) => setSettings((s) => ({ ...s, substitutes: s.substitutes.map((y, j) => (j === i ? { ...y, toSku: e.target.value } : y)) }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="w-full sm:flex-1">
                    <input
                      type="text"
                      placeholder="Rep Note (e.g. Same style, silver plated)"
                      maxLength={200}
                      value={x.note}
                      onChange={(e) => setSettings((s) => ({ ...s, substitutes: s.substitutes.map((y, j) => (j === i ? { ...y, note: e.target.value } : y)) }))}
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, substitutes: s.substitutes.filter((_, j) => j !== i) }))}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {settings.substitutes.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                  No substitute pairings configured. Out-of-stock items will not offer automatic alternatives.
                </div>
              )}
            </div>
          </div>

          {/* Names in Other Systems (ERP / CRM) */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">External ERP / CRM Name Mappings</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Translate internal channel, territory, and entity names to match your back-office ERP nomenclature.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, mappings: [...s.mappings, { kind: 'legalEntity', from: '', to: '' }] }))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-all cursor-pointer"
              >
                + Add mapping
              </button>
            </div>

            <div className="space-y-3">
              {settings.mappings.map((m, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                  <div className="w-full sm:w-1/4">
                    <select
                      value={m.kind}
                      onChange={(e) => setSettings((s) => ({ ...s, mappings: s.mappings.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)) }))}
                      className={selectClass}
                    >
                      <option value="legalEntity">Legal Entity</option>
                      <option value="channel">Channel</option>
                      <option value="territory">Territory</option>
                    </select>
                  </div>
                  <div className="w-full sm:flex-1">
                    <input
                      type="text"
                      placeholder="SparkLayer Internal Name"
                      value={m.from}
                      onChange={(e) => setSettings((s) => ({ ...s, mappings: s.mappings.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)) }))}
                      className={inputClass}
                    />
                  </div>
                  <span className="text-gray-400 font-bold hidden sm:inline">→</span>
                  <div className="w-full sm:flex-1">
                    <input
                      type="text"
                      placeholder="External ERP / CRM Name"
                      value={m.to}
                      onChange={(e) => setSettings((s) => ({ ...s, mappings: s.mappings.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)) }))}
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, mappings: s.mappings.filter((_, j) => j !== i) }))}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {settings.mappings.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                  No system mappings configured. External integrations will receive default internal entity codes.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: ALERTS & NOTIFICATIONS */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Notification Controls */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">Alert Routing & Summaries</h2>
            <div className="grid gap-3 pt-4 sm:grid-cols-3">
              <ToggleSwitch
                checked={settings.alertsEnabled}
                onChange={(val) => setSettings((s) => ({ ...s, alertsEnabled: val }))}
                label="Send alerts"
                description="Deliver real-time notifications in-app and via email."
              />
              <ToggleSwitch
                checked={settings.escalateApprovals}
                onChange={(val) => setSettings((s) => ({ ...s, escalateApprovals: val }))}
                label="Escalate overdue approvals"
                description="Notify upper management when an approval exceeds its SLA."
              />
              <ToggleSwitch
                checked={settings.digestEnabled}
                onChange={(val) => setSettings((s) => ({ ...s, digestEnabled: val }))}
                label="Daily agent digest"
                description="Email reps an overview of quotes, orders, and pending items."
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 pt-5 border-t border-gray-100 mt-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">Quote reminder schedule (days before expiry)</label>
                <input
                  type="text"
                  value={settings.quoteReminderDays}
                  onChange={(e) => setSettings((s) => ({ ...s, quoteReminderDays: e.target.value }))}
                  className={inputClass}
                  placeholder="3, 1"
                />
                <p className="mt-1.5 text-xs text-gray-500">Comma-separated days prior to quote expiration to remind buyer & rep.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">Business time zone</label>
                <input
                  type="text"
                  value={settings.businessTimezone}
                  onChange={(e) => setSettings((s) => ({ ...s, businessTimezone: e.target.value }))}
                  className={inputClass}
                  placeholder="UTC or Asia/Kolkata"
                />
                <p className="mt-1.5 text-xs text-gray-500">Time zone used for business calendar calculations and quiet hours.</p>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>Quiet Hours (No Email Notifications)</span>
              <span className="text-xs font-normal text-gray-500">24-hour clock (0 - 23)</span>
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 pt-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">Mute emails starting from (hour 0-23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={settings.quietHoursStart}
                  onChange={(e) => setSettings((s) => ({ ...s, quietHoursStart: e.target.value }))}
                  placeholder="e.g. 21 (9:00 PM)"
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-gray-500">Night window starts. Notifications are queued till morning.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">…until this hour (0-23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={settings.quietHoursEnd}
                  onChange={(e) => setSettings((s) => ({ ...s, quietHoursEnd: e.target.value }))}
                  placeholder="e.g. 7 (7:00 AM)"
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-gray-500">Morning resume time when email notifications resume dispatching.</p>
              </div>
            </div>
          </div>

          {/* Custom Notification Wording Templates */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Custom Notification Wording Templates</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Customize notification copies per event and language. Available variables: <code className="bg-gray-100 px-1 py-0.5 rounded text-purple-700">{'{title}'}</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-purple-700">{'{body}'}</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-purple-700">{'{recipient}'}</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-purple-700">{'{shop}'}</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, templates: [...s.templates, { type: NOTIFICATION_TYPES[0][0], lang: '', title: '', body: '' }] }))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-all cursor-pointer"
              >
                + Add custom copy
              </button>
            </div>

            <div className="space-y-4">
              {settings.templates.map((t, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-full sm:w-1/2">
                      <select
                        value={t.type}
                        onChange={(e) => setSettings((s) => ({ ...s, templates: s.templates.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)) }))}
                        className={selectClass}
                      >
                        {NOTIFICATION_TYPES.map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full sm:w-1/4">
                      <input
                        type="text"
                        placeholder="Language (e.g. en, fr, de)"
                        value={t.lang}
                        onChange={(e) => setSettings((s) => ({ ...s, templates: s.templates.map((x, j) => (j === i ? { ...x, lang: e.target.value } : x)) }))}
                        className={inputClass}
                      />
                    </div>
                    <div className="w-full sm:flex-1">
                      <input
                        type="text"
                        placeholder="Notification Title Header"
                        value={t.title}
                        onChange={(e) => setSettings((s) => ({ ...s, templates: s.templates.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) }))}
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, templates: s.templates.filter((_, j) => j !== i) }))}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                  <div>
                    <textarea
                      placeholder="Custom message body with {recipient}, {shop}, etc."
                      value={t.body}
                      rows={2}
                      onChange={(e) => setSettings((s) => ({ ...s, templates: s.templates.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) }))}
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
              {settings.templates.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                  Standard system notification phrasing is active for all events.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Save Bar for Quick Access */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-2xl border border-gray-200/90 bg-white/95 px-6 py-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
          <span>Changes are saved globally across the merchant store.</span>
        </div>
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 transition-all cursor-pointer"
        >
          {savingSettings ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
