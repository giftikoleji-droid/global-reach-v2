import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { MarketTicker } from "@/components/landing/MarketTicker";
import { Hero } from "@/components/landing/Hero";

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
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="-mt-6 pb-2 pt-6">
        <MarketTicker />
      </div>
      <Hero />
    </main>
  );
}
