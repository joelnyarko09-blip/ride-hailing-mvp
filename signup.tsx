import React, { useState } from 'react'
import { signUp } from './services/auth'

type SignupProps = {
  onBack?: () => void
  onContinue?: () => void
  defaultRole?: string
}

export const Signup: React.FC<SignupProps> = ({
  onBack,
  onContinue,
  defaultRole = 'passenger'
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setIsSuccess(false)
      setMessage('Email and password are required.')
      return
    }

    setLoading(true)
    setMessage('')

    const result = await signUp(email.trim(), password, defaultRole)

    setLoading(false)
    setIsSuccess(result.ok)
    setMessage(result.message)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-5">
        <h2 className="text-2xl font-bold">Create Passenger Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
            <input
              type="text"
              value={defaultRole}
              readOnly
              className="w-full border border-gray-200 bg-gray-100 text-gray-600 rounded-lg px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {message && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              isSuccess
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 border border-gray-300 rounded-lg py-2 font-semibold"
            >
              Back
            </button>
          )}
          {onContinue && isSuccess && (
            <button
              type="button"
              onClick={onContinue}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-semibold"
            >
              Continue to App
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Signup
