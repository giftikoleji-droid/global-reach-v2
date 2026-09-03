import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '../components/AuthPage'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  return (
    <AuthPage
      initialView="signup"
      onSuccess={() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard'
        }
      }}
    />
  )
}
