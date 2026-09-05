import { createFileRoute } from "@tanstack/react-router";
import LegacyRoot from "@/legacy/LegacyRoot";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Aetheris Capital — Client Portal" },
      {
        name: "description",
        content:
          "Access your Aetheris Capital account: portfolio dashboard, investment mandates, wallets, referrals and profile settings.",
      },
      { property: "og:title", content: "Aetheris Capital — Client Portal" },
      {
        property: "og:description",
        content:
          "Sign in to manage your Aetheris Capital mandates, wallets and referrals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LegacyRoot,
});
