import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sso() {
  const { loginWithToken } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState(token ? 'pending' : 'missing')

  useEffect(() => {
    if (!token) return
    loginWithToken(token)
      .then(() => setStatus('done'))
      .catch(() => setStatus('failed'))
  }, [token])

  if (status === 'done') return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {status === 'missing' && <p className="text-sm text-red-600">No login token found in the link.</p>}
        {status === 'failed' && <p className="text-sm text-red-600">That login link is invalid or expired.</p>}
        {status === 'pending' && <p className="text-sm text-gray-500">Signing you in…</p>}
      </div>
    </div>
  )
}
