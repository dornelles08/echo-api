import type { FastifyReply, FastifyRequest } from "fastify";

import { makeListPaymentsUseCase } from "../../../factories/billing/list-payments.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";
import { PaymentPresenter } from "../../presenters/billing/payment.presenter";

export async function listPayments(request: FastifyRequest, reply: FastifyReply) {
  const { sub: userId } = request.user;

  const page = request.query.page ? Number(request.query.page) : 1;
  const perPage = request.query.perPage ? Number(request.query.perPage) : 20;

  const result = await makeListPaymentsUseCase().execute({
    userId,
    page,
    perPage,
  });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  const { payments, total } = result.value;

  return reply.status(200).send({
    payments: PaymentPresenter.toHTTPList(payments),
    total,
    page,
    perPage,
  });
}
