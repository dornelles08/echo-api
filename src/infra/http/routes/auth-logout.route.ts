import type { FastifyInstance } from "fastify";

import { revokeToken } from "../controllers/auth/revoke-token.controller";
import { verifySession } from "../middlewares/verify-session";

export async function authLogoutRoutes(app: FastifyInstance) {
  app.post("/auth/logout", { onRequest: [verifySession] }, revokeToken);
}
