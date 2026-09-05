import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AuthPage } from "../components/AuthPage";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const router = useRouter();

  return (
    <AuthPage
      initialView="signup"
      onSuccess={() => {
        void router.navigate({ to: "/dashboard" });
      }}
    />
  );
}
