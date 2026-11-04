import type { FastifyReply, FastifyRequest } from "fastify";

export async function verifyJwt(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({ message: "Unauthorized - No token provided" });
    }

    await request.jwtVerify();
  } catch (_) {
    return reply.status(401).send({ message: "Unauthorized" });
  }
}
