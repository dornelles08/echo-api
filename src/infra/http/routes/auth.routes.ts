import type { FastifyInstance } from "fastify";

import { authenticateUser } from "../controllers/auth/authenticate-user.controller";
import { refreshToken } from "../controllers/auth/refresh-token.controller";
import { verifyCookieJwt } from "../middlewares/verify-cookie-jwt";

export async function authRoutes(app: FastifyInstance) {
  app.post("/authenticate", authenticateUser);

  app.post("/refresh-token", { onRequest: [verifyCookieJwt] }, refreshToken);
}
