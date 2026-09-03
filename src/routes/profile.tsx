import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/profile')({
  component: ProfileRoute,
})

function ProfileRoute() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Profile / Account</h1>
      <p className="text-muted-foreground mt-2">Client profile route.</p>
    </div>
  )
}
