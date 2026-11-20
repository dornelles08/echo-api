import type { FastifyReply, FastifyRequest } from "fastify";

import { getPaymentParamsSchema } from "../../../../contracts";
import { makeGetPaymentUseCase } from "../../../factories/billing/get-payment.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";
import { PaymentPresenter } from "../../presenters/billing/payment.presenter";

export async function getPayment(request: FastifyRequest, reply: FastifyReply) {
  const { sub: userId } = request.user;

  const { paymentId } = getPaymentParamsSchema.parse(request.params);

  const result = await makeGetPaymentUseCase().execute({
    paymentId,
    userId,
  });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  return reply.status(200).send(PaymentPresenter.toHTTP(result.value));
}
