import { Entity } from "../../entity";
import type { Segment } from "./Segment";
import type { Status } from "./Status";

export interface MediaProps {
  filename: string;
  url: string;
  storageKey?: string;
  type: "video" | "audio";
  prompt?: string;
  transcription?: string;
  language: string;
  duration: number;
  summary?: string[];
  summaryPrompt?: string;
  summaryAttempts?: number;
  transcriptionAttempts?: number;
  segments?: Segment[];
  status?: Status;
  tags?: string[];
  usageDebitedAt?: Date;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Media extends Entity<MediaProps> {
  get filename() {
    return this.props.filename;
  }

  get url() {
    return this.props.url;
  }

  get storageKey() {
    return this.props.storageKey;
  }

  get type() {
    return this.props.type;
  }

  get prompt() {
    return this.props.prompt;
  }

  get transcription() {
    return this.props.transcription;
  }

  get status() {
    return this.props.status;
  }

  get tags() {
    return this.props.tags;
  }

  get language() {
    return this.props.language;
  }

  get duration() {
    return this.props.duration;
  }

  get summary() {
    return this.props.summary;
  }

  get summaryPrompt() {
    return this.props.summaryPrompt;
  }

  get summaryAttempts() {
    return this.props.summaryAttempts ?? 0;
  }

  get transcriptionAttempts() {
    return this.props.transcriptionAttempts ?? 0;
  }

  get segments() {
    return this.props.segments;
  }

  get usageDebitedAt() {
    return this.props.usageDebitedAt;
  }

  get userId() {
    return this.props.userId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  set transcription(transcription: string | undefined) {
    this.props.transcription = transcription;
    this.touch();
  }

  set summary(summary: string[] | undefined) {
    this.props.summary = summary;
    this.touch();
  }

  set status(status: Status | undefined) {
    this.props.status = status;
    this.touch();
  }

  set summaryPrompt(summaryPrompt: string | undefined) {
    this.props.summaryPrompt = summaryPrompt;
    this.touch();
  }

  incrementSummaryAttempts() {
    this.props.summaryAttempts = (this.props.summaryAttempts ?? 0) + 1;
    this.touch();
  }

  incrementTranscriptionAttempts() {
    this.props.transcriptionAttempts = (this.props.transcriptionAttempts ?? 0) + 1;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(props: MediaProps, id?: string) {
    const media = new Media(
      {
        ...props,
        tags: props.tags ?? [],
        status: props.status ?? "pending_transcription",
        summaryAttempts: props.summaryAttempts ?? 0,
        transcriptionAttempts: props.transcriptionAttempts ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return media;
  }
}
