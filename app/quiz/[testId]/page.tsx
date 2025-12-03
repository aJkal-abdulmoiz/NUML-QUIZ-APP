'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/types'
import QuizInterface from '@/components/QuizInterface'

export default function QuizPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (user.role !== UserRole.STUDENT) {
      router.push('/admin')
    }
  }, [user, router])

  if (!user || user.role !== UserRole.STUDENT) {
    return null
  }

  return <QuizInterface testId={params.testId as string} />
}
