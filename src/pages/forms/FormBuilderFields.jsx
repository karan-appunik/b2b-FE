import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AUTOCAPITALIZE_OPTIONS,
  AUTOCOMPLETE_OPTIONS,
  BORDER_RADIUS_OPTIONS,
  BUILT_IN_TRANSLATIONS,
  FIELD_TYPE_CATEGORIES,
  FIELD_TYPES,
  FONT_FAMILY_OPTIONS,
  INPUT_MODE_OPTIONS,
  LANGUAGES,
  NAME_SUBFIELDS,
  OPTIONS_TYPES,
  STRUCTURED_TYPES,
  VALIDATION_CONDITIONS,
  VALIDATION_CONDITION_GROUPS,
  makeDefaultBranding,
  makeDefaultFileOptions,
  makeDefaultNameOptions,
  makeField,
  makeValidationRule,
} from './formTemplates'
import { COUNTRIES, COUNTRY_CALLING_CODES } from './countries'

// Free-text types where input-hint attributes (autocomplete, inputmode,
// spellcheck, min/max length) and format validation actually mean something —
// structured types (name/address/…), choice types (dropdown/checkbox), and
// date/file have their own fixed input shape instead.
const SIMPLE_TEXT_TYPES = new Set(['text', 'email', 'phone', 'textarea', 'number', 'url', 'password'])

const TYPE_LABELS = Object.fromEntries(FIELD_TYPES.map((t) => [t.value, t.label]))

function TrashIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  )
}

function GripIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <circle cx="6" cy="4.5" r="1.2" />
      <circle cx="6" cy="10" r="1.2" />
      <circle cx="6" cy="15.5" r="1.2" />
      <circle cx="12" cy="4.5" r="1.2" />
      <circle cx="12" cy="10" r="1.2" />
      <circle cx="12" cy="15.5" r="1.2" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
    </svg>
  )
}

function ChevronDownIcon({ open }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`}
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

function CloseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  )
}

// One path per field type for the "Add new field" picker — outline style to
// match the rest of the admin's icons.
const FIELD_TYPE_ICON_CONTENT = {
  text: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />,
  textarea: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5M3.75 9.75h16.5M3.75 14.25h13.5M3.75 18.75h9" />
  ),
  email: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
    />
  ),
  phone: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
    />
  ),
  address: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
    />
  ),
  name: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  ),
  tax: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  dropdown: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />,
  country: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  checkbox: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l4 4 6-7" />
    </>
  ),
  radio: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
    </>
  ),
  toggle: (
    <>
      <rect x="2" y="8" width="20" height="8" rx="4" />
      <circle cx="16" cy="12" r="3" fill="currentColor" stroke="none" />
    </>
  ),
  url: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
    />
  ),
  number: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 7.5h6M9 12h6M9 16.5h6M6.75 3.75h10.5A2.25 2.25 0 0 1 19.5 6v12a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 18V6a2.25 2.25 0 0 1 2.25-2.25Z"
    />
  ),
  date: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  ),
  datetime: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M4.5 9h9.75M4.5 4.5h11A1.5 1.5 0 0117 6v3.75M4.5 4.5A1.5 1.5 0 003 6v13.5A1.5 1.5 0 004.5 21h5.25"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 15v2.25l1.5 1.125" />
      <circle cx="18" cy="17.25" r="4.25" />
    </>
  ),
  time: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  ),
  password: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
    />
  ),
  file: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  ),
  hidden: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
    />
  ),
}

function FieldTypeIcon({ type, className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
      {FIELD_TYPE_ICON_CONTENT[type] || FIELD_TYPE_ICON_CONTENT.text}
    </svg>
  )
}

function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between text-left"
      >
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <ChevronDownIcon open={open} />
      </button>
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  )
}

// "Website" -> "website", "Company Name!" -> "company_name" — matches how
// the reference app auto-fills Field ID from the label as the merchant types.
function slugifyFieldKey(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function AddFieldTypeModal({ onCreate, onClose }) {
  const [type, setType] = useState(null)
  const [label, setLabel] = useState('')
  const [fieldKey, setFieldKey] = useState('')
  const [keyTouched, setKeyTouched] = useState(false)

  function chooseType(t) {
    setType(t)
  }

  function backToTypePicker() {
    setType(null)
  }

  function handleLabelChange(value) {
    setLabel(value)
    if (!keyTouched) setFieldKey(slugifyFieldKey(value))
  }

  function resetForNextField() {
    setType(null)
    setLabel('')
    setFieldKey('')
    setKeyTouched(false)
  }

  function create(addAnother) {
    if (!label.trim()) return
    onCreate({ type, label: label.trim(), fieldKey: fieldKey || slugifyFieldKey(label) })
    if (addAnother) resetForNextField()
    else onClose()
  }

  function handleKeyDown(e) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    create(e.metaKey || e.ctrlKey)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-[670px] flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add new field</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {type ? 'Step 2 of 2: Configure field' : 'Step 1 of 2: Choose field type'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600" title="Close">
            <CloseIcon />
          </button>
        </div>

        {!type ? (
          <div className="overflow-y-auto px-6 py-4">
            {FIELD_TYPE_CATEGORIES.map((cat) => (
              <div key={cat.label} className="mb-5 last:mb-0">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">{cat.label}</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {cat.types.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => chooseType(t)}
                      className="group flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-gray-200 px-3 py-4 text-center transition-colors hover:border-blue-500"
                    >
                      <FieldTypeIcon type={t} className="h-5 w-5 text-gray-400 transition-colors group-hover:text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">{TYPE_LABELS[t]}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-y-auto px-6 py-4" onKeyDown={handleKeyDown}>
              <div className="flex items-center justify-between rounded-lg bg-gray-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-gray-500">
                    <FieldTypeIcon type={type} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{TYPE_LABELS[type]}</p>
                    <p className="text-xs text-amber-600">Field type cannot be changed after creation.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={backToTypePicker}
                  className="shrink-0 cursor-pointer text-sm font-medium text-purple-600 hover:underline"
                >
                  Change
                </button>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Field label</label>
                <div className="relative">
                  <input
                    autoFocus
                    value={label}
                    maxLength={100}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    placeholder="e.g., Website"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-14 text-sm focus:border-purple-500 focus:outline-none"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    {label.length}/100
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">This is what users will see</p>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Field ID</label>
                <div className="relative">
                  <input
                    value={fieldKey}
                    maxLength={100}
                    onChange={(e) => {
                      setFieldKey(e.target.value)
                      setKeyTouched(true)
                    }}
                    placeholder="field_id"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-14 font-mono text-sm focus:border-purple-500 focus:outline-none"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    {fieldKey.length}/100
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Used in conditions, workflows, and API. Cannot be changed after creation.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <p className="text-xs text-gray-400">
                Shortcuts &nbsp; Enter: "Create" &nbsp; Cmd/Ctrl + Enter: "Create and add another"
              </p>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => create(true)}
                  disabled={!label.trim()}
                  className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Create and add another
                </button>
                <button
                  type="button"
                  onClick={() => create(false)}
                  disabled={!label.trim()}
                  className="cursor-pointer rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}


function FieldReferenceModal({ options, onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Select a reference</h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600" title="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="px-5 py-3">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search within results..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>
        <p className="px-5 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Common options</p>
        <div className="overflow-y-auto px-2 pb-3">
          {filtered.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => onSelect(o.value)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-50"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                  <FieldTypeIcon type={o.type} />
                </span>
                <span className="truncate text-sm text-gray-900">{o.label}</span>
              </span>
              <span className="shrink-0 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600">
                Select
              </span>
            </button>
          ))}
          {filtered.length === 0 && <p className="px-3 py-4 text-center text-sm text-gray-400">No matches.</p>}
        </div>
      </div>
    </div>,
    document.body
  )
}

function DisplayLogicTab({ field, otherFields, onChange }) {
  const condition = field.condition || { fieldId: null, operator: 'equals', value: '' }
  const [started, setStarted] = useState(!!condition.fieldId)
  const [advanced, setAdvanced] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const targetField = otherFields.find((f) => (f._id || f.key) === condition.fieldId)
  const targetHasOptions = targetField && OPTIONS_TYPES.has(targetField.type)

  function set(patch) {
    onChange({ ...field, condition: { ...condition, ...patch } })
  }

  function clearLogic() {
    onChange({ ...field, condition: { fieldId: null, operator: 'equals', value: '' } })
    setStarted(false)
  }

  return (
    <CollapsibleSection title="Conditional display logic">
      <p className="-mt-2 text-sm text-gray-500">Control when this field is shown or hidden based on other field values.</p>

      {!started ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center">
          <p className="text-sm font-semibold text-gray-900">No display logic</p>
          <p className="mt-1 text-sm text-gray-400">Add conditions to show/hide this field dynamically.</p>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-4 cursor-pointer rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Add display logic
          </button>
        </div>
      ) : (
        <div className="space-y-4 rounded-lg border border-gray-200 p-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium text-gray-500">Field (required)</label>
              {!condition.fieldId && (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                  ⚠ Incomplete
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-700 hover:border-purple-400"
            >
              {targetField ? targetField.label || 'Untitled field' : 'Select field...'}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Condition (required)</label>
            <select
              value={condition.operator}
              onChange={(e) => set({ operator: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            >
              <option value="equals">Equals</option>
              <option value="not_equals">Does not equal</option>
            </select>
          </div>

          {condition.fieldId && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Value</label>
              {targetHasOptions ? (
                <select
                  value={condition.value}
                  onChange={(e) => set({ value: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Select a value</option>
                  {targetField.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={condition.value}
                  onChange={(e) => set({ value: e.target.value })}
                  placeholder="Value"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <ToggleSwitch checked={advanced} onChange={setAdvanced} />
              Advanced rules
            </label>
            <button
              type="button"
              onClick={clearLogic}
              className="cursor-pointer rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            >
              Clear logic
            </button>
          </div>
        </div>
      )}

      {pickerOpen && (
        <FieldReferenceModal
          options={otherFields.map((f) => ({ value: f._id || f.key, label: f.label || 'Untitled field', type: f.type }))}
          onSelect={(value) => {
            set({ fieldId: value, value: '' })
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </CollapsibleSection>
  )
}

function FieldPropertiesTab({ field, onChange, onDelete }) {
  function set(patch) {
    onChange({ ...field, ...patch })
  }

  function setOption(i, value) {
    const options = [...field.options]
    options[i] = value
    set({ options })
  }

  function addOption() {
    set({ options: [...field.options, ''] })
  }

  function removeOption(i) {
    set({ options: field.options.filter((_, idx) => idx !== i) })
  }

  const isStructured = STRUCTURED_TYPES.has(field.type)
  const isHidden = field.type === 'hidden'
  const isFile = field.type === 'file'
  // Placeholder/default value/read-only only make sense for a field with a
  // single free-form value — not a fixed country list, a multi-part
  // structured field, a file upload, or a never-shown field.
  const isSingleValue = !isStructured && !isHidden && !isFile
  // The storefront embed only knows how to render "+ Add another" for these
  // — dropdown/checkbox are already their own kind of multi-value field.
  const supportsRepeat = SIMPLE_TEXT_TYPES.has(field.type) || ['date', 'datetime', 'time'].includes(field.type)

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Label <span className="text-red-500">*</span>
        </label>
        <input
          required
          value={field.label}
          onChange={(e) => set({ label: e.target.value })}
          placeholder="phone"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
      </div>

      {isHidden && (
        <p className="text-xs text-gray-400">Hidden fields are never shown to (or collected from) the customer.</p>
      )}

      {!isHidden && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
          <textarea
            rows={2}
            value={field.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Help text for users"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>
      )}

      {isSingleValue && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Placeholder</label>
          <input
            value={field.placeholder}
            onChange={(e) => set({ placeholder: e.target.value })}
            placeholder="Example text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>
      )}

      {isSingleValue && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Default value</label>
          <div className="flex items-center gap-2">
            <input
              value={field.defaultValue}
              onChange={(e) => set({ defaultValue: e.target.value })}
              placeholder="Enter a default value..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
            <button
              type="button"
              disabled
              title="Dynamic references aren't available yet"
              className="flex shrink-0 cursor-not-allowed items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50"
            >
              ↗ Reference
            </button>
          </div>
        </div>
      )}

      {OPTIONS_TYPES.has(field.type) && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Options</label>
          <div className="space-y-2">
            {field.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  required
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="cursor-pointer text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="cursor-pointer text-sm font-medium text-purple-600 hover:underline"
            >
              + Add option
            </button>
          </div>
        </div>
      )}

      {!isHidden && field.type !== 'name' && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => set({ required: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          Required
        </label>
      )}

      {isSingleValue && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={field.readOnly}
            onChange={(e) => set({ readOnly: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          Read only
        </label>
      )}

      {supportsRepeat && (
        <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={field.repeatable}
            onChange={(e) => set({ repeatable: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <div>
            <span>Repeatable</span>
            <span className="block text-xs text-gray-400">Allow users to add multiple instances</span>
          </div>
        </label>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onDelete}
          className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-red-700 transition-colors"
        >
          Delete field
        </button>
      </div>
    </div>
  )
}

function FieldInputOptionsSection({ field, onChange }) {
  function set(patch) {
    onChange({ ...field, ...patch })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Autocomplete</label>
        <select
          value={field.autocomplete}
          onChange={(e) => set({ autocomplete: e.target.value })}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        >
          {AUTOCOMPLETE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Input mode</label>
        <select
          value={field.inputMode}
          onChange={(e) => set({ inputMode: e.target.value })}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        >
          {INPUT_MODE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Autocapitalise</label>
        <select
          value={field.autocapitalize}
          onChange={(e) => set({ autocapitalize: e.target.value })}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        >
          {AUTOCAPITALIZE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={field.spellcheck}
          onChange={(e) => set({ spellcheck: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        Spellcheck
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Min length</label>
          <input
            type="number"
            min={0}
            value={field.minLength ?? ''}
            onChange={(e) => set({ minLength: e.target.value === '' ? null : Number(e.target.value) })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Max length</label>
          <input
            type="number"
            min={0}
            value={field.maxLength ?? ''}
            onChange={(e) => set({ maxLength: e.target.value === '' ? null : Number(e.target.value) })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}

function NameFieldOptionsSection({ field, onChange }) {
  const options = field.nameOptions || makeDefaultNameOptions()

  function setSub(key, patch) {
    onChange({ ...field, nameOptions: { ...options, [key]: { ...options[key], ...patch } } })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead>
          <tr className="text-xs font-medium text-gray-500">
            <th className="pb-2 pr-2 font-medium"></th>
            <th className="pb-2 px-2 font-medium">Enabled</th>
            <th className="pb-2 px-2 font-medium">Required</th>
            <th className="pb-2 pl-2 font-medium">Default Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {NAME_SUBFIELDS.map((sf) => {
            const sub = options[sf.key] || { enabled: false, required: false, defaultValue: '' }
            return (
              <tr key={sf.key}>
                <td className="whitespace-nowrap py-2 pr-2 text-gray-700">{sf.label}</td>
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={sub.enabled}
                    onChange={(e) => setSub(sf.key, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    disabled={!sub.enabled}
                    checked={sub.required}
                    onChange={(e) => setSub(sf.key, { required: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-40"
                  />
                </td>
                <td className="py-2 pl-2">
                  <input
                    disabled={!sub.enabled}
                    value={sub.defaultValue}
                    onChange={(e) => setSub(sf.key, { defaultValue: e.target.value })}
                    placeholder="Enter a default value…"
                    className="w-full min-w-[160px] rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function NameLayoutSection({ field, onChange }) {
  const layout = field.nameLayout || 'row'
  return (
    <div className="flex w-fit rounded-md border border-gray-300 bg-gray-50 p-0.5 text-sm">
      {['column', 'row'].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange({ ...field, nameLayout: v })}
          className={`cursor-pointer rounded px-4 py-1.5 capitalize ${
            layout === v ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  )
}

function PhoneOptionsSection({ field, onChange }) {
  function set(patch) {
    onChange({ ...field, ...patch })
  }

  const showCode = field.showCountryCode ?? true

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={showCode}
          onChange={(e) => set({ showCountryCode: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        Show country code selector
      </label>
      <div className="relative">
        <select
          disabled={!showCode}
          value={field.defaultCountry || ''}
          onChange={(e) => set({ defaultCountry: e.target.value })}
          className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm text-gray-700 focus:border-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">Select default country (optional)</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c} ({COUNTRY_CALLING_CODES[c]})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.5-4.25a.75.75 0 01-1.08 0l-4.5-4.25a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

function FileOptionsSection({ field, onChange }) {
  const options = field.fileOptions || makeDefaultFileOptions()

  function set(patch) {
    onChange({ ...field, fileOptions: { ...options, ...patch } })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Maximum file size (MB)</label>
        <input
          type="number"
          min={1}
          value={options.maxFileSizeMB}
          onChange={(e) => set({ maxFileSizeMB: e.target.value === '' ? '' : Number(e.target.value) })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Allowed file types</label>
        <textarea
          rows={2}
          value={options.allowedFileTypes}
          onChange={(e) => set({ allowedFileTypes: e.target.value })}
          placeholder="image/*, application/pdf"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-400">
          Comma-separated MIME types or extensions. Leave empty to allow all types.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">File Expiry (Days)</label>
        <input
          type="number"
          min={1}
          value={options.expiryDays ?? ''}
          onChange={(e) => set({ expiryDays: e.target.value === '' ? null : Number(e.target.value) })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-400">How many days to keep uploaded files. Leave empty to never expire.</p>
      </div>
      <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={options.allowMultiple}
          onChange={(e) => set({ allowMultiple: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        <div>
          <span>Allow multiple</span>
          <span className="block text-xs text-gray-400">Allow users to upload more than one file</span>
        </div>
      </label>
    </div>
  )
}

function ValidationRuleCard({ rule, onChange, onRemove }) {
  const meta = VALIDATION_CONDITIONS.find((c) => c.value === rule.condition)
  const incomplete = !rule.condition

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500">Condition (required)</label>
        {incomplete && (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
            ⚠ Incomplete
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <select
          value={rule.condition}
          onChange={(e) => onChange({ condition: e.target.value, value: '' })}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        >
          <option value="">Select condition...</option>
          {VALIDATION_CONDITION_GROUPS.map((group) => (
            <optgroup key={group.category} label={group.category}>
              {group.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 cursor-pointer text-gray-400 hover:text-red-600"
          title="Remove rule"
        >
          <TrashIcon />
        </button>
      </div>

      {meta?.needsValue && (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-gray-500">Value</label>
          <input
            type={meta.valueType === 'number' ? 'number' : 'text'}
            value={rule.value}
            onChange={(e) => onChange({ value: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>
      )}

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-gray-500">Error message (optional)</label>
        <input
          value={rule.message}
          onChange={(e) => onChange({ message: e.target.value })}
          placeholder="Leave empty for default message"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
      </div>
    </div>
  )
}

function FieldValidationTab({ field, onChange }) {
  const rules = field.validationRules || []

  function addRule() {
    onChange({ ...field, validationRules: [...rules, makeValidationRule()] })
  }

  function updateRule(id, patch) {
    onChange({
      ...field,
      validationRules: rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })
  }

  function removeRule(id) {
    onChange({ ...field, validationRules: rules.filter((r) => r.id !== id) })
  }

  return (
    <CollapsibleSection title="Validation rules">
      <p className="-mt-2 text-sm text-gray-500">Add rules to validate user input before submission.</p>

      {rules.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center">
          <p className="text-sm font-semibold text-gray-900">No validation rules</p>
          <p className="mt-1 text-sm text-gray-400">Add rules to validate user input.</p>
          <button
            type="button"
            onClick={addRule}
            className="mt-4 cursor-pointer rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Add first rule
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <ValidationRuleCard
              key={rule.id}
              rule={rule}
              onChange={(patch) => updateRule(rule.id, patch)}
              onRemove={() => removeRule(rule.id)}
            />
          ))}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={addRule}
              className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Add rule
            </button>
          </div>
        </div>
      )}
    </CollapsibleSection>
  )
}

const CONFIG_TABS = [
  { id: 'properties', label: 'Properties' },
  { id: 'validation', label: 'Validation' },
  { id: 'display', label: 'Display logic' },
]

function FieldConfigPanel({ field, otherFields, onChange, onDelete, onClose }) {
  const [activeTab, setActiveTab] = useState('properties')
  const isHidden = field.type === 'hidden'
  const showInputOptions = SIMPLE_TEXT_TYPES.has(field.type) && field.type !== 'phone'
  const showValidation = SIMPLE_TEXT_TYPES.has(field.type)

  const tabs = CONFIG_TABS.filter((t) => t.id !== 'validation' || showValidation)
  const tab = tabs.some((t) => t.id === activeTab) ? activeTab : 'properties'

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Configure field</h2>
            <p className="mt-1 text-sm text-gray-500">Customise the properties, validation, and display logic for this field.</p>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600" title="Close">
            <CloseIcon />
          </button>
        </div>

        <p className="mt-4 text-sm font-medium text-gray-900">
          {field.label || 'Untitled field'} <span className="font-normal text-gray-400">({field.type})</span>
        </p>

        <div className="mt-3 flex gap-6 border-b border-gray-200 text-sm">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`-mb-px cursor-pointer whitespace-nowrap border-b-2 py-2 font-medium transition-colors ${
                tab === t.id ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {tab === 'properties' && (
        <div className="space-y-4">
          <CollapsibleSection title="Basic properties">
            <FieldPropertiesTab field={field} onChange={onChange} onDelete={onDelete} />
          </CollapsibleSection>
          {field.type === 'phone' && (
            <CollapsibleSection title="Phone options">
              <PhoneOptionsSection field={field} onChange={onChange} />
            </CollapsibleSection>
          )}
          {field.type === 'file' && (
            <CollapsibleSection title="File upload options">
              <FileOptionsSection field={field} onChange={onChange} />
            </CollapsibleSection>
          )}
          {showInputOptions && (
            <CollapsibleSection title="Input options">
              <FieldInputOptionsSection field={field} onChange={onChange} />
            </CollapsibleSection>
          )}
          {field.type === 'name' && (
            <CollapsibleSection title="Name field options">
              <NameFieldOptionsSection field={field} onChange={onChange} />
            </CollapsibleSection>
          )}
          {field.type === 'name' && (
            <CollapsibleSection title="Layout">
              <NameLayoutSection field={field} onChange={onChange} />
            </CollapsibleSection>
          )}
        </div>
      )}
      {tab === 'validation' && <FieldValidationTab field={field} onChange={onChange} />}
      {tab === 'display' && (
        <>
          {isHidden ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
              <p className="text-sm text-gray-400">Hidden fields are always present — display logic doesn't apply.</p>
            </div>
          ) : otherFields.length > 0 ? (
            <DisplayLogicTab field={field} otherFields={otherFields} onChange={onChange} />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
              <p className="text-sm text-gray-400">Add another field first to reference it here.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function FieldRow({ field, selected, dragging, onSelect, onRemove, dragHandlers }) {
  return (
    <div
      className={`rounded-lg border bg-white shadow-xs transition-all ${
        dragging ? 'border-purple-400 opacity-50' : selected ? 'border-2 border-purple-500 ring-2 ring-purple-100' : 'border-gray-200 hover:border-gray-300'
      }`}
      {...dragHandlers}
    >
      <div className="flex items-center justify-between px-4 py-3.5">
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        >
          <span className="truncate font-medium text-gray-900">{field.label || 'Untitled field'}</span>
          {field.required && <span className="text-red-500">*</span>}
          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-normal text-gray-700">
            {TYPE_LABELS[field.type] || field.type}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-3 pl-3">
          <button
            type="button"
            onClick={onRemove}
            className="cursor-pointer text-gray-400 hover:text-red-600 transition-colors"
            title="Delete field"
          >
            <TrashIcon />
          </button>
          <span className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing" title="Drag to reorder">
            <GripIcon />
          </span>
        </div>
      </div>
    </div>
  )
}

export function FieldListEditor({ fields, onChange }) {
  const [selectedKey, setSelectedKey] = useState(null)
  const [dragIndex, setDragIndex] = useState(null)
  const [pendingInsertIndex, setPendingInsertIndex] = useState(null)

  function keyOf(field) {
    return field.key || field._id
  }

  function updateField(i, field) {
    const next = [...fields]
    next[i] = field
    onChange(next)
  }

  function removeField(i) {
    const key = keyOf(fields[i])
    onChange(fields.filter((_, idx) => idx !== i))
    if (selectedKey === key) setSelectedKey(null)
  }

  function insertFieldAt(i, overrides) {
    const patch = typeof overrides === 'string' ? { type: overrides } : overrides || {}
    const field = makeField(patch)
    const next = [...fields]
    next.splice(i, 0, field)
    onChange(next)
    setSelectedKey(field.key)
  }

  function moveField(from, to) {
    if (from === to || from == null || to == null) return
    const next = [...fields]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  function addPage() {
    insertFieldAt(fields.length, 'text')
    // Mark the newly added field as start of new page if there are prior fields
    if (fields.length > 0) {
      const next = [...fields, makeField({ newPage: true })]
      onChange(next)
      setSelectedKey(next[next.length - 1].key)
    }
  }

  function addPageAbove() {
    const newF = makeField({ newPage: true })
    const next = [newF, ...fields]
    onChange(next)
    setSelectedKey(newF.key)
  }

  const selectedIndex = fields.findIndex((f) => keyOf(f) === selectedKey)
  const selectedField = selectedIndex >= 0 ? fields[selectedIndex] : null

  return (
    <div className={selectedField ? 'grid grid-cols-1 items-start gap-6 lg:grid-cols-2' : ''}>
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
              Page 1
            </span>
          </div>
          <button
            type="button"
            onClick={addPageAbove}
            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-gray-600 hover:text-purple-600 transition-colors"
          >
            <PlusIcon /> Add page above
          </button>
        </div>

        <div className="space-y-2">
          {fields.map((field, i) => {
            const key = keyOf(field)
            return (
              <div key={key} className="space-y-2">
                <FieldRow
                  field={field}
                  selected={selectedKey === key}
                  dragging={dragIndex === i}
                  onSelect={() => setSelectedKey(selectedKey === key ? null : key)}
                  onRemove={() => removeField(i)}
                  dragHandlers={{
                    draggable: true,
                    onDragStart: () => setDragIndex(i),
                    onDragOver: (e) => e.preventDefault(),
                    onDrop: (e) => {
                      e.preventDefault()
                      moveField(dragIndex, i)
                      setDragIndex(null)
                    },
                    onDragEnd: () => setDragIndex(null),
                  }}
                />
              </div>
            )
          })}
          {fields.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
              No fields yet. Add your first field below.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setPendingInsertIndex(fields.length)}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-purple-400 hover:bg-purple-50/20 hover:text-purple-600"
        >
          <PlusIcon /> Add Field
        </button>

        <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={addPage}
            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-gray-600 hover:text-purple-600 transition-colors"
          >
            <PlusIcon /> Add page
          </button>
        </div>
      </section>

      {selectedField && (
        <FieldConfigPanel
          field={selectedField}
          otherFields={fields.filter((f) => keyOf(f) !== selectedKey)}
          onChange={(f) => updateField(selectedIndex, f)}
          onDelete={() => removeField(selectedIndex)}
          onClose={() => setSelectedKey(null)}
        />
      )}

      {pendingInsertIndex !== null && (
        <AddFieldTypeModal
          onCreate={(payload) => {
            insertFieldAt(pendingInsertIndex, payload)
            setPendingInsertIndex((i) => (i == null ? null : i + 1))
          }}
          onClose={() => setPendingInsertIndex(null)}
        />
      )}
    </div>
  )
}

export function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-none cursor-pointer items-center rounded-full transition-colors ${
        checked ? 'bg-purple-600' : 'bg-gray-200'
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

function FormBrandingSection({ settings, onChange }) {
  const branding = settings.branding || makeDefaultBranding()

  function set(patch) {
    onChange({ ...settings, branding: { ...branding, ...patch } })
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Primary colour</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={branding.primaryColor}
            onChange={(e) => set({ primaryColor: e.target.value })}
            className="h-9 w-11 shrink-0 cursor-pointer rounded-md border border-gray-300 p-1"
          />
          <input
            value={branding.primaryColor}
            onChange={(e) => set({ primaryColor: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">Submit/Next buttons and focus outline.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Corner rounding</label>
        <select
          value={branding.borderRadius}
          onChange={(e) => set({ borderRadius: Number(e.target.value) })}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        >
          {BORDER_RADIUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">Applies to inputs and buttons.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Font</label>
        <select
          value={branding.fontFamily}
          onChange={(e) => set({ fontFamily: e.target.value })}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        >
          {FONT_FAMILY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">Web-safe fonts only — nothing extra to load.</p>
      </div>
    </div>
  )
}

export function FormSettingsSection({ name, onNameChange, settings, onChange }) {
  function set(patch) {
    onChange({ ...settings, ...patch })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Public form settings</h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Form title</label>
          <input
            required
            value={settings.publicTitle}
            onChange={(e) => set({ publicTitle: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">The title displayed to users filling out the form.</p>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Form description</label>
          <textarea
            rows={2}
            value={settings.description}
            onChange={(e) => set({ description: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">A brief description or instructions for users.</p>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Submit button text</label>
          <input
            value={settings.submitButtonText}
            onChange={(e) => set({ submitButtonText: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">Customise what appears on the submit button.</p>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Success message</label>
          <div className="rounded-md border border-gray-300 focus-within:border-purple-500">
            <textarea
              rows={4}
              value={settings.successMessage}
              onChange={(e) => set({ successMessage: e.target.value })}
              className="w-full resize-none border-0 px-3 py-2 text-sm focus:outline-none"
            />
            <div className="flex items-center justify-between border-t border-gray-200 px-3 py-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <button type="button" disabled className="cursor-not-allowed">
                  + Reference
                </button>
                <button type="button" disabled className="cursor-not-allowed">
                  + Condition
                </button>
                <button type="button" disabled className="cursor-not-allowed">
                  + Loop
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-purple-600">Visual</span>
                <span>Text</span>
              </div>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-400">Supports templates, references, conditions, loops, and HTML.</p>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Language</label>
          <select
            value={settings.language}
            onChange={(e) => set({ language: e.target.value })}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Localises built-in form text (buttons, labels, address lookup). Custom field labels and merchant
            content are not translated.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Branding</h2>
        <p className="mb-4 text-sm text-gray-500">
          Match the storefront embed's colours, corners, and font to your store.
        </p>
        <FormBrandingSection settings={settings} onChange={onChange} />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Admin settings</h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Internal title</label>
          <input
            required
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">Only visible to admins in the dashboard.</p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Read/unread tracking</p>
            <p className="text-xs text-gray-400">Enable marking entries as read or unread for this form.</p>
          </div>
          <ToggleSwitch checked={settings.trackReadStatus} onChange={(v) => set({ trackReadStatus: v })} />
        </div>
      </section>
    </div>
  )
}

function RequiredMark({ field }) {
  return field.required ? <span className="text-red-500">*</span> : null
}

function NamePreviewField({ field, t }) {
  const options = field.nameOptions || {}
  const defs = [
    { key: 'title', label: t.title },
    { key: 'firstName', label: t.firstName },
    { key: 'middleName', label: t.middleName },
    { key: 'lastName', label: t.lastName },
    { key: 'suffix', label: t.suffix },
  ]
  const enabled = defs.filter((d) => options[d.key]?.enabled)
  // Falls back to first/last so a field saved before this feature existed
  // (no nameOptions yet) still previews with something.
  const shown = enabled.length > 0 ? enabled : [defs[1], defs[3]]
  const layoutClass =
    field.nameLayout === 'column' ? 'flex flex-col gap-4' : 'grid grid-cols-1 gap-4 sm:grid-cols-2'

  return (
    <div>
      <p className="mb-2 text-sm text-gray-900">{field.label}</p>
      <div className={layoutClass}>
        {shown.map((d) => {
          const sub = options[d.key] || {}
          return (
            <div key={d.key}>
              <label className="mb-1 block text-sm text-gray-700">
                {d.label} {sub.required && <span className="text-red-500">*</span>}
              </label>
              <input
                disabled
                defaultValue={sub.defaultValue || ''}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AddressPreviewField({ field, t }) {
  return (
    <div>
      <p className="mb-2 text-sm text-gray-900">
        {field.label} <RequiredMark field={field} />
      </p>
      <div className="space-y-3">
        <input placeholder={t.addressLine} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder={t.city} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input placeholder={t.zip} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
          <option value="">{t.selectCountry}</option>
          {COUNTRIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function CountryPreviewField({ field, t }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-gray-900">
        {field.label} <RequiredMark field={field} />
      </label>
      <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500">
        <option value="">{t.selectCountry}</option>
        {COUNTRIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
    </div>
  )
}

function TaxPreviewField({ field, t }) {
  return (
    <div>
      <p className="mb-2 text-sm text-gray-900">{field.label}</p>
      <label className="mb-1 block text-sm text-gray-700">{t.country}</label>
      <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500">
        <option value="">{t.selectCountry}</option>
        {COUNTRIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
    </div>
  )
}

function ConditionalBadge({ field }) {
  if (!field.condition?.fieldId) return null
  return (
    <span className="ml-2 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
      Conditional
    </span>
  )
}

function PreviewField({ field, t }) {
  if (field.type === 'hidden') return null
  if (field.type === 'name')
    return (
      <div>
        <ConditionalBadge field={field} />
        <NamePreviewField field={field} t={t} />
      </div>
    )
  if (field.type === 'address')
    return (
      <div>
        <ConditionalBadge field={field} />
        <AddressPreviewField field={field} t={t} />
      </div>
    )
  if (field.type === 'country') return <CountryPreviewField field={field} t={t} />
  if (field.type === 'tax') return <TaxPreviewField field={field} t={t} />

  const commonProps = {
    disabled: true,
    placeholder: field.placeholder || '',
    defaultValue: field.defaultValue || undefined,
    minLength: field.minLength ?? undefined,
    maxLength: field.maxLength ?? undefined,
    className: 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500',
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-gray-900">
        {field.label || 'Untitled field'} <RequiredMark field={field} />
        <ConditionalBadge field={field} />
      </label>
      {field.description && <p className="mb-1 text-xs text-gray-400">{field.description}</p>}
      {field.type === 'textarea' && <textarea rows={3} {...commonProps} />}
      {field.type === 'dropdown' && (
        <select {...commonProps}>
          <option>{field.options[0] || 'Select an option'}</option>
        </select>
      )}
      {field.type === 'checkbox' &&
        (field.options.length > 0 ? (
          <div className="space-y-1">
            {field.options.map((opt, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-gray-500">
                <input type="checkbox" disabled className="h-4 w-4 rounded border-gray-300" />
                {opt}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No options added yet.</p>
        ))}
      {field.type === 'radio' &&
        (field.options.length > 0 ? (
          <div className="space-y-1">
            {field.options.map((opt, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-gray-500">
                <input type="radio" disabled className="h-4 w-4 border-gray-300" />
                {opt}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No options added yet.</p>
        ))}
      {field.type === 'toggle' && (
        <label className="flex items-center gap-2 text-sm text-gray-500">
          <input type="checkbox" disabled defaultChecked={field.defaultValue === 'true'} className="h-4 w-4 rounded border-gray-300" />
          On / Off
        </label>
      )}
      {field.type === 'phone' && field.showCountryCode ? (
        <div className="flex gap-2">
          <select disabled className="w-28 shrink-0 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-500">
            <option>{field.defaultCountry ? COUNTRY_CALLING_CODES[field.defaultCountry] : '+—'}</option>
          </select>
          <input type="tel" {...commonProps} />
        </div>
      ) : (
        ['text', 'email', 'phone', 'date', 'datetime', 'time', 'password'].includes(field.type) && (
          <input
            type={field.type === 'phone' ? 'tel' : field.type === 'datetime' ? 'datetime-local' : field.type}
            {...commonProps}
          />
        )
      )}
      {field.type === 'file' && (
        <input type="file" disabled multiple={field.fileOptions?.allowMultiple} className={commonProps.className} />
      )}
      {field.repeatable && <p className="mt-1 text-xs font-medium text-purple-600">+ Add another</p>}
    </div>
  )
}

// Mirrors how the form actually renders for a customer on the storefront —
// used by the "Preview" tab, so it's deliberately plain (no card chrome) and
// uses a neutral submit button instead of the admin's purple branding.
export function FormPreview({ name, fields, settings }) {
  const visibleFields = fields.filter((f) => f.type !== 'hidden')
  const t = BUILT_IN_TRANSLATIONS[settings.language] || BUILT_IN_TRANSLATIONS.en

  return (
    <div>
      <h2 className="text-3xl font-semibold text-gray-900">{settings.publicTitle || name}</h2>
      {settings.description && <p className="mt-2 text-sm text-gray-600">{settings.description}</p>}

      <div className="mt-8 space-y-6">
        {(() => {
          let page = 1
          return visibleFields.map((field, i) => {
            if (i > 0 && field.newPage) page += 1
            return (
              <div key={field.key || field._id}>
                {i > 0 && field.newPage && (
                  <p className="mb-6 border-t border-dashed border-gray-300 pt-4 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
                    — Page {page} —
                  </p>
                )}
                <PreviewField field={field} t={t} />
              </div>
            )
          })
        })()}
        {visibleFields.length === 0 && <p className="text-sm text-gray-400">This form has no fields yet.</p>}
      </div>

      <hr className="mt-8 border-gray-200" />
      <div className="mt-6 flex justify-end">
        <button type="button" disabled className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white">
          {settings.submitButtonText}
        </button>
      </div>
    </div>
  )
}
