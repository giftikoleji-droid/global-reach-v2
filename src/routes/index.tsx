import { createFileRoute } from "@tanstack/react-router";
import LegacyRoot from "@/legacy/LegacyRoot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aetheris Capital — Structured Digital-Asset Mandates" },
      {
        name: "description",
        content:
          "Structured digital-asset investment mandates with defined terms, transparent positioning and institutional-grade custody. Start from $50.",
      },
      {
        property: "og:title",
        content: "Aetheris Capital — Structured Digital-Asset Mandates",
      },
      {
        property: "og:description",
        content:
          "Defined mandate terms, transparent portfolio positioning and qualified custody for digital assets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LegacyRoot,
});
