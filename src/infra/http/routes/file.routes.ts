import type { FastifyInstance } from "fastify";

import { uploadFile } from "../controllers/file/upload-file.controller";
import { verifySession } from "../middlewares/verify-session";

export async function fileRoutes(app: FastifyInstance) {
  app.post("/upload", { onRequest: [verifySession] }, uploadFile);
}
