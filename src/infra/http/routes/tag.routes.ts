import type { FastifyInstance } from "fastify";

import { fetchTags } from "../controllers/tag/fetch-tags.controller";
import { verifySession } from "../middlewares/verify-session";

export async function tagRoutes(app: FastifyInstance) {
  app.get("/", { onRequest: [verifySession] }, fetchTags);
}
