'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/types'
import AdminDashboard from '@/components/AdminDashboard'

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (user.role !== UserRole.ADMIN) {
      router.push('/student')
    }
  }, [user, router])

  if (!user || user.role !== UserRole.ADMIN) {
    return null
  }

  return <AdminDashboard />
}
