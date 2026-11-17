import { useState } from 'react'
import { INTERNAL_FIELD_TYPES, REVIEW_STATUSES, makeInternalField } from './internalFieldTypes'

const TYPE_LABELS = Object.fromEntries(INTERNAL_FIELD_TYPES.map((t) => [t.value, t.label]))
const REVIEW_STATUS_LABELS = { pending: 'Pending review', approved: 'Approved', rejected: 'Rejected' }

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

function DisplayLogicEditor({ field, onChange }) {
  const enabled = field.visibleWhenReviewStatus.length > 0

  function toggle(checked) {
    onChange({ ...field, visibleWhenReviewStatus: checked ? ['pending'] : [] })
  }

  function toggleStatus(status, checked) {
    const set = new Set(field.visibleWhenReviewStatus)
    if (checked) set.add(status)
    else set.delete(status)
    onChange({ ...field, visibleWhenReviewStatus: Array.from(set) })
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => toggle(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        Only show for specific application status
      </label>
      {enabled && (
        <div className="mt-2 flex flex-wrap gap-4 pl-6">
          {REVIEW_STATUSES.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={field.visibleWhenReviewStatus.includes(s)}
                onChange={(e) => toggleStatus(s, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              {REVIEW_STATUS_LABELS[s]}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function TypeAwareEditor({ field, onChange, allowGroup }) {
  function set(patch) {
    onChange({ ...field, ...patch })
  }

  function setOption(i, value) {
    const options = [...field.options]
    options[i] = value
    set({ options })
  }

  return (
    <div className="border-t border-gray-100 px-4 py-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Label</label>
          <input
            required
            value={field.label}
            onChange={(e) => set({ label: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Field type</label>
          <select
            value={field.type}
            onChange={(e) => {
              const type = e.target.value
              set({
                type,
                options: type === 'select' ? field.options : [],
                fields: type === 'group' ? field.fields || [] : undefined,
              })
            }}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          >
            {INTERNAL_FIELD_TYPES.filter((t) => allowGroup || t.value !== 'group').map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {field.type === 'select' && (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-gray-500">Options</label>
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
                  onClick={() => set({ options: field.options.filter((_, idx) => idx !== i) })}
                  className="cursor-pointer text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set({ options: [...field.options, ''] })}
              className="cursor-pointer text-sm font-medium text-purple-600 hover:underline"
            >
              + Add option
            </button>
          </div>
        </div>
      )}

      {field.type === 'button' && (
        <p className="mt-3 text-xs text-gray-400">
          Workflows aren't available yet — clicking this button on an entry just records that it
          was clicked.
        </p>
      )}

      {field.type === 'group' && (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-gray-500">Fields in this group</label>
          <NestedFieldListEditor fields={field.fields || []} onChange={(fields) => set({ fields })} />
        </div>
      )}

      <DisplayLogicEditor field={field} onChange={onChange} />
    </div>
  )
}

function FieldRow({ field, expanded, onToggle, onChange, onRemove, dragHandlers, allowGroup }) {
  const hasDisplayLogic = field.visibleWhenReviewStatus.length > 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white" {...dragHandlers}>
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left">
          <span className="truncate font-medium text-gray-900">{field.label || 'Untitled field'}</span>
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {TYPE_LABELS[field.type]}
          </span>
          {hasDisplayLogic && (
            <span className="shrink-0 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
              Display logic
            </span>
          )}
        </button>
        <div className="flex shrink-0 items-center gap-3 pl-3">
          <button type="button" onClick={onRemove} className="cursor-pointer text-gray-400 hover:text-red-600" title="Delete field">
            <TrashIcon />
          </button>
          <span className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing" title="Drag to reorder">
            <GripIcon />
          </span>
        </div>
      </div>
      {expanded && <TypeAwareEditor field={field} onChange={onChange} allowGroup={allowGroup} />}
    </div>
  )
}

// Fields inside a "group" — one level deep, so no group-in-group.
function NestedFieldListEditor({ fields, onChange }) {
  const [expandedKey, setExpandedKey] = useState(null)
  const [dragIndex, setDragIndex] = useState(null)

  function keyOf(f) {
    return f.key || f._id
  }

  function update(i, field) {
    const next = [...fields]
    next[i] = field
    onChange(next)
  }

  function remove(i) {
    onChange(fields.filter((_, idx) => idx !== i))
  }

  function move(from, to) {
    if (from === to || from == null || to == null) return
    const next = [...fields]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {fields.map((field, i) => {
        const key = keyOf(field)
        return (
          <FieldRow
            key={key}
            field={field}
            expanded={expandedKey === key}
            onToggle={() => setExpandedKey(expandedKey === key ? null : key)}
            onChange={(f) => update(i, f)}
            onRemove={() => remove(i)}
            allowGroup={false}
            dragHandlers={{
              draggable: true,
              onDragStart: () => setDragIndex(i),
              onDragOver: (e) => e.preventDefault(),
              onDrop: (e) => {
                e.preventDefault()
                move(dragIndex, i)
                setDragIndex(null)
              },
              onDragEnd: () => setDragIndex(null),
            }}
          />
        )
      })}
      <button
        type="button"
        onClick={() => onChange([...fields, makeInternalField()])}
        className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        + Add field to group
      </button>
    </div>
  )
}

export function InternalFieldListEditor({ fields, onChange }) {
  const [expandedKey, setExpandedKey] = useState(null)
  const [dragIndex, setDragIndex] = useState(null)

  function keyOf(f) {
    return f.key || f._id
  }

  function update(i, field) {
    const next = [...fields]
    next[i] = field
    onChange(next)
  }

  function remove(i) {
    onChange(fields.filter((_, idx) => idx !== i))
  }

  function move(from, to) {
    if (from === to || from == null || to == null) return
    const next = [...fields]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Internal fields</h2>
      <p className="mb-4 text-sm text-gray-500">
        Admin-only fields for reviewing entries — never shown to (or collected from) the customer.
      </p>
      <div className="space-y-3">
        {fields.map((field, i) => {
          const key = keyOf(field)
          return (
            <FieldRow
              key={key}
              field={field}
              expanded={expandedKey === key}
              onToggle={() => setExpandedKey(expandedKey === key ? null : key)}
              onChange={(f) => update(i, f)}
              onRemove={() => remove(i)}
              allowGroup
              dragHandlers={{
                draggable: true,
                onDragStart: () => setDragIndex(i),
                onDragOver: (e) => e.preventDefault(),
                onDrop: (e) => {
                  e.preventDefault()
                  move(dragIndex, i)
                  setDragIndex(null)
                },
                onDragEnd: () => setDragIndex(null),
              }}
            />
          )
        })}
        {fields.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
            No internal fields yet.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange([...fields, makeInternalField()])}
        className="mt-4 cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        + Add field
      </button>
    </section>
  )
}
