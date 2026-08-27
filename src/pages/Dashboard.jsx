import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as dashboardApi from '../api/dashboard.api'
import ActivityWidget, { useActivityStats } from '../components/ActivityWidget'

function RefreshIcon() {
  return (
    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  )
}

function SyncHealthCard({ label, issues, viewLink }) {
  const hasIssues = issues > 0
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <RefreshIcon />
        <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
      </div>
      <div
        className={`mb-3 flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
          hasIssues ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-green-200 bg-green-50 text-green-700'
        }`}
      >
        {hasIssues ? (
          <svg className="h-4 w-4 flex-none" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75Zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5Z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="h-4 w-4 flex-none" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {hasIssues ? `${issues} sync issue${issues === 1 ? '' : 's'}` : 'All synced'}
      </div>
      <Link
        to={viewLink}
        className="inline-flex rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        {`View ${label.toLowerCase()}`}
      </Link>
    </div>
  )
}

const HELP_CARDS = [
  {
    label: 'Book onboarding call',
    description: 'Speak with our expert team',
    href: 'https://docs.sparklayer.io',
    icon: (
      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
        />
      </svg>
    ),
  },
  {
    label: 'Help Center',
    description: 'Browse setup guides',
    href: 'https://docs.sparklayer.io',
    icon: (
      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
    ),
  },
  {
    label: 'Chat with us',
    description: 'Get quick support',
    href: 'https://docs.sparklayer.io',
    icon: (
      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
]

export default function Dashboard() {
  const { days, setDays, type, setType, stats, loading } = useActivityStats()
  const [syncHealth, setSyncHealth] = useState(null)

  useEffect(() => {
    dashboardApi.syncHealth().then(setSyncHealth)
  }, [])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome to SparkLayer</h1>
        <a
          href="https://docs.sparklayer.io"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          What's new
        </a>
      </div>

      <ActivityWidget days={days} onDaysChange={setDays} type={type} onTypeChange={setType} stats={stats} loading={loading} />

      <h2 className="mb-3 mt-8 text-sm font-semibold text-gray-900">Data sync health</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SyncHealthCard label="Product sync" issues={syncHealth?.products.issues ?? 0} viewLink="/products" />
        <SyncHealthCard label="Customer sync" issues={syncHealth?.customers.issues ?? 0} viewLink="/customers" />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-gray-900">Additional help</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {HELP_CARDS.map((card) => (
          <a
            key={card.label}
            href={card.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-purple-300"
          >
            {card.icon}
            <span>
              <span className="block text-sm font-medium text-purple-600">{card.label}</span>
              <span className="block text-xs text-gray-500">{card.description}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
