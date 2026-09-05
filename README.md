# Floating Market Refresh

Fix my landing page top sections including the floating market make it finer and more appealing than it's current state

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/55cae029-8d73-4350-8f1f-f9dbfb817b80).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight into this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Quality checks

```sh
npm run check:ci   # lint + TypeScript + production build
npm test           # unit tests (aetheris helpers)
```

## Toolchain notes

- **Lockfile:** this repo uses `bun.lock`. Do not commit `package-lock.json`.
- **rolldown override:** `package.json` pins `rolldown` to `1.2.1` via `overrides` to keep Vite’s native bundler on a known-good release and avoid peer/`@emnapi` resolution churn in CI and local installs.
- **Route tree:** `src/routeTree.gen.ts` is generated from `src/routes/`. Regenerate with the TanStack router generator after adding or renaming routes.
