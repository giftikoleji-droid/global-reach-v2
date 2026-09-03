import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type DashboardRoute = "dashboard" | "investments" | "wallets" | "referrals" | "profile";

type DashboardContextValue = {
  route: DashboardRoute;
  navigate: (route: DashboardRoute) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

function pathFor(route: DashboardRoute) {
  return route === "dashboard" ? "/dashboard" : `/${route}`;
}

function routeForPath(path: string): DashboardRoute {
  if (path === "/investments") return "investments";
  if (path === "/wallets") return "wallets";
  if (path === "/referrals") return "referrals";
  if (path === "/profile") return "profile";
  return "dashboard";
}

export function DashboardProvider({ children, initialRoute = "dashboard" }: { children: ReactNode; initialRoute?: DashboardRoute }) {
  const [route, setRoute] = useState<DashboardRoute>(initialRoute);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onPopState = () => setRoute(routeForPath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (next: DashboardRoute) => {
    window.history.pushState({}, "", pathFor(next));
    setRoute(next);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const value = useMemo(() => ({ route, navigate, mobileOpen, setMobileOpen }), [route, mobileOpen]);
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const value = useContext(DashboardContext);
  if (!value) throw new Error("useDashboard must be used inside DashboardProvider");
  return value;
}
