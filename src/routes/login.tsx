import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AuthPage } from "../components/AuthPage";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();

  return (
    <AuthPage
      initialView="login"
      onSuccess={() => {
        void router.navigate({ to: "/dashboard" });
      }}
    />
  );
}
