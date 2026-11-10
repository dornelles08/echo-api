import type { FastifyInstance } from "fastify";

import { env } from "../../env";

export async function authProvidersRoutes(app: FastifyInstance) {
  app.get("/auth/providers", async () => {
    const providers: string[] = [];

    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
      providers.push("google");
    }

    if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
      providers.push("github");
    }

    return { providers };
  });
}
