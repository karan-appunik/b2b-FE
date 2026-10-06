import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as discountsApi from '../../api/discounts.api'

function GripIcon() {
  return (
    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="8" cy="6" r="1.4" />
      <circle cx="8" cy="12" r="1.4" />
      <circle cx="8" cy="18" r="1.4" />
      <circle cx="14" cy="6" r="1.4" />
      <circle cx="14" cy="12" r="1.4" />
      <circle cx="14" cy="18" r="1.4" />
    </svg>
  )
}

// docs.sparklayer.io/discounts "Discount Priorities" — "you can then simply
// drag the discounts up and down in the priority you'd like them to apply."
// Position in this list becomes each discount's priority (top = applied
// first) once Save is clicked.
export default function DiscountPrioritiesPage() {
  const navigate = useNavigate()
  const [discounts, setDiscounts] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  useEffect(() => {
    discountsApi.list().then((data) => {
      const sorted = [...data].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
      setDiscounts(sorted)
      setLoaded(true)
    })
  }, [])

  function handleDragStart(index) {
    setDragIndex(index)
  }

  function handleDragOver(e, index) {
    e.preventDefault()
    setOverIndex(index)
  }

  function handleDrop(index) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }
    setDiscounts((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(null)
    setOverIndex(null)
  }

  function move(index, delta) {
    const target = index + delta
    if (target < 0 || target >= discounts.length) return
    setDiscounts((prev) => {
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await discountsApi.reorderPriorities(discounts.map((d) => d._id))
      navigate('/discounts')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/discounts" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        ‹ Discounts
      </Link>
      <h1 className="mt-1 text-2xl font-semibold text-gray-900">Manage Priorities</h1>
      <p className="mt-1 text-sm text-gray-500">
        Drag discounts up and down to set the order they're considered in at checkout. Discounts nearer the
        top get first pick when more than one could apply.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {!loaded ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">Loading…</p>
        ) : discounts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">No discounts to prioritize yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {discounts.map((d, index) => (
              <li
                key={d._id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => {
                  setDragIndex(null)
                  setOverIndex(null)
                }}
                className={`flex cursor-move items-center gap-3 px-4 py-3 ${
                  overIndex === index && dragIndex !== null && dragIndex !== index ? 'bg-purple-50' : ''
                } ${dragIndex === index ? 'opacity-40' : ''}`}
              >
                <GripIcon />
                <span className="w-6 shrink-0 text-sm font-medium text-gray-400">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{d.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {d.method === 'coupon' ? `Coupon: ${(d.couponCodes || []).join(', ')}` : 'Automatic'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === discounts.length - 1}
                    aria-label="Move down"
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Link
          to="/discounts"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !loaded || discounts.length === 0}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save priorities'}
        </button>
      </div>
    </div>
  )
}
