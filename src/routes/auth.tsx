import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication</h1>
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  )
}
