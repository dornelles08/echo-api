import type { FastifyInstance } from "fastify";

import { createMedia } from "../controllers/media/create-media.controller";
import { deleteMedia } from "../controllers/media/delete-media.controller";
import { fetchMedias } from "../controllers/media/fetch-medias.controller";
import { getMedia } from "../controllers/media/get-media.controller";
import { retryTranscription } from "../controllers/media/retry-transcription.controller";
import { summaryMedia } from "../controllers/media/summary-media.controller";
import { verifySession } from "../middlewares/verify-session";

export async function mediaRoutes(app: FastifyInstance) {
  app.post("/", { onRequest: [verifySession] }, createMedia);
  app.get("/", { onRequest: [verifySession] }, fetchMedias);
  app.get("/:mediaId", { onRequest: [verifySession] }, getMedia);
  app.delete("/:mediaId", { onRequest: [verifySession] }, deleteMedia);
  app.post("/:mediaId/summary", { onRequest: [verifySession] }, summaryMedia);
  app.post("/:mediaId/retry-transcription", { onRequest: [verifySession] }, retryTranscription);
}
