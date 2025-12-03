'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db } from '@/services/db'
import { useAuth } from '@/context/AuthContext'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const user = db.register(username, password)
      login(user)
      router.push('/student')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Registration failed')
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
       <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600 to-teal-800 opacity-90"></div>
        <div className="relative z-10 p-12 text-white max-w-lg">
        <div className="flex flex-col items-center mb-8">
            <img src="/numl-logo.jpeg" alt="NUML Logo" className="h-26 w-26 mb-4" />
            <h1 className="text-4xl font-bold tracking-tight">Admission Test System</h1>
            <h1 className="text-4xl font-bold mb-4 mt-2">Numl Admission Test</h1>
        </div>
          
          <p className="text-lg text-emerald-50 leading-relaxed">
          NUML official admission tests online.
          </p>
           <ul className="mt-8 space-y-4">
            <li className="flex items-center">
              <span className="bg-emerald-500/20 px-4 py-3 rounded-full mr-3">✓</span>
              Conducted under standardized test conditions as per NUML guidelines.
            </li>
            <li className="flex items-center">
              <span className="bg-emerald-500/20 px-4 py-3 rounded-full mr-3">✓</span>
              System-based evaluation with accurate and fair result processing.
            </li>
            <li className="flex items-center">
              <span className="bg-emerald-500/20 px-4 py-3 rounded-full mr-3">✓</span>
              Secure exam environment to ensure transparency and integrity.
            </li>
          </ul>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
            <p className="mt-2 text-gray-600">Start your journey today.</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  className="appearance-none block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-gray-900"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="appearance-none block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-gray-900"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform hover:scale-[1.01]"
            >
              Get Started
            </button>

             <div className="text-center mt-4">
              <span className="text-gray-600 text-sm">Already have an account? </span>
              <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500 transition">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
