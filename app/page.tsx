'use client'
export const dynamic = 'force-dynamic';
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MarketingHomepage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to demo page for VC presentation
    router.push('/demo')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-8"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Redirecting to Demo...</h1>
        <p className="text-gray-600">Preparing your Claimso enterprise demonstration</p>
      </div>
    </div>
  )
}