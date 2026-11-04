import type { FastifyInstance } from "fastify";

import { createUser } from "../controllers/user/create-user.controller";
import { profile } from "../controllers/user/profile.controller";
import { verifyJwt } from "../middlewares/verify-jwt";

export async function userRoutes(app: FastifyInstance) {
  app.post("/users", createUser);
  app.get("/me", { onRequest: [verifyJwt] }, profile);
}
