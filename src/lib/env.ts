/** Read a required Vite public env var. Throws if missing or empty. */
export function requireEnv(name: string): string {
  const value = import.meta.env[name] as string | undefined;
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

/** Optional env helper — returns undefined when unset. */
export function optionalEnv(name: string): string | undefined {
  const value = import.meta.env[name] as string | undefined;
  return value || undefined;
}
