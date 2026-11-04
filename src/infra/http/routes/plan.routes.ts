import type { FastifyInstance } from "fastify";

import { fetchPlans } from "../controllers/plan/fetch-plans.controller";

export async function planRoutes(app: FastifyInstance) {
  app.get("/", fetchPlans);
}
