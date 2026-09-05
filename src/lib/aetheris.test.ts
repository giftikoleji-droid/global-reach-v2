import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const aetheris = readFileSync(path.join(root, "src/lib/aetheris.ts"), "utf8");
const routeTree = readFileSync(path.join(root, "src/routeTree.gen.ts"), "utf8");

describe("aetheris source contracts", () => {
  it("defines investment plans", () => {
    assert.match(aetheris, /export const PLANS/);
    assert.match(aetheris, /id:\s*"starter"/);
  });

  it("exposes wallet proofs with optional verificationLink", () => {
    assert.match(aetheris, /export type WalletProof/);
    assert.match(aetheris, /verificationLink\?:/);
    assert.match(aetheris, /WALLET_PROOFS/);
  });

  it("exposes db.getBalance and db.getTransactions", () => {
    assert.match(aetheris, /async getBalance\(userId: string\)/);
    assert.match(aetheris, /async getTransactions\(userId: string\)/);
  });

  it("exports resolvePlan and format helpers", () => {
    assert.match(aetheris, /export function resolvePlan/);
    assert.match(aetheris, /export function formatUSD/);
    assert.match(aetheris, /export function generateRefCode/);
  });
});

describe("route tree", () => {
  const required = [
    "/dashboard",
    "/login",
    "/signup",
    "/investments",
    "/portfolio",
    "/profile",
    "/referrals",
    "/wallets",
    "/auth",
  ];

  for (const route of required) {
    it(`includes ${route}`, () => {
      assert.ok(
        routeTree.includes(`path: '${route}'`) ||
          routeTree.includes(`path: "${route}"`),
      );
    });
  }
});
