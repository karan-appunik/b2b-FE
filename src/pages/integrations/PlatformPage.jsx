import { useAuth } from '../../context/AuthContext'

export default function PlatformPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">eCommerce Platform</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your connected Shopify store integration and sync settings.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 font-bold">
              🛍️
            </span>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Shopify Integration</h2>
              <p className="text-xs text-gray-500">{user?.shop || 'Connected Shopify Store'}</p>
            </div>
          </div>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Connected
          </span>
        </div>

        <div className="mt-4 space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span>Store Domain</span>
            <span className="font-mono text-gray-900">{user?.shop || 'upsell-eetydt7p.myshopify.com'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span>Sync Frequency</span>
            <span className="text-gray-900">Real-time webhooks + 10m polling</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Webhook Status</span>
            <span className="inline-flex items-center gap-1.5 text-green-600 font-medium text-xs">
              <span className="h-2 w-2 rounded-full bg-green-500"></span> Active & Listening
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
