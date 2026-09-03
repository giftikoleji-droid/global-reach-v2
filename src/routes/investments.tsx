import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/investments')({
  component: InvestmentsRoute,
})

function InvestmentsRoute() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Investments / Plans</h1>
      <p className="text-muted-foreground mt-2">Investment mandates route.</p>
    </div>
  )
}
