import type { FastifyInstance } from "fastify";

import { fetchSummaryTemplates } from "../controllers/summary-template/fetch-summary-templates.controller";
import { verifySession } from "../middlewares/verify-session";

export async function summaryTemplateRoutes(app: FastifyInstance) {
  app.get("/summary-templates", { onRequest: [verifySession] }, fetchSummaryTemplates);
}
