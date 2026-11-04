import type { FastifyInstance } from "fastify";

import { fetchSummaryTemplates } from "../controllers/summary-template/fetch-summary-templates.controller";
import { verifyJwt } from "../middlewares/verify-jwt";

export async function summaryTemplateRoutes(app: FastifyInstance) {
  app.get("/summary-templates", { onRequest: [verifyJwt] }, fetchSummaryTemplates);
}
