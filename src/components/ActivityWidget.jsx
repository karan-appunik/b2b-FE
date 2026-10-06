import { useEffect, useMemo, useState } from 'react'
import * as ordersApi from '../api/orders.api'

const DAY_OPTIONS = [
  { value: 1, label: 'Today' },
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
]

const CURRENT_COLOR = '#2563eb'
const PREVIOUS_COLOR = '#059669'

export function formatMoney(value, currency = 'USD') {
  const prefix = currency === 'USD' ? 'US$' : `${currency} `
  return `${prefix}${Math.round(value).toLocaleString('en-US')}`
}

// Picks a "nice" round step (1/2/5 x a power of ten) so axis ticks land on
// clean numbers like 0/2,000/4,000 instead of arbitrary quarters of the max.
function niceStep(maxValue, tickCount) {
  const rawStep = maxValue / tickCount || 1
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const residual = rawStep / magnitude
  let niceResidual
  if (residual > 5) niceResidual = 10
  else if (residual > 2) niceResidual = 5
  else if (residual > 1) niceResidual = 2
  else niceResidual = 1
  return niceResidual * magnitude
}

// Catmull-Rom to cubic-Bezier — turns the point set into a smooth curve
// instead of straight jagged segments.
function smoothPath(points) {
  if (points.length < 2) return ''
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

function DeltaBadge({ pct }) {
  if (pct === 0) return <span className="text-xs font-medium text-gray-400">0%</span>
  const up = pct > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? 'text-green-600' : 'text-red-600'}`}>
      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
        {up ? (
          <path
            fillRule="evenodd"
            d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
            clipRule="evenodd"
            transform="rotate(180 10 10)"
          />
        ) : (
          <path
            fillRule="evenodd"
            d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
            clipRule="evenodd"
          />
        )}
      </svg>
      {Math.abs(pct)}%
    </span>
  )
}

function StatCard({ label, value, pct }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3.5 py-2.5">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-gray-900">{value}</span>
        <DeltaBadge pct={pct} />
      </div>
    </div>
  )
}

function LineChart({ series }) {
  const [hoverIndex, setHoverIndex] = useState(null)
  const width = 760
  const height = 240
  const padLeft = 56
  const padRight = 16
  const padTop = 12
  const padBottom = 28
  const plotWidth = width - padLeft - padRight
  const plotHeight = height - padTop - padBottom

  const maxValue = Math.max(0, ...series.flatMap((p) => [p.current, p.previous]))
  const tickCount = 4
  const step = niceStep(maxValue || 8000, tickCount)
  const yMax = step * tickCount
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => i * step)

  function x(i) {
    return padLeft + (series.length > 1 ? (i / (series.length - 1)) * plotWidth : plotWidth / 2)
  }
  function y(value) {
    return padTop + plotHeight - (value / yMax) * plotHeight
  }

  const currentPoints = series.map((p, i) => ({ x: x(i), y: y(p.current) }))
  const previousPoints = series.map((p, i) => ({ x: x(i), y: y(p.previous) }))
  const currentPath = smoothPath(currentPoints)
  const previousPath = smoothPath(previousPoints)

  const labelStep = Math.max(1, Math.ceil(series.length / 8))
  const hovered = hoverIndex != null ? series[hoverIndex] : null

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * width
    const ratio = Math.min(1, Math.max(0, (px - padLeft) / plotWidth))
    const idx = Math.round(ratio * (series.length - 1))
    setHoverIndex(Number.isFinite(idx) ? idx : null)
  }

  function rangeLabel(startDateStr, endDateStr) {
    const year = new Date(endDateStr + 'T00:00:00').getFullYear()
    return `${formatDate(startDateStr)} – ${formatDate(endDateStr)} ${year}`
  }

  const previousRangeLabel =
    series.length > 0 ? rangeLabel(series[0].previousDate, series[series.length - 1].previousDate) : ''
  const currentRangeLabel =
    series.length > 0 ? rangeLabel(series[0].date, series[series.length - 1].date) : ''

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full cursor-crosshair"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={padLeft} x2={width - padRight} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeWidth="1" />
              <text x={padLeft - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#9ca3af">
                {t >= 1000 ? `US$${t / 1000}k` : `US$${t}`}
              </text>
            </g>
          ))}

          {series.map((p, i) =>
            i % labelStep === 0 ? (
              <text key={p.date} x={x(i)} y={height - 6} textAnchor="middle" fontSize="11" fill="#9ca3af">
                {formatDate(p.date)}
              </text>
            ) : null,
          )}

          <path d={previousPath} fill="none" stroke={PREVIOUS_COLOR} strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" />
          <path d={currentPath} fill="none" stroke={CURRENT_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {hovered && (
            <g>
              <line x1={x(hoverIndex)} x2={x(hoverIndex)} y1={padTop} y2={padTop + plotHeight} stroke="#d1d5db" strokeWidth="1" />
              <circle cx={x(hoverIndex)} cy={y(hovered.current)} r="4" fill={CURRENT_COLOR} stroke="#fff" strokeWidth="2" />
              <circle cx={x(hoverIndex)} cy={y(hovered.previous)} r="4" fill={PREVIOUS_COLOR} stroke="#fff" strokeWidth="2" />
            </g>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 w-44 -translate-x-1/2 -translate-y-full rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg"
            style={{
              left: `${(x(hoverIndex) / width) * 100}%`,
              top: `${(Math.min(y(hovered.current), y(hovered.previous)) / height) * 100}%`,
              marginTop: '-10px',
            }}
          >
            <p className="mb-2 text-sm font-semibold text-gray-900">Sales Performance</p>
            <div className="space-y-2">
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-gray-500">
                  <span className="h-2 w-2 rounded-full" style={{ background: PREVIOUS_COLOR }} />
                  {formatDate(hovered.previousDate)}
                </p>
                <span className="ml-3.5 inline-block rounded-md bg-gray-100 px-2 py-1 font-medium text-gray-700">
                  {formatMoney(hovered.previous)}
                </span>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-gray-500">
                  <span className="h-2 w-2 rounded-full" style={{ background: CURRENT_COLOR }} />
                  {formatDate(hovered.date)}
                </p>
                <span className="ml-3.5 inline-block rounded-md bg-gray-100 px-2 py-1 font-medium text-gray-700">
                  {formatMoney(hovered.current)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: PREVIOUS_COLOR }} />
          {previousRangeLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: CURRENT_COLOR }} />
          {currentRangeLabel}
        </span>
      </div>
    </div>
  )
}

// The filters + stat cards + chart block — shared between the Home page
// (a summary widget) and the dedicated Activity page (same widget, plus an
// orders table below it).
export default function ActivityWidget({ days, onDaysChange, type, onTypeChange, stats, loading }) {
  const seriesWithPreviousDates = useMemo(() => {
    if (!stats?.series?.length) return []
    return stats.series.map((point) => {
      const prevDate = new Date(new Date(point.date + 'T00:00:00').getTime() - days * 24 * 60 * 60 * 1000)
      return { ...point, previousDate: prevDate.toISOString().slice(0, 10) }
    })
  }, [stats, days])

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={days}
            onChange={(e) => onDaysChange(Number(e.target.value))}
            className="appearance-none rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-10 text-sm text-gray-700 focus:border-purple-500 focus:outline-none"
          >
            {DAY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="relative">
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            className="appearance-none rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-10 text-sm text-gray-700 focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All activity types</option>
            <option value="orders">Orders</option>
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {loading || !stats ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            <StatCard label="Orders" value={stats.orders.value} pct={stats.orders.changePct} />
            <StatCard label="Total sales" value={formatMoney(stats.totalSales.value)} pct={stats.totalSales.changePct} />
            <StatCard
              label="Average order value"
              value={formatMoney(stats.averageOrderValue.value)}
              pct={stats.averageOrderValue.changePct}
            />
          </div>
          <LineChart series={seriesWithPreviousDates} />
        </>
      )}
    </div>
  )
}

export function useActivityStats() {
  const [days, setDays] = useState(7)
  const [type, setType] = useState('all')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    ordersApi
      .stats(days)
      .then(setStats)
      .finally(() => setLoading(false))
  }, [days])

  return { days, setDays, type, setType, stats, loading }
}
