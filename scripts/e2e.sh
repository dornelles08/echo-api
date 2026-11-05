#!/usr/bin/env bash
#
# End-to-end smoke test: register -> login -> upload -> create media ->
# transcription -> summary -> assert persisted result.
#
# Requires: curl, python3 and a running stack (api + worker + postgres +
# redis + minio). The simplest way to get one is:
#
#   docker compose --profile full up -d --build
#   ./scripts/e2e.sh
#
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3333}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-120}"
POLL_INTERVAL="${POLL_INTERVAL:-2}"

EMAIL="e2e-$(date +%s)@echo.local"
PASSWORD="secret123"
NAME="E2E User"

WORK_DIR="$(mktemp -d)"
AUDIO_FILE="$WORK_DIR/e2e.wav"
trap 'rm -rf "$WORK_DIR"' EXIT

json_get() {
	python3 -c '
import json, sys

data = json.load(sys.stdin)

for key in sys.argv[1].split("."):
    if key:
        data = data[int(key)] if isinstance(data, list) else data[key]

print(data)
' "$1"
}

request() {
	curl -sS --fail-with-body "$@"
}

wait_for_status() {
	local media_id="$1"
	local body status target

	for _ in $(seq 1 $((TIMEOUT_SECONDS / POLL_INTERVAL))); do
		body="$(request "$BASE_URL/medias/$media_id" -H "Authorization: Bearer $TOKEN")"
		status="$(printf '%s' "$body" | json_get status)"
		printf '  status: %s\n' "$status" >&2

		for target in "${@:2}"; do
			if [ "$status" = "$target" ]; then
				printf '%s' "$body"
				return 0
			fi
		done

		case "$status" in
		failed_*)
			printf '%s' "$body"
			return 1
			;;
		esac

		sleep "$POLL_INTERVAL"
	done

	printf '%s' "$body"
	return 1
}

printf '==> Waiting for %s/health\n' "$BASE_URL"
for _ in $(seq 1 30); do
	if curl -sS --fail "$BASE_URL/health" >/dev/null 2>&1; then
		break
	fi
	sleep 2
done

printf '==> Registering %s\n' "$EMAIL"
request -X POST "$BASE_URL/users" \
	-H "Content-Type: application/json" \
	-d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" >/dev/null

printf '==> Authenticating\n'
TOKEN="$(request -X POST "$BASE_URL/authenticate" \
	-H "Content-Type: application/json" \
	-d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | json_get token)"

printf '==> Generating a 1s WAV fixture\n'
python3 - "$AUDIO_FILE" <<'PY'
import struct
import sys
import wave

path = sys.argv[1]

with wave.open(path, "w") as audio:
    audio.setnchannels(1)
    audio.setsampwidth(2)
    audio.setframerate(8000)
    audio.writeframes(b"".join(struct.pack("<h", 0) for _ in range(8000)))
PY

printf '==> Uploading file\n'
UPLOAD="$(request -X POST "$BASE_URL/files/upload" \
	-H "Authorization: Bearer $TOKEN" \
	-F "file=@$AUDIO_FILE;type=audio/wav")"

FILE_URL="$(printf '%s' "$UPLOAD" | json_get url)"
FILE_KEY="$(printf '%s' "$UPLOAD" | json_get key)"
FILE_NAME="$(printf '%s' "$UPLOAD" | json_get filename)"
FILE_DURATION="$(printf '%s' "$UPLOAD" | json_get duration)"

printf '  key: %s\n  duration: %ss\n' "$FILE_KEY" "$FILE_DURATION"

printf '==> Creating media\n'
CREATE_BODY="$(
	URL="$FILE_URL" KEY="$FILE_KEY" NAME="$FILE_NAME" DURATION="$FILE_DURATION" \
		python3 -c '
import json, os

print(json.dumps({
    "filename": os.environ["NAME"],
    "url": os.environ["URL"],
    "storageKey": os.environ["KEY"],
    "type": "audio",
    "language": "pt-BR",
    "duration": float(os.environ["DURATION"]),
}))
'
)"

MEDIA_ID="$(request -X POST "$BASE_URL/medias" \
	-H "Authorization: Bearer $TOKEN" \
	-H "Content-Type: application/json" \
	-d "$CREATE_BODY" | json_get mediaId)"

printf '  mediaId: %s\n' "$MEDIA_ID"

printf '==> Waiting for transcription\n'
TRANSCRIBED="$(wait_for_status "$MEDIA_ID" transcribed pending_summary summarized)"
TRANSCRIPTION="$(printf '%s' "$TRANSCRIBED" | json_get transcription)"

if [ -z "$TRANSCRIPTION" ]; then
	printf 'Transcription is empty\n' >&2
	exit 1
fi

printf '==> Requesting summary\n'
request -X POST "$BASE_URL/medias/$MEDIA_ID/summary" \
	-H "Authorization: Bearer $TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"prompt":"Resuma o conteúdo em tópicos objetivos.","instructions":"Use no máximo 5 tópicos."}' >/dev/null

printf '==> Waiting for summary\n'
SUMMARY_BODY="$(wait_for_status "$MEDIA_ID" summarized)"

printf '\n==> Result\n'
printf '%s' "$SUMMARY_BODY" | python3 -c '
import json, sys

media = json.load(sys.stdin)

print("mediaId: " + media["id"])
print("status: " + media["status"])
print("language: " + media["language"])
print("segments: " + str(len(media["segments"])))
print("summaryAttempts: " + str(media["summaryAttempts"]))
print("summaryPrompt: " + media.get("summaryPrompt", ""))
print("\ntranscription:\n" + media["transcription"])
print("\nsummary:\n" + media["summary"][-1])
'
