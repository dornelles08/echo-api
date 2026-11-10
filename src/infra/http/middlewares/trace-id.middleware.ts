import type { FastifyPluginAsync } from "fastify";

const TRACE_ID_HEADER = "x-trace-id";

/**
 * Middleware de correlação de requisições.
 *
 * Se o cliente enviar o header `X-Trace-ID`, ele é usado como ID de correlação.
 * Caso contrário, o Fastify gera um `request.id` automaticamente.
 *
 * O ID é exposto no header de resposta `X-Trace-ID` para que o front e o
 * worker possam rastrear a mesma transação ponta a ponta.
 */
const traceIdMiddleware: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (request, reply) => {
    const incoming = request.headers[TRACE_ID_HEADER] as string | undefined;
    const traceId = incoming || request.id;

    // Garante que o log do Fastify use o mesmo traceId
    request.log.child = () => request.log.child({ traceId });

    // Expõe no header de resposta para rastreamento ponta a ponta
    reply.header(TRACE_ID_HEADER, traceId);
  });
};

export default traceIdMiddleware;
