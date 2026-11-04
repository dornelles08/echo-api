import type { FastifyReply, FastifyRequest } from "fastify";

export async function verifyCookieJwt(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify({ onlyCookie: true });
  } catch (_) {
    return reply.status(401).send({ message: "Unauthorized" });
  }
}
