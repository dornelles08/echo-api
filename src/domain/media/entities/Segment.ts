export type Segment = {
  id: number;
  start: number;
  end: number;
  text: string;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
};
