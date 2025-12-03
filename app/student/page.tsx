'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/types'
import StudentDashboard from '@/components/StudentDashboard'

export default function StudentPage() {
  const { user } = useAuth()
  const router = useRouter()

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

  return <StudentDashboard />
}
