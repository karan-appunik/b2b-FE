import { useState } from 'react'
import * as agentGrantsApi from '../../api/agentGrants.api'

// Two-step verification for a sales agent: shows whether an authenticator app
// is set up and lets an administrator clear it (for example a lost phone) so
// the agent sets up a new one the next time they are asked.
export default function AgentSecuritySection({ agent }) {
  const [enrolled, setEnrolled] = useState(!!agent.mfa?.enabled)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleReset() {
    if (!confirm(`Reset the authenticator for ${agent.name}? They will set up a new one next time.`)) return

    setBusy(true)
    setError('')
    setMessage('')
    try {
      await agentGrantsApi.resetMfa(agent._id)
      setEnrolled(false)
      setMessage('Authenticator reset.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset the authenticator.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Two-step verification</h2>
      <p className="mb-4 mt-1 text-sm text-gray-500">
        Roles that require it ask for a 6-digit code from an authenticator app (see Customers → Roles).
      </p>

      {message && <p className="mb-3 text-sm text-green-600">{message}</p>}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-700">
          Authenticator app:{' '}
          <span className={enrolled ? 'font-medium text-green-700' : 'text-gray-400'}>
            {enrolled ? 'Set up' : 'Not set up'}
          </span>
        </span>
        {enrolled && (
          <button
            onClick={handleReset}
            disabled={busy}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Reset authenticator
          </button>
        )}
      </div>
    </section>
  )
}
