import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: DashboardRoute,
})

function DashboardRoute() {
  return (
    <div className="min-h-screen">
      {/* Dashboard component from src/dashboard will be mounted here */}
      <div className="p-8">
        <h1 className="text-2xl font-bold">Client Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Dashboard shell ready. Wire Dashboard component here.
        </p>
      </div>
    </div>
  )
}
