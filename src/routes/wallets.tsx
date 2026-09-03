import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/wallets')({
  component: WalletsRoute,
})

function WalletsRoute() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Wallets</h1>
      <p className="text-muted-foreground mt-2">Digital asset wallets route.</p>
    </div>
  )
}
