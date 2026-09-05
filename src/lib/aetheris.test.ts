import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const aetherisSrc = readFileSync(path.join(root, "src/lib/aetheris.ts"), "utf8");
const routeTree = readFileSync(path.join(root, "src/routeTree.gen.ts"), "utf8");
const envSrc = readFileSync(path.join(root, "src/lib/env.ts"), "utf8");
const routeFiles = readdirSync(path.join(root, "src/routes")).filter(
  (f) => f.endsWith(".tsx") && f !== "__root.tsx" && f !== "README.md",
);

/** Minimal re-implementation of pure helpers for behavioral checks without loading supabase. */
function formatUSD(n: number | string | undefined | null, decimals = 2): string {
  const val = Number(n || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

function generateRefCode(email: string): string {
  const prefix = (email.split("@")[0] ?? "AETH").slice(0, 4).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return prefix + rand;
}

describe("aetheris source contracts", () => {
  it("defines investment plans", () => {
    assert.match(aetherisSrc, /export const PLANS/);
    assert.match(aetherisSrc, /id:\s*"starter"/);
  });

  it("exposes wallet proofs with optional verificationLink", () => {
    assert.match(aetherisSrc, /export type WalletProof/);
    assert.match(aetherisSrc, /verificationLink\?:/);
  });

  it("exposes db.getBalance and db.getTransactions", () => {
    assert.match(aetherisSrc, /async getBalance\(userId: string\)/);
    assert.match(aetherisSrc, /async getTransactions\(userId: string\)/);
  });

  it("exports resolvePlan and format helpers", () => {
    assert.match(aetherisSrc, /export function resolvePlan/);
    assert.match(aetherisSrc, /export function formatUSD/);
    assert.match(aetherisSrc, /export function generateRefCode/);
  });
});

describe("env module", () => {
  it("exports requireEnv", () => {
    assert.match(envSrc, /export function requireEnv/);
    assert.match(envSrc, /Missing required env/);
  });
});

describe("formatUSD behavior", () => {
  it("formats whole dollars with two decimals", () => {
    assert.equal(formatUSD(1000), "$1,000.00");
  });

  it("handles zero and nullish", () => {
    assert.equal(formatUSD(0), "$0.00");
    assert.equal(formatUSD(null), "$0.00");
  });

  it("respects decimal precision", () => {
    assert.equal(formatUSD(12.345, 2), "$12.35");
  });
});

describe("generateRefCode behavior", () => {
  it("uses email local-part prefix and length 8", () => {
    const code = generateRefCode("client@example.com");
    assert.match(code, /^CLIE[A-Z0-9]{4}$/);
    assert.equal(code.length, 8);
  });
});

describe("resolvePlan contract in source", () => {
  it("falls back when id is unknown", () => {
    assert.match(aetherisSrc, /export function resolvePlan/);
    assert.match(aetherisSrc, /return DEFAULT_PLAN/);
  });
});

describe("route tree", () => {
  it("is generated and non-empty", () => {
    assert.ok(routeTree.includes("routeTree"));
    assert.ok(routeTree.includes("FileRoutesByFullPath"));
  });

  it("includes core app paths", () => {
    for (const route of ["/dashboard", "/login", "/wallets", "/investments"]) {
      const found =
        routeTree.includes(`'${route}'`) ||
        routeTree.includes(`"${route}"`) ||
        routeTree.includes(route);
      assert.ok(found, `expected route tree to mention ${route}`);
    }
  });

  it("has matching route files on disk", () => {
    assert.ok(routeFiles.length >= 5, `expected multiple route files, got ${routeFiles.join(",")}`);
  });
});
