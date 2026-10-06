import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as formsApi from '../../api/forms.api'
import { ToggleSwitch } from './FormBuilderFields'
import { makeSettings } from './formTemplates'

export default function CreateFormPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [internalName, setInternalName] = useState('')
  const [notify, setNotify] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    setSaving(true)
    try {
      const created = await formsApi.create({
        name: internalName.trim() || title.trim(),
        status: 'draft',
        fields: [],
        settings: makeSettings({ publicTitle: title.trim(), notifyOnSubmission: notify }),
      })
      navigate(`/forms/${created._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create form')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-[672px] max-w-full">
      <Link to="/forms" className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
            clipRule="evenodd"
          />
        </svg>
        <h1 className="text-2xl font-semibold">Create form</h1>
      </Link>
      <p className="mt-1 text-sm text-gray-500">Set up a new form to collect data from your customers.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Form details</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <div className="relative">
              <input
                value={title}
                maxLength={255}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Contact Us, Request a Quote"
                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-14 text-sm focus:border-purple-500 focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {title.length}/255
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">The title shown to customers when they view the form.</p>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Internal name</label>
            <div className="relative">
              <input
                value={internalName}
                maxLength={255}
                onChange={(e) => setInternalName(e.target.value)}
                placeholder="e.g. Contact Form v2, Quote Request (UK)"
                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-14 text-sm focus:border-purple-500 focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {internalName.length}/255
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Used to identify the form in your dashboard. If left empty, the title will be used.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Receive new submission notifications?</p>
              <p className="text-xs text-gray-400">
                This can be configured in the "New submission notifications" workflow.
              </p>
            </div>
            <ToggleSwitch checked={notify} onChange={setNotify} />
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <Link
            to="/forms"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create Form'}
          </button>
        </div>
      </form>
    </div>
  )
}
