import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import * as formsApi from '../../api/forms.api'
import { FORM_TEMPLATES, getTemplate } from './formTemplates'

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

// Native overflow-x scrollbars are invisible on browsers/OSes that use overlay
// scrollbars (no layout space reserved, only shown while actively scrolling), so a
// CSS-only scrollbar can't be relied on to be visible. This renders a persistent,
// draggable scrollbar bar underneath the table, synced to the container's scroll state.
function HorizontalScrollbar({ containerRef }) {
  const trackRef = useRef(null)
  const [thumb, setThumb] = useState({ ratio: 1, offset: 0 })

  const update = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const ratio = el.clientWidth / el.scrollWidth
    const maxScroll = el.scrollWidth - el.clientWidth
    const offset = maxScroll > 0 ? el.scrollLeft / maxScroll : 0
    setThumb({ ratio: Math.min(ratio, 1), offset })
  }, [containerRef])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    update()
    el.addEventListener('scroll', update)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [update, containerRef])

  function handleTrackPointerDown(e) {
    const track = trackRef.current
    const container = containerRef.current
    if (!track || !container) return
    const trackRect = track.getBoundingClientRect()
    const thumbWidth = trackRect.width * thumb.ratio
    const maxThumbOffset = trackRect.width - thumbWidth
    const maxScroll = container.scrollWidth - container.clientWidth

    function moveTo(clientX) {
      const x = clientX - trackRect.left - thumbWidth / 2
      const clamped = Math.min(Math.max(x, 0), maxThumbOffset)
      container.scrollLeft = maxThumbOffset > 0 ? (clamped / maxThumbOffset) * maxScroll : 0
    }

    moveTo(e.clientX)
    function onMove(ev) {
      moveTo(ev.clientX)
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  if (thumb.ratio >= 1) return null

  return (
    <div
      ref={trackRef}
      onPointerDown={handleTrackPointerDown}
      className="h-2.5 cursor-pointer border-t border-gray-100 bg-[#f1eeef] px-0.5 py-0.5"
    >
      <div
        className="h-1.5 rounded-full bg-[#c7c2c4] hover:bg-[#b0abad]"
        style={{
          width: `${thumb.ratio * 100}%`,
          marginLeft: `${thumb.offset * (100 - thumb.ratio * 100)}%`,
        }}
      />
    </div>
  )
}

function MoreActionsMenu({ onViewEntries, onEdit, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return
    function closeOnScroll() {
      setOpen(false)
    }
    // capture: true so this also catches scroll on the table's own overflow-x-auto wrapper
    window.addEventListener('scroll', closeOnScroll, true)
    window.addEventListener('resize', closeOnScroll)
    return () => {
      window.removeEventListener('scroll', closeOnScroll, true)
      window.removeEventListener('resize', closeOnScroll)
    }
  }, [open])

  function toggle() {
    if (!open) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen((o) => !o)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggle}
        className="flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        More actions
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: menuPos.top, right: menuPos.right }}
            className="z-50 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            <button
              onClick={() => {
                setOpen(false)
                onViewEntries()
              }}
              className="flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 sm:hidden"
            >
              View entries
            </button>
            <button
              onClick={() => {
                setOpen(false)
                onEdit()
              }}
              className="flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 sm:hidden"
            >
              Edit
            </button>
            <button
              onClick={() => {
                setOpen(false)
                onDuplicate()
              }}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
                className="size-4.5 shrink-0 stroke-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                />
              </svg>
              Duplicate
            </button>
            <button
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
                className="size-4.5 shrink-0 stroke-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
              Delete
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default function FormsPage() {
  const navigate = useNavigate()
  const [forms, setForms] = useState([])
  const scrollContainerRef = useRef(null)

  function refresh() {
    formsApi.list().then(setForms)
  }

  useEffect(refresh, [])

  async function handleDelete(id) {
    if (!confirm('Delete this form? All of its entries will be deleted too.')) return
    await formsApi.remove(id)
    refresh()
  }

  async function handleDuplicate(form) {
    await formsApi.create({
      name: `${form.name} copy`,
      status: 'draft',
      fields: form.fields,
      internalFields: form.internalFields,
      settings: form.settings,
    })
    refresh()
  }

  async function handleCreateFromTemplate(templateId) {
    const template = getTemplate(templateId)
    const created = await formsApi.create({
      name: template.getName(),
      status: 'draft',
      fields: template.getFields(),
      settings: template.getSettings(),
    })
    navigate(`/forms/${created._id}`)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Forms</h1>
        <p className="mt-1 text-sm text-gray-500">Create and manage forms to collect data from your customers.</p>
      </div>

      <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div ref={scrollContainerRef} className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Form name</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Entries</th>
                <th className="px-4 py-3 font-medium">Unread</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {forms.map((form) => (
                <tr key={form._id}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link to={`/forms/${form._id}`} className="font-medium text-purple-600 hover:underline">
                      {form.name}
                    </Link>
                    {form.status === 'draft' && (
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">{formatDate(form.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">{formatDate(form.updatedAt)}</td>
                  <td className="px-4 py-3 text-gray-700">{form.entryCount}</td>
                  <td className="px-4 py-3 text-gray-700">{form.unreadCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/forms/${form._id}/entries`)}
                        className="hidden cursor-pointer whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 sm:inline-flex"
                      >
                        View entries
                      </button>
                      <button
                        onClick={() => navigate(`/forms/${form._id}`)}
                        className="hidden cursor-pointer whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 sm:inline-flex"
                      >
                        Edit
                      </button>
                      <MoreActionsMenu
                        onViewEntries={() => navigate(`/forms/${form._id}/entries`)}
                        onEdit={() => navigate(`/forms/${form._id}`)}
                        onDuplicate={() => handleDuplicate(form)}
                        onDelete={() => handleDelete(form._id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {forms.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No forms yet. Start with a template below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <HorizontalScrollbar containerRef={scrollContainerRef} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500">Form templates</h2>
        <button
          type="button"
          onClick={() => navigate('/forms/new')}
          className="cursor-pointer rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Start with a blank form
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FORM_TEMPLATES.filter((t) => t.id !== 'blank').map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleCreateFromTemplate(t.id)}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 text-left hover:border-purple-300 hover:shadow-sm"
          >
            <p className="font-medium text-gray-900">{t.name} →</p>
            <p className="mt-1 text-sm text-gray-500">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
