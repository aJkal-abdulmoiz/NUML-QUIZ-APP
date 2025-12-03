'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/services/db'
import { useAuth } from '@/context/AuthContext'
import { Test, QuizResult } from '@/types'

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [tests, setTests] = useState<Test[]>([])
  const [myResults, setMyResults] = useState<QuizResult[]>([])

  useEffect(() => {
     
    const allTests = db.getTests()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTests(allTests)

    if (user) {
      const allResults = db.getResults()
      const filtered = allResults.filter(r => r.studentId === user.id)
      setMyResults(filtered)
    }
  }, [user])

  const startQuiz = (testId: string) => {
    router.push(`/quiz/${testId}`)
  }

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString)
      if (isNaN(d.getTime())) return 'Invalid Date'
      return d.toLocaleDateString()
    } catch {
      return 'Unknown Date'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex items-center gap-3">
                <img src="/numl-logo.jpeg" alt="NUML Logo" className="h-16 w-16" />
            <div>
              <p className="font-bold text-slate-900">Welcome, {user?.username}!</p>
              <p className="text-xs text-slate-500">Student Portal</p>
            </div>
          </div>

          </div>
          <button
            onClick={() => { logout(); router.push('/login') }}
            className="px-4 py-2 text-slate-600 hover:text-red-600 transition font-medium flex items-center gap-2"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-2">Available Tests</h1>
          <p className="text-slate-600">Choose a test below to begin your assessment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {tests.map(test => {
            const attempted = myResults.find(r => r.testId === test.id)
            return (
              <div
                key={test.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      📝
                    </div>
                    {attempted && (
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">{test.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{test.description}</p>

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-6">
                    <span className="flex items-center gap-1">
                      <span className="font-bold">{test.questions.length}</span> Questions
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-bold">~{test.questions.length * 2}</span> mins
                    </span>
                  </div>

                  <button
                    onClick={() => startQuiz(test.id)}
                    disabled={!!attempted}
                    className={`w-full py-3 ${attempted ? 'bg-green-600' : 'bg-slate-900 hover:bg-indigo-600 '} text-white rounded-xl font-bold transition-colors shadow-md group-hover:shadow-lg`}
                  >
                    {attempted ? 'Attempted' : 'Start Test'}
                  </button>
                </div>
              </div>
            )
          })}

          {tests.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                📚
              </div>
              <p className="text-slate-400 text-lg">No tests available yet.</p>
              <p className="text-slate-400 text-sm">Check back later for new assessments.</p>
            </div>
          )}
        </div>

        {myResults.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">My Results</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Test</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Score</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myResults.slice().reverse().map((result, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{result.testTitle}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{formatDate(result.date)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {result.score}/{result.totalQuestions}
                        </td>
                        <td className="px-6 py-4">
                          {result.status === 'FAILED_CHEATING' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                              Cancelled (Tab Switch)
                            </span>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                result.passed
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {result.passed ? '✓ Passed' : '✗ Failed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
