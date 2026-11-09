import bcrypt from "bcrypt";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "../database/drizzle";
import { plans } from "../database/drizzle/schema";
import { corsOrigins, env } from "../env";

const FREE_PLAN_NAME = "Free";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL ?? `http://localhost:${env.PORT}`,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins:
    env.NODE_ENV === "dev"
      ? (request?: Request) => [
          ...(request?.headers.get("origin") ? [request.headers.get("origin") as string] : []),
          ...corsOrigins,
        ]
      : corsOrigins,
  plugins: [bearer()],
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => bcrypt.hash(password, 10),
      verify: async ({ hash, password }: { hash: string; password: string }) =>
        bcrypt.compare(password, hash),
    },
  },
  user: {
    modelName: "user",
    additionalFields: {
      planId: {
        type: "string",
        required: false,
        input: false,
        returned: true,
      },
    },
  },
  session: {
    modelName: "session",
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  account: {
    modelName: "account",
  },
  verification: {
    modelName: "verification",
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const [plan] = await db
            .select()
            .from(plans)
            .where(eq(plans.name, FREE_PLAN_NAME))
            .limit(1);

          return {
            data: {
              ...user,
              planId: plan?.id,
            },
          };
        },
      },
    },
  },
});
