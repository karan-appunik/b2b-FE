import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import * as authApi from '../api/auth.api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await authApi.resetPassword({ email, token, password })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">SparkLayer</h1>
        <p className="mb-6 text-sm text-gray-500">Reset your password</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !token || !email}
            className="w-full rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? 'Resetting…' : 'Reset Password'}
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
