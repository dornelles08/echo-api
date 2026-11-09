import { fromNodeHeaders } from "better-auth/node";
import type { FastifyReply, FastifyRequest } from "fastify";

import { auth } from "../../auth/better-auth";

export async function verifySession(request: FastifyRequest, reply: FastifyReply) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      return reply
        .status(401)
        .send({ statusCode: 401, error: "UNAUTHORIZED", message: "Unauthorized" });
    }

    request.user = session.user as unknown as { sub: string; [key: string]: unknown };
    (request.user as { sub: string }).sub = session.user.id;
  } catch (_) {
    return reply
      .status(401)
      .send({ statusCode: 401, error: "UNAUTHORIZED", message: "Unauthorized" });
  }
}
