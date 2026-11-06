/**
 * Builds a raw multipart/form-data body for `app.inject`, avoiding extra
 * dependencies. Only supports a single `file` part, which is all the API
 * needs.
 */
export function multipartFilePayload({
  filename,
  contentType,
  data,
}: {
  filename: string;
  contentType: string;
  data: Buffer;
}) {
  const boundary = "----echo-e2e-boundary-7MA4YWxkTrZu0gW";

  const head = Buffer.from(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`,
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);

  return {
    payload: Buffer.concat([head, data, tail]),
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
    },
  };
}

/** Generates a 16-bit mono PCM WAV buffer with silence of `seconds` length. */
export function makeWavBuffer(seconds: number): Buffer {
  const sampleRate = 8000;
  const dataSize = Math.floor(seconds * sampleRate) * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}
