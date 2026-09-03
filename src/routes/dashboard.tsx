import { createFileRoute, redirect } from '@tanstack/react-router'
import { Dashboard } from '../dashboard/Dashboard'
import { useAuth } from '../lib/AuthContext'

export const Route = createFileRoute('/dashboard')({
  component: DashboardRoute,
})

function DashboardRoute() {
  const { session, profile, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white">
        Loading portfolio…
      </div>
    )
  }

  if (!session) {
    // Soft redirect – router will handle proper navigation once routeTree is regenerated
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  return (
    <Dashboard
      profile={profile}
      onLogout={() => void logout()}
      onBrowsePlans={() => {
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', '/investments')
          window.dispatchEvent(new PopStateEvent('popstate'))
        }
      }}
      onChoosePlan={(planId) => {
        // Placeholder – integrate PlanModal later
        console.log('Choose plan', planId)
      }}
    />
  )
}
