'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/services/db'
import { Question, QuizResult, PASSING_PERCENTAGE } from '@/types'

interface QuizInterfaceProps {
  testId: string
}

export default function QuizInterface({ testId }: QuizInterfaceProps) {
  const { user } = useAuth()
  const router = useRouter()

  const [viewState, setViewState] = useState<'loading' | 'intro' | 'active' | 'result' | 'error'>('loading')
  const [introCountdown, setIntroCountdown] = useState(10)
  const [errorMessage, setErrorMessage] = useState('')
  const [tabWarning, setTabWarning] = useState<string | null>(null)

  const [testTitle, setTestTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [examDuration, setExamDuration] = useState(0)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [result, setResult] = useState<QuizResult | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasSubmitted = useRef(false)
  const tabSwitchCount = useRef(0)

  useEffect(() => {
    const test = db.getTestById(testId)
    if (!test) {
      setErrorMessage('Test not found')
      setViewState('error')
      return
    }

    if (test.questions.length === 0) {
      setErrorMessage('This test has no questions yet.')
      setViewState('error')
      return
    }

    setTestTitle(test.title)
    setQuestions(test.questions)
    const duration = test.questions.length * 120
    setExamDuration(duration)
    setTimeLeft(duration)
    setAnswers(new Array(test.questions.length).fill(-1))

    setViewState('intro')
  }, [testId])

  useEffect(() => {
    if (viewState === 'intro') {
      const countdownInterval = setInterval(() => {
        setIntroCountdown(prev => {
          if (prev === 1) {
            clearInterval(countdownInterval)
            setViewState('active')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(countdownInterval)
    }
  }, [viewState])

  useEffect(() => {
    if (viewState === 'active') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            submitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }
  }, [viewState])

  const handleVisibilityChange = useCallback(() => {
    if (viewState === 'active' && document.hidden) {
      tabSwitchCount.current += 1
      
      if (tabSwitchCount.current === 1) {
        setTabWarning('⚠️ Warning: Tab switching detected. This is your only warning!')
      } else if (tabSwitchCount.current >= 2) {
        setTabWarning('❌ Tab switched again. Test will be cancelled.')
        setTimeout(() => {
          terminateForCheating()
        }, 5000)
      }
    }
  }, [viewState])

  useEffect(() => {
    if (viewState === 'active') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [viewState, handleVisibilityChange])

  const selectAnswer = (optionIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentIndex] = optionIndex
    setAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const submitQuiz = () => {
    if (hasSubmitted.current) return
    hasSubmitted.current = true

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    let score = 0
    const categoryBreakdown: Record<string, number> = {}

    questions.forEach((q, i) => {
      if (!categoryBreakdown[q.category]) {
        categoryBreakdown[q.category] = 0
      }
      if (answers[i] === q.correctAnswerIndex) {
        score++
        categoryBreakdown[q.category]++
      }
    })

    const percentage = (score / questions.length) * 100
    const passed = percentage >= PASSING_PERCENTAGE

    const quizResult: QuizResult = {
      id: Math.random().toString(36).substr(2, 9),
      testId: testId,
      testTitle: testTitle,
      studentId: user!.id,
      studentName: user!.username,
      score: score,
      totalQuestions: questions.length,
      passed: passed,
      date: new Date().toISOString(),
      categoryBreakdown: categoryBreakdown,
      status: 'COMPLETED'
    }

    db.saveResult(quizResult)
    setResult(quizResult)
    setViewState('result')
  }

  const terminateForCheating = () => {
    if (hasSubmitted.current) return
    hasSubmitted.current = true

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    const quizResult: QuizResult = {
      id: Math.random().toString(36).substr(2, 9),
      testId: testId,
      testTitle: testTitle,
      studentId: user!.id,
      studentName: user!.username,
      score: 0,
      totalQuestions: questions.length,
      passed: false,
      date: new Date().toISOString(),
      categoryBreakdown: {},
      status: 'FAILED_CHEATING'
    }

    db.saveResult(quizResult)
    setResult(quizResult)
    setViewState('result')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (viewState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600">Loading test...</p>
        </div>
      </div>
    )
  }

  if (viewState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 text-3xl">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Error</h1>
          <p className="text-slate-500 mb-6">{errorMessage}</p>
          <button
            onClick={() => router.push('/student')}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (viewState === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-10 text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <img src="/numl-logo.jpeg" alt="NUML Logo" className="h-16 w-16" />
        </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">{testTitle}</h1>
          <div className="space-y-3 text-left bg-slate-50 rounded-xl p-6 mb-8">
            <p className="flex items-center gap-3 text-slate-700">
              <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">📊</span>
              <span><strong>{questions.length}</strong> Questions</span>
            </p>
            <p className="flex items-center gap-3 text-slate-700">
              <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">⏱️</span>
              <span><strong>{Math.floor(examDuration / 60)}</strong> Minutes</span>
            </p>
            <p className="flex items-center gap-3 text-slate-700">
              <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">✅</span>
              <span>Passing Score: <strong>{PASSING_PERCENTAGE}%</strong></span>
            </p>
            <p className="flex items-center gap-3 text-red-600 font-medium">
              <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold text-sm">⚠️</span>
              <span>Tab switching will cancel the test</span>
            </p>
          </div>

          <div className="text-6xl font-black text-indigo-600 mb-4 animate-pulse">
            {introCountdown}
          </div>
          <p className="text-slate-500 text-lg">Test starting...</p>
        </div>
      </div>
    )
  }

  if (viewState === 'active') {
    const currentQ = questions[currentIndex]
    const progress = ((currentIndex + 1) / questions.length) * 100

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-900">{testTitle}</h2>
              <p className="text-xs text-slate-500">
                Question {currentIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`font-mono font-bold text-lg ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                ⏱️ {formatTime(timeLeft)}
              </div>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {tabWarning && (
          <div className={`${tabSwitchCount.current >= 2 ? 'bg-red-600' : 'bg-orange-500'} text-white py-3 px-6 text-center font-bold animate-pulse`}>
            {tabWarning}
          </div>
        )}

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase mb-4">
                {currentQ.category}
              </span>
              <h3 className="text-2xl font-bold text-slate-900 leading-relaxed">
                {currentQ.text}
              </h3>
            </div>

            <div className="space-y-3 mb-8">
              {currentQ.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    answers[currentIndex] === i
                      ? 'border-indigo-600 bg-indigo-50 shadow-md'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium text-slate-900">{option}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end items-center pt-6 border-t border-slate-100">
              {/* <button
                onClick={prevQuestion}
                disabled={true}
                
                className="px-6 py-3 opacity-0 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Previous
              </button> */}

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={submitQuiz}
                  className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg transition"
                >
                  Submit Test
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-slate-200 py-4">
          <div className="max-w-4xl mx-auto px-6 flex gap-2 flex-wrap justify-center">
            {questions.map((_, i) => (
              <button
              disabled
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-10 h-10 rounded-lg font-bold text-sm transition ${
                  i === currentIndex
                    ? 'bg-indigo-600 text-white'
                    : answers[i] !== -1
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (viewState === 'result' && result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-slate-200">
          {result.status === 'FAILED_CHEATING' ? (
            <>
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                ❌
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-4">Test Cancelled</h1>
              <p className="text-slate-600 mb-8">
                Your test was terminated due to tab switching. This attempt has been recorded.
              </p>
            </>
          ) : result.passed ? (
            <>
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                🎉
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-4">Congratulations!</h1>
              <p className="text-slate-600 mb-8">You passed the test!</p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                📝
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-4">Test Complete</h1>
              <p className="text-slate-600 mb-8">Keep practicing to improve your score.</p>
            </>
          )}

          {result.status !== 'FAILED_CHEATING' && (
            <div className="bg-slate-50 rounded-2xl p-6 mb-8">
              <div className="text-6xl font-black text-indigo-600 mb-2">
                {result.score}/{result.totalQuestions}
              </div>
              <p className="text-slate-500">
                {Math.round((result.score / result.totalQuestions) * 100)}% Score
              </p>
            </div>
          )}

          {result.categoryBreakdown && Object.keys(result.categoryBreakdown).length > 0 && (
            <div className="mb-8 space-y-3">
              <h3 className="font-bold text-slate-900 mb-4">Category Breakdown</h3>
              {Object.entries(result.categoryBreakdown).map(([cat, count]) => (
                <div key={cat} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                  <span className="font-medium text-slate-700">{cat}</span>
                  <span className="font-bold text-indigo-600">{count} correct</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => router.push('/student')}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return null
}
