import type { CookieSerializeOptions } from "@fastify/cookie";

import { env } from "../env";

export function refreshCookieOptions(): CookieSerializeOptions {
  const isProduction = env.NODE_ENV === "production";

  return {
    path: "/",
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 60 * 60 * 24 * 7,
  };
}
