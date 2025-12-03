'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db } from '@/services/db'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/types'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const user = db.login(username, password)
    if (user) {
      login(user)
      router.push(user.role === UserRole.ADMIN ? '/admin' : '/student')
    } else {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-800 opacity-90"></div>
        <div className="relative z-10 p-12 text-white max-w-lg animate-fade-in">
        <div className="flex flex-col items-center mb-8">
            <img src="/numl-logo.jpeg" alt="NUML Logo" className="h-26 w-26 mb-4" />
            <h1 className="text-4xl font-bold ">Admission Test System</h1>
            <h1 className="text-4xl font-bold mb-6 mt-6">Numl Admission Test System</h1>
        </div>

       
          <p className="text-xl text-indigo-100 leading-relaxed font-light">
            Experience the future of assessment. AI-generated questions, real-time analytics, and a beautiful interface.
          </p>
        </div>
        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse-slow"></div>
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse-slow"></div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-slate-500 text-lg">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-700 text-sm font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-800 placeholder-slate-400"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-800 placeholder-slate-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-200 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5"
            >
              Sign In
            </button>

            <div className="text-center mt-6">
              <span className="text-slate-500">Don&apos;t have an account? </span>
              <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-500 transition">
                Create free account
              </Link>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}
