import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as authApi from '../api/auth.api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      const data = await authApi.forgotPassword({ email })
      setMessage(data.message)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">SparkLayer</h1>
        <p className="mb-6 text-sm text-gray-500">
          Please enter your email address to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>

          {message && (
            <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link to="/login" className="text-purple-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
