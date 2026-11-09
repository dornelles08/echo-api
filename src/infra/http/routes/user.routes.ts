import type { FastifyInstance } from "fastify";

import { profile } from "../controllers/user/profile.controller";
import { verifySession } from "../middlewares/verify-session";

export async function userRoutes(app: FastifyInstance) {
  app.get("/me", { onRequest: [verifySession] }, profile);
}
