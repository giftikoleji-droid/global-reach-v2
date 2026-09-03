import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/referrals')({
  component: ReferralsRoute,
})

function ReferralsRoute() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Refer & Earn</h1>
      <p className="text-muted-foreground mt-2">Referral program route.</p>
    </div>
  )
}
