import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '../components/AuthPage'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <AuthPage
      initialView="login"
      onSuccess={() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard'
        }
      }}
    />
  )
}
