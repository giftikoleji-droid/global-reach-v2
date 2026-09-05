export function requireEnv(name: string): string {
  const val = (import.meta as any)?.env?.[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return String(val);
}

export default requireEnv;
