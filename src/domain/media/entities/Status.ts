export type Status =
  | "pending_transcription"
  | "processing_transcription"
  | "failed_transcription"
  | "transcribed"
  | "pending_summary"
  | "processing_summary"
  | "failed_summary"
  | "summarized";
