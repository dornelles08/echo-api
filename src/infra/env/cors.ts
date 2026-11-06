function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function originMatches(pattern: string, origin: string): boolean {
  const regex = new RegExp(`^${pattern.split("*").map(escapeRegex).join(".*")}$`, "i");

  return regex.test(origin);
}

export function parseCorsOrigins(raw: string): string[] {
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Accepts exact origins and wildcard patterns such as `http://localhost:*`,
 * where `*` matches any sequence of characters (e.g. any port).
 */
export function isCorsOriginAllowed(origin: string | undefined, patterns: string[]): boolean {
  // Requests without an Origin header (same-origin, curl, server-to-server).
  if (!origin) {
    return true;
  }

  return patterns.some((pattern) => originMatches(pattern, origin));
}
