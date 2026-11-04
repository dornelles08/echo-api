import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../../env";
import * as schema from "./schema";

export const pgClient = postgres(env.DATABASE_URL, {
  max: env.DATABASE_POOL_SIZE,
  onnotice: () => {},
});

export const db = drizzle(pgClient, { schema });

export type Database = typeof db;
export * from "./schema";
