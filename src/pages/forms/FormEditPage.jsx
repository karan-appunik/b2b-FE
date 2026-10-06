import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as formsApi from '../../api/forms.api'
import { FieldListEditor, FormPreview, FormSettingsSection } from './FormBuilderFields'
import { InternalFieldListEditor } from './InternalFieldsBuilder'

const STATUSES = ['draft', 'published', 'archived']

const TABS = [
  { id: 'form', label: 'Form' },
  { id: 'preview', label: 'Preview' },
  { id: 'internal', label: 'Internal fields' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'settings', label: 'Settings' },
  { id: 'embed', label: 'Embed' },
]

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

function UploadIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
      />
    </svg>
  )
}

function ViewEntriesIcon() {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  )
}

function DuplicateIcon() {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
      />
    </svg>
  )
}

function ActionsMenu({ onViewEntries, onDuplicate, onDelete }) {
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
        className="flex cursor-pointer items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        Actions
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => {
              setOpen(false)
              onViewEntries()
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <ViewEntriesIcon />
            View entries
          </button>
          <button
            onClick={() => {
              setOpen(false)
              onDuplicate()
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <DuplicateIcon />
            Duplicate form
          </button>
          <button
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
          >
            <TrashIcon />
            Delete form
          </button>
        </div>
      )}
    </div>
  )
}

function ComingSoonPanel({ title, description }) {
  return (
    <section className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-400">{description}</p>
    </section>
  )
}

// Deliberately tiny and stable — all the actual rendering/validation/submit
// logic lives in the shared /apps/sparklayer/embed.js script (served by
// admin-frontend), so improving that logic never requires merchants to
// re-copy-paste this snippet into their theme again. Only bump this if the
// markup contract between snippet and script itself changes (e.g. renaming
// the data attribute below).
function buildEmbedSnippet(formId) {
  return `<div class="sl-form" data-sparklayer-form-id="${formId}"></div>
<script src="/apps/sparklayer/embed.js" defer></script>`
}

export default function FormEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState(null)
  const [name, setName] = useState('')
  const [status, setStatus] = useState('draft')
  const [fields, setFields] = useState([])
  const [internalFields, setInternalFields] = useState([])
  const [settings, setSettings] = useState(null)
  const [activeTab, setActiveTab] = useState('form')

  const [statusSaving, setStatusSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  function load() {
    formsApi.get(id).then((f) => {
      setForm(f)
      setName(f.name)
      setStatus(f.status)
      setFields(f.fields)
      setInternalFields(f.internalFields || [])
      setSettings(f.settings)
    })
  }

  useEffect(load, [id])

  // There's no separate "Save changes" step — clicking a status pill or
  // "Publish" always persists whatever's currently in the editor (even when
  // the status isn't actually changing, e.g. re-clicking "Published" on an
  // already-published form just saves the latest edits).
  async function handleStatusChange(nextStatus) {
    setError('')
    setMessage('')

    if (!name.trim()) {
      setError('Form name is required.')
      setActiveTab('settings')
      return
    }
    if (fields.some((f) => !f.label.trim())) {
      setError('Every field needs a label.')
      setActiveTab('form')
      return
    }
    const hasUnlabeledInternalField = internalFields.some(
      (f) => !f.label.trim() || (f.fields || []).some((c) => !c.label.trim())
    )
    if (hasUnlabeledInternalField) {
      setError('Every internal field needs a label — remove any unused/empty ones.')
      setActiveTab('internal')
      return
    }

    setStatusSaving(true)
    try {
      const updated = await formsApi.update(id, {
        name: name.trim(),
        status: nextStatus,
        fields,
        internalFields,
        settings,
      })
      setStatus(updated.status)
      setForm(updated)
      setMessage('Changes saved.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes')
    } finally {
      setStatusSaving(false)
    }
  }

  async function handleDuplicate() {
    const copy = await formsApi.create({
      name: `${form.name} copy`,
      status: 'draft',
      fields: form.fields,
      internalFields: form.internalFields,
      settings: form.settings,
    })
    navigate(`/forms/${copy._id}`)
  }

  async function handleDelete() {
    if (!confirm('Delete this form? All of its entries will be deleted too.')) return
    await formsApi.remove(id)
    navigate('/forms')
  }

  function copyEmbed() {
    navigator.clipboard.writeText(buildEmbedSnippet(id)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!form || !settings) {
    return <p className="text-gray-500">Loading…</p>
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Link to="/forms" className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">{form.name}</h1>
          <span className="text-xs font-medium uppercase tracking-wide text-orange-500">Editing</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-gray-300 bg-gray-50 p-0.5 text-sm">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                disabled={statusSaving}
                onClick={() => handleStatusChange(s)}
                className={`cursor-pointer rounded px-3 py-1 capitalize disabled:cursor-default ${
                  status === s ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={statusSaving}
            onClick={() => handleStatusChange('published')}
            className="flex cursor-pointer items-center gap-1.5 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            <UploadIcon />
            {statusSaving ? 'Publishing…' : 'Publish'}
          </button>
          <ActionsMenu
            onViewEntries={() => navigate(`/forms/${id}/entries`)}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto border-b border-gray-200 text-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-1 py-3 font-medium ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {activeTab === 'form' && (
          <>
            <p className="text-xs text-gray-400">
              Tip: expand a field and check "Start a new page before this field" to split the form into
              multiple pages.
            </p>
            <FieldListEditor fields={fields} onChange={setFields} />
          </>
        )}

        {activeTab === 'preview' && (
          <>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Form preview</h2>
              <p className="mt-1 text-sm text-gray-500">Preview how this form currently renders for users.</p>
            </div>
            <FormPreview name={name} fields={fields} settings={settings} />
          </>
        )}

        {activeTab === 'internal' && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">
                  Page 1
                </span>
                <button
                  type="button"
                  disabled
                  title="Multi-page forms aren't available yet"
                  className="cursor-not-allowed text-gray-300"
                >
                  <TrashIcon />
                </button>
              </div>
              <button
                type="button"
                disabled
                title="Multi-page forms aren't available yet"
                className="cursor-not-allowed text-sm font-medium text-gray-300"
              >
                + Add page above
              </button>
            </div>
            <InternalFieldListEditor fields={internalFields} onChange={setInternalFields} />
          </>
        )}

        {activeTab === 'workflows' && (
          <ComingSoonPanel
            title="Workflows aren't available yet"
            description="Automations triggered by field updates, submissions or API calls are planned for a future update."
          />
        )}

        {activeTab === 'settings' && (
          <>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Form settings</h2>
              <p className="mt-1 text-sm text-gray-500">Configure your form's titles, messages, and other settings.</p>
            </div>
            <FormSettingsSection name={name} onNameChange={setName} settings={settings} onChange={setSettings} />
          </>
        )}

        {activeTab === 'embed' && (
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">Embed</h2>
            <p className="mb-4 text-sm text-gray-500">
              Paste this snippet into a custom section/HTML block on your storefront to display this
              form. Only published forms accept submissions.
            </p>
            <textarea
              readOnly
              rows={10}
              value={buildEmbedSnippet(id)}
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700 focus:outline-none"
            />
            <button
              type="button"
              onClick={copyEmbed}
              className="mt-2 cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              {copied ? 'Copied!' : 'Copy snippet'}
            </button>
          </section>
        )}

        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {activeTab !== 'workflows' && activeTab !== 'embed' && activeTab !== 'preview' && (
          <div className="flex justify-end gap-3">
            <Link
              to={`/forms/${id}/entries`}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View entries
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
