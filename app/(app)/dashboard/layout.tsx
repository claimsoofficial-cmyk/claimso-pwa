import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AuthenticatedNavbar from '@/components/shared/AuthenticatedNavbar'

// User interface
interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

/**
 * App Layout Component
 * Provides authenticated layout with navbar for all app pages
 * Automatically redirects unauthenticated users to login
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login
  if (authError || !user) {
    console.log('User not authenticated, redirecting to login')
    redirect('/login')
  }

  // Type assertion for user data
  const authenticatedUser: User = {
    id: user.id,
    email: user.email || '',
    user_metadata: user.user_metadata
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Authenticated Navigation Bar */}
      <AuthenticatedNavbar user={authenticatedUser} />
      
      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}