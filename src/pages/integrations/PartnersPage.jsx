export default function PartnersPage() {
  const PARTNERS = [
    {
      name: 'Brightpearl by Sage',
      category: 'ERP & Inventory',
      desc: 'Connect Brightpearl to sync inventory, prices, and B2B orders.',
      connected: false,
    },
    {
      name: 'Klaviyo',
      category: 'Marketing Automation',
      desc: 'Send personalized B2B emails, order confirmations, and abandoned quotes.',
      connected: false,
    },
    {
      name: 'HubSpot',
      category: 'CRM',
      desc: 'Sync wholesale B2B accounts, sales reps, and customer tiers.',
      connected: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Partner Integrations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect third-party apps and ERP solutions to extend your wholesale operations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PARTNERS.map((p) => (
          <div key={p.name} className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">{p.category}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-gray-900">{p.name}</h3>
              <p className="mt-1 text-xs text-gray-500">{p.desc}</p>
            </div>
            <div className="mt-5">
              <button
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500"
              >
                Connect App
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
