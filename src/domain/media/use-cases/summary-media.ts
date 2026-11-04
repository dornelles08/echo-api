import { type Either, left, right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import { SummaryAttemptsExceededError } from "../../errors/summary-attempts-exceeded.error";
import type { UserRepository } from "../../user/repositories/user.repository";
import type { Media } from "../entities/Media";
import type { MediaRepository } from "../repositories/media.repository";
import type { QueueService } from "../services/queue.service";
import { InvalidStatusError } from "./errors/invalid-status.error";

interface SummaryMediaUseCaseRequest {
  mediaId: string;
  userId: string;
  /** Full base prompt (already resolved from a template or written by the user). */
  prompt: string;
  instructions?: string;
}

type SummaryMediaUseCaseResponse = Either<
  EntityNotFoundError | InvalidStatusError | SummaryAttemptsExceededError,
  { media: Media }
>;

export function buildSummaryPrompt(prompt: string, instructions?: string): string {
  const base = prompt.trim();
  const extra = instructions?.trim();

  return extra ? `${base}\n\nInstruções adicionais do usuário: ${extra}` : base;
}

export class SummaryMediaUseCase {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly userRepository: UserRepository,
    private readonly queueService: QueueService,
  ) {}

  async execute({
    mediaId,
    userId,
    prompt,
    instructions,
  }: SummaryMediaUseCaseRequest): Promise<SummaryMediaUseCaseResponse> {
    const media = await this.mediaRepository.findById(mediaId, userId);

    if (!media) {
      return left(new EntityNotFoundError("Media"));
    }

    if (!media.transcription) {
      return left(new InvalidStatusError(media.status, "summary"));
    }

    const userWithPlan = await this.userRepository.findDetailsById(userId);

    if (!userWithPlan) {
      return left(new EntityNotFoundError("User"));
    }

    const maxAttempts = userWithPlan.plan.maxSummaryAttemptsPerMedia;

    if (media.summaryAttempts >= maxAttempts) {
      return left(
        new SummaryAttemptsExceededError(
          `Limite de ${maxAttempts} tentativas de resumo atingido para esta mídia. Você já usou ${media.summaryAttempts} tentativas.`,
        ),
      );
    }

    const finalPrompt = buildSummaryPrompt(prompt, instructions);

    media.summaryPrompt = finalPrompt;
    media.status = "pending_summary";
    media.incrementSummaryAttempts();

    await this.mediaRepository.save(media);

    await this.queueService.publish("media_summary_queue", {
      mediaId: media.id,
      prompt: finalPrompt,
    });

    return right({ media });
  }
}
