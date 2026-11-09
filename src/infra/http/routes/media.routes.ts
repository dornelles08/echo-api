import type { FastifyInstance } from "fastify";

import { createMedia } from "../controllers/media/create-media.controller";
import { fetchMedias } from "../controllers/media/fetch-medias.controller";
import { getMedia } from "../controllers/media/get-media.controller";
import { summaryMedia } from "../controllers/media/summary-media.controller";
import { verifySession } from "../middlewares/verify-session";

export async function mediaRoutes(app: FastifyInstance) {
  app.post("/", { onRequest: [verifySession] }, createMedia);
  app.get("/", { onRequest: [verifySession] }, fetchMedias);
  app.get("/:mediaId", { onRequest: [verifySession] }, getMedia);
  app.post("/:mediaId/summary", { onRequest: [verifySession] }, summaryMedia);
}
