import { useEffect, useState } from "react";
import { Menu, X, ChevronRight } from "lucide-react";

const NAV = [
  { label: "Markets", href: "#markets" },
  { label: "Yield Strategies", href: "#plans" },
  { label: "Calculator", href: "#calculator" },
  { label: "About Us", href: "#about" },
  { label: "Legal & Compliance", href: "#legal" },
  { label: "Consultation", href: "#consultation" },
];

type DrawerItem = {
  label: string;
  href: string;
  badge?: string;
  badgeTone?: "gold" | "green";
};

const DRAWER_GROUPS: { title: string; items: DrawerItem[] }[] = [
  {
    title: "Product & Yield",
    items: [
      { label: "Fixed-Yield Mandates", href: "#plans", badge: "Up to 25%" },
      { label: "Yield Engine & Strategy", href: "#yield-engine" },
      { label: "Benchmark Feeds", href: "#markets" },
      { label: "Yield Calculator", href: "#calculator" },
    ],
  },
  {
    title: "Company & Governance",
    items: [
      { label: "Corporate Overview", href: "#about" },
      { label: "Legal & Compliance", href: "#legal" },
      { label: "Terms & Conditions", href: "#terms" },
      { label: "Institutional Consultation", href: "#consultation" },
    ],
  },
  {
    title: "Support & DevOps",
    items: [
      { label: "24/7 Global Support Desk", href: "#support" },
      {
        label: "CI/CD Deployment Hub",
        href: "#cicd",
        badge: "Active",
        badgeTone: "green",
      },
    ],
  },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      <div
        className={`glass-bar hairline-b transition-shadow duration-300 ${
          scrolled ? "shadow-[0_18px_40px_-30px_oklch(0_0_0/80%)]" : ""
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-8 md:py-4">
          <a href="#top" className="flex min-w-0 items-center gap-3">
            <span className="gold-fill grid size-11 shrink-0 place-items-center rounded-xl font-display text-lg font-bold tracking-tight">
              Æ
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-[0.95rem] font-semibold leading-tight tracking-[0.06em] md:text-base">
                AETHERIS CAPITAL
              </span>
              <span className="eyebrow block truncate text-muted-foreground">
                Global Institutional Desk
              </span>
            </span>
          </a>

          <nav className="ml-auto hidden items-center gap-6 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-4">
            <a
              href="#account"
              className="hidden rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent sm:inline-flex"
            >
              Client login
            </a>
            <a
              href="#account"
              className="gold-fill hidden items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold lg:inline-flex"
            >
              Open account <ChevronRight className="size-4" />
            </a>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-navigation-drawer"
              onClick={() => setOpen((v) => !v)}
              className="grid size-10 place-items-center rounded-lg border border-border text-foreground transition-colors hover:bg-accent lg:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Promise strip */}
      <div className="glass-bar hairline-b overflow-hidden">
        <p className="eyebrow marquee-mask flex whitespace-nowrap py-2 text-gold-soft">
          <span className="animate-marquee flex shrink-0">
            {[0, 1].map((k) => (
              <span key={k} className="flex shrink-0">
                {[
                  "Open to everyone",
                  "Institutional-grade custody",
                  "Defined mandate terms",
                  "Start from $50",
                ].map((t) => (
                  <span key={t} className="px-5">
                    {t} <span className="text-gold/50">•</span>
                  </span>
                ))}
              </span>
            ))}
          </span>
        </p>
      </div>

      {/* Mobile drawer — matches original project menu */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            id="mobile-navigation-drawer"
            aria-label="Mobile navigation"
            className="animate-fade-in absolute inset-y-0 right-0 flex w-[min(92vw,380px)] flex-col border-l border-hairline bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hairline-b flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="gold-fill grid size-9 place-items-center rounded-lg font-display text-sm font-bold">
                  Æ
                </span>
                <span className="font-display text-sm font-semibold tracking-[0.06em]">
                  AETHERIS CAPITAL
                </span>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="grid size-9 place-items-center rounded-lg border border-border text-foreground transition-colors hover:bg-accent"
              >
                <X className="size-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-5 pb-6">
              {DRAWER_GROUPS.map((group) => (
                <div key={group.title} className="pt-5">
                  <p className="eyebrow pb-2 text-muted-foreground">
                    {group.title}
                  </p>
                  <div className="grid gap-1">
                    {group.items.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm text-foreground transition-colors hover:bg-accent"
                      >
                        <span>{item.label}</span>
                        {item.badge ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                              item.badgeTone === "green"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-gold/15 text-gold"
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="hairline-t grid gap-2 px-5 py-4">
              <a
                href="#account"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-full border border-border px-4 py-3 text-sm text-foreground transition-colors hover:bg-accent"
              >
                Client login
              </a>
              <a
                href="#account"
                onClick={() => setOpen(false)}
                className="gold-fill flex items-center justify-center gap-1 rounded-full px-4 py-3 text-sm font-semibold"
              >
                Open account <ChevronRight className="size-4" />
              </a>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
