'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/services/db'
import { Question, QuizCategory, QuizResult, Test } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { generateQuestions } from '@/services/geminiService'

export default function AdminDashboard() {
  const { logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'tests' | 'results'>('tests')
  const [results, setResults] = useState<QuizResult[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  
  const [loadingAI, setLoadingAI] = useState(false)
  const [showCreateTest, setShowCreateTest] = useState(false)
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState('')

  const [newTestTitle, setNewTestTitle] = useState('')
  const [newTestDesc, setNewTestDesc] = useState('')
  const [newQText, setNewQText] = useState('')
  const [newQCategory, setNewQCategory] = useState<QuizCategory>(QuizCategory.ENGLISH)
  const [newQOptions, setNewQOptions] = useState(['', '', '', ''])
  const [newQCorrect, setNewQCorrect] = useState(0)

  useEffect(() => { refreshData() }, [])

  const refreshData = () => {
    try {
      const r = db.getResults()
      const t = db.getTests()
      setResults(Array.isArray(r) ? r : [])
      setTests(Array.isArray(t) ? t : [])
      
      if (selectedTest) {
        const updated = t.find(test => test.id === selectedTest.id)
        if (updated) setSelectedTest(updated)
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e)
    }
  }

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault()
    db.createTest(newTestTitle, newTestDesc)
    setNewTestTitle('')
    setNewTestDesc('')
    setShowCreateTest(false)
    refreshData()
  }

  const handleAddManualQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTest) return
    const q: Question = {
      id: Math.random().toString(36).substr(2, 9),
      text: newQText,
      category: newQCategory,
      options: newQOptions,
      correctAnswerIndex: newQCorrect
    }
    db.addQuestionToTest(selectedTest.id, q)
    setNewQText('')
    setNewQOptions(['', '', '', ''])
    setShowAddQuestion(false)
    refreshData()
  }

  const handleGenerateAI = async (category: QuizCategory) => {
    if (!selectedTest) return
    setLoadingAI(true)
    try {
      const newQs = await generateQuestions(category, 5)
      newQs.forEach(q => {
        const fullQ = { ...q, id: Math.random().toString(36).substr(2, 9) }
        db.addQuestionToTest(selectedTest.id, fullQ)
      })
      refreshData()
    } catch (e) { 
      console.error(e)
      alert("Generation failed. Please check your network or API key.") 
    } finally { 
      setLoadingAI(false) 
    }
  }

  const handleDeleteTest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm("Delete this test?")) {
      db.deleteTest(id)
      if (selectedTest?.id === id) setSelectedTest(null)
      refreshData()
    }
  }

  const copyShareLink = (testId: string) => {
    const link = `${window.location.origin}/quiz/${testId}`
    
    navigator.clipboard.writeText(link).then(() => {
      setCopyFeedback('Link Copied!')
      setTimeout(() => setCopyFeedback(''), 2000)
    })
  }

  const pieData = useMemo(() => {
    if (!Array.isArray(results) || results.length === 0) return []

    const counts: Record<string, number> = {}
    
    results.forEach(r => {
      if (r && typeof r === 'object' && r.categoryBreakdown) {
        Object.entries(r.categoryBreakdown).forEach(([cat, count]) => {
          if (typeof count === 'number') {
            counts[cat] = (counts[cat] || 0) + count
          }
        })
      }
    })
    
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'] 
    
    let currentAngle = 0
    return Object.entries(counts).map(([name, value], i) => {
      const percentage = total === 0 ? 0 : (value / total) * 100
      const start = currentAngle
      currentAngle += percentage
      return { name, value, percentage, start, end: currentAngle, color: colors[i % colors.length] }
    })
  }, [results])

  const pieGradient = useMemo(() => {
     return pieData.length > 0 
      ? `conic-gradient(${pieData.map(d => `${d.color} ${d.start}% ${d.end}%`).join(', ')})`
      : '#cbd5e1' 
  }, [pieData])

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString)
      if (isNaN(d.getTime())) return 'Invalid Date'
      return d.toLocaleDateString()
    } catch (e) {
      return 'Unknown Date'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
                <img src="/numl-logo.jpeg" alt="NUML Logo" className="h-16 w-auto" />
                <span className="text-lg font-bold text-slate-800 tracking-tight"><span className="text-indigo-600">Admin</span></span>
            </div>
        </div>
        <div className="p-4 space-y-2">
          <button onClick={() => { setActiveTab('tests'); setSelectedTest(null) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'tests' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            <span className="text-lg">📝</span> Tests
          </button>
          <button onClick={() => { setActiveTab('results'); setSelectedTest(null) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'results' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            <span className="text-lg">📊</span> Analytics
          </button>
        </div>
        <div className="mt-auto p-4 border-t border-slate-100">
          <button onClick={() => { logout(); router.push('/login') }} className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition px-2">
            <span className="text-lg">🚪</span> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        
        {activeTab === 'tests' && !selectedTest && (
          <div className="animate-fade-in max-w-5xl mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Quiz Management</h1>
                <p className="text-slate-500 mt-2">Create, edit, and distribute your assessments.</p>
              </div>
              <button onClick={() => setShowCreateTest(true)} className="bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg hover:bg-indigo-600 transition-all flex items-center gap-2 font-medium">
                + New Test
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map(test => (
                <div key={test.id} onClick={() => setSelectedTest(test)} className="group bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer hover:shadow-xl hover:shadow-indigo-50 hover:border-indigo-200 transition-all duration-300 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                    </div>
                    <button onClick={(e) => handleDeleteTest(test.id, e)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{test.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 h-10">{test.description}</p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">{test.questions.length} Questions</span>
                    <span className="text-indigo-600 text-sm font-medium group-hover:translate-x-1 transition-transform">Manage →</span>
                  </div>
                </div>
              ))}
              {tests.length === 0 && <div className="col-span-full py-10 text-center text-slate-400 bg-white border border-dashed border-slate-300 rounded-2xl">No tests found. Create one to get started.</div>}
            </div>
          </div>
        )}

        {activeTab === 'tests' && selectedTest && (
          <div className="animate-slide-up max-w-5xl mx-auto">
             <button onClick={() => setSelectedTest(null)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition font-medium">
               ← Back to All Tests
             </button>
             
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
               <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                 <div>
                   <h1 className="text-3xl font-bold text-slate-900">{selectedTest.title}</h1>
                   <p className="text-slate-500 mt-2">{selectedTest.description}</p>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => copyShareLink(selectedTest.id)} className="relative px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition flex items-center gap-2">
                      🔗 Share Link
                      {copyFeedback && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg animate-fade-in whitespace-nowrap">
                          {copyFeedback}
                        </span>
                      )}
                    </button>
                    <button onClick={() => setShowAddQuestion(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-200">
                      + Add Question
                    </button>
                 </div>
               </div>

               <div className="mt-8 p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white relative overflow-hidden shadow-lg">
                 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                   <div>
                     <h3 className="font-bold text-lg flex items-center gap-2">✨ AI Question Generator</h3>
                     <p className="text-indigo-100 text-sm">Instantly generate 5 questions using Gemini AI.</p>
                   </div>
                   <div className="flex gap-2 flex-wrap">
                     {Object.values(QuizCategory).map(cat => (
                       <button key={cat} onClick={() => handleGenerateAI(cat)} disabled={loadingAI} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold backdrop-blur-sm transition disabled:opacity-50">
                         {loadingAI ? '...' : `+ ${cat}`}
                       </button>
                     ))}
                   </div>
                 </div>
               </div>
             </div>

             <div className="space-y-4">
               {selectedTest.questions.map((q, idx) => (
                 <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-300 transition group relative">
                    <button onClick={() => { db.removeQuestionFromTest(selectedTest.id, q.id); refreshData() }} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">🗑</button>
                    <div className="flex gap-4">
                      <span className="text-slate-300 font-bold text-xl">#{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">{q.category}</span>
                        </div>
                        <h4 className="text-lg font-medium text-slate-900 mb-4">{q.text}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {q.options.map((opt, i) => (
                            <div key={i} className={`text-sm px-3 py-2 rounded-lg border ${i === q.correctAnswerIndex ? 'bg-green-50 border-green-200 text-green-700 font-medium' : 'bg-slate-50 border-transparent text-slate-500'}`}>
                              {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                 </div>
               ))}
               {selectedTest.questions.length === 0 && <div className="text-center py-12 text-slate-400">No questions yet. Add one manually or use AI.</div>}
             </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="animate-fade-in max-w-7xl mx-auto">
             <h1 className="text-3xl font-bold text-slate-900 mb-8">Performance Analytics</h1>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                 <p className="text-slate-500 text-sm font-semibold uppercase">Total Attempts</p>
                 <p className="text-4xl font-bold text-slate-900 mt-2">{results.length}</p>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                 <p className="text-slate-500 text-sm font-semibold uppercase">Overall Pass Rate</p>
                 <p className="text-4xl font-bold text-emerald-600 mt-2">{results.length > 0 ? Math.round((results.filter(r => r.passed).length / results.length) * 100) : 0}%</p>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                 <p className="text-slate-500 text-sm font-semibold uppercase">Avg Score</p>
                 <p className="text-4xl font-bold text-indigo-600 mt-2">{results.length > 0 ? (results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(1) : 0}</p>
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                 <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Scores</h3>
                 <div className="h-64 flex items-end justify-between gap-2 overflow-x-auto pb-2">
                   {results.slice(-10).map((r, i) => {
                     const percent = Math.min(100, (r.score / (r.totalQuestions || 1)) * 100)
                     return (
                       <div key={i} className="flex flex-col items-center gap-2 group flex-1 min-w-[40px]">
                         <div className="relative w-full flex justify-center">
                            <div 
                              className={`w-full max-w-[30px] rounded-t-lg transition-all duration-500 ${r.passed ? 'bg-indigo-500 group-hover:bg-indigo-600' : 'bg-red-400 group-hover:bg-red-500'}`} 
                              style={{ height: `${percent * 2}px`, maxHeight: '200px' }}
                            ></div>
                            <div className="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                              {r.score}/{r.totalQuestions}
                            </div>
                         </div>
                         <span className="text-xs text-slate-500 truncate w-full text-center">{r.studentName ? r.studentName.substring(0,6) : 'Unk'}</span>
                       </div>
                     )
                   })}
                   {results.length === 0 && <div className="w-full text-center text-slate-400 self-center">No data available</div>}
                 </div>
               </div>

               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Correct Answers by Category</h3>
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div 
                      className="w-48 h-48 rounded-full shadow-inner relative flex-shrink-0"
                      style={{ background: pieGradient }}
                    >
                      <div className="absolute inset-0 m-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-xs text-slate-400 font-bold uppercase text-center">Correct<br/>Distribution</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      {pieData.map((d, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{d.name}</span>
                            <span className="text-xs text-slate-400">{d.value} correct ({Math.round(d.percentage)}%)</span>
                          </div>
                        </div>
                      ))}
                      {pieData.length === 0 && <div className="text-slate-400 text-sm">No analytics data yet.</div>}
                    </div>
                  </div>
               </div>
             </div>


            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Student Attempts (Detailed)</h3>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                  {results.length} attempts
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Student</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Quiz</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Score</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase w-48">Category Breakdown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.slice().reverse().map((r, i) => {
                      const categoryData = r.categoryBreakdown || {}
                      const totalCorrect = Object.values(categoryData).reduce((sum, val) => sum + (val as number), 0)
                      const totalQuestions = r.totalQuestions || 0
                      
                      return (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{r.studentName}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{r.testTitle}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{formatDate(r.date)}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">
                              {r.score}/{r.totalQuestions}
                            </div>
                            <div className="text-xs text-emerald-600 font-medium">
                              {Math.round((r.score / r.totalQuestions) * 100)}%
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {r.status === 'FAILED_CHEATING' ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                Cancelled (Tab Switch)
                              </span>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                r.passed 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {r.passed ? '✓ Passed' : '✗ Failed'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {Object.keys(categoryData).length > 0 ? (
                              <div className="space-y-1">
                                {Object.entries(categoryData).map(([category, correctCount]: [string, number]) => {
                                  const percentage = Math.round((correctCount / totalQuestions) * 100)
                                  
                                  return (
                                    <div key={category} className="flex items-center justify-between text-xs">
                                      <span className="font-medium text-slate-700 capitalize">{category}</span>
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className={`w-16 h-2 rounded-full overflow-hidden bg-slate-200`}>
                                          <div 
                                            className="h-full rounded-full transition-all"
                                            style={{
                                              width: `${Math.min(percentage, 100)}%`,
                                              backgroundColor: percentage >= 70 ? '#10b981' : 
                                                              percentage >= 40 ? '#f59e0b' : '#ef4444'
                                            }}
                                          />
                                        </span>
                                        <span className={`font-bold ${
                                          percentage >= 70 ? 'text-green-700' : 
                                          percentage >= 40 ? 'text-amber-700' : 'text-red-700'
                                        }`}>
                                          {correctCount}/{totalQuestions}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">No breakdown available</span>
                            )}
                          </td>
                        </tr>
    
                      )
                    })}
                    {results.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl">
                              📊
                            </div>
                            No attempts recorded yet.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </main>

      {showCreateTest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scale-in text-left">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">New Test</h2>
            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 placeholder-slate-500" placeholder="e.g. Math Basics" required value={newTestTitle} onChange={e => setNewTestTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 placeholder-slate-500" placeholder="Brief description..." required value={newTestDesc} onChange={e => setNewTestDesc(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowCreateTest(false)} className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddQuestion && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xl animate-scale-in max-h-[90vh] overflow-y-auto text-left">
             <h2 className="text-2xl font-bold mb-4 text-slate-900">Add Question</h2>
             <form onSubmit={handleAddManualQuestion} className="space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Question Text</label>
                  <input className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500" placeholder="Enter question..." required value={newQText} onChange={e => setNewQText(e.target.value)} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                    <select className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-900" value={newQCategory} onChange={e => setNewQCategory(e.target.value as QuizCategory)}>
                    {Object.values(QuizCategory).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Correct Answer</label>
                    <input type="number" className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-900" placeholder="Index (0-3)" min="0" max="3" required value={newQCorrect} onChange={e => setNewQCorrect(Number(e.target.value))} />
                    <p className="text-xs text-slate-500 mt-1">0=First Option, 1=Second...</p>
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="block text-sm font-semibold text-slate-700">Options</label>
                 {newQOptions.map((o, i) => (
                   <input key={i} className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500 mb-2" placeholder={`Option ${i+1}`} required value={o} onChange={e => { const c = [...newQOptions]; c[i] = e.target.value; setNewQOptions(c) }} />
                 ))}
               </div>
               <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowAddQuestion(false)} className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Add</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  )
}
