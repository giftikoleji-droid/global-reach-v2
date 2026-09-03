import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/portfolio')({
  component: PortfolioPage,
})

function PortfolioPage() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Portfolio</h1>
      <p className="text-muted-foreground mt-2">Portfolio overview route.</p>
    </div>
  )
}
