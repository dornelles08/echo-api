import type { FastifyInstance } from "fastify";

import { fetchTags } from "../controllers/tag/fetch-tags.controller";
import { verifyJwt } from "../middlewares/verify-jwt";

export async function tagRoutes(app: FastifyInstance) {
  app.get("/", { onRequest: [verifyJwt] }, fetchTags);
}
