import type { FastifyInstance } from "fastify";

import { uploadFile } from "../controllers/file/upload-file.controller";
import { verifyJwt } from "../middlewares/verify-jwt";

export async function fileRoutes(app: FastifyInstance) {
  app.post("/upload", { onRequest: [verifyJwt] }, uploadFile);
}
