# echo-api

API HTTP do Echo — upload de mídia, transcrição assíncrona e geração de resumos.

## Stack

- Node.js 24 + TypeScript
- Fastify 5
- PostgreSQL + Drizzle ORM
- Redis + BullMQ (apenas publicação de jobs)
- MinIO / S3 para armazenamento
- Zod para validação de payloads
- Biome (lint/format), tsup (build), Vitest (testes)

## Responsabilidades

Este repositório é o **dono do schema do PostgreSQL**. O worker (`echo-worker`) apenas lê e
escreve nas tabelas existentes; ele nunca roda migrations.

Responsabilidades da API:

- autenticação (JWT + refresh token em cookie)
- cadastro de usuários e atribuição do plano `Free`
- upload de arquivos para o storage
- criação de mídias e publicação na fila de transcrição
- listagem/detalhe de mídias, tags, planos e templates de resumo
- publicação de jobs de resumo
- expurgo (cron) de arquivos no storage cuja retenção do plano expirou
- migrations e seeds do banco

## Estrutura

```
src/
  contracts/        # schemas e tipos HTTP (zod)
  domain/           # regras de negócio (entities, use-cases, repositories)
  infra/
    database/drizzle/   # schema, client, mappers, repositories, migrations e seeds
    http/               # controllers, routes, middlewares, presenters
    factories/          # composição dos use-cases
    service/            # storage, criptografia, fila
    jobs/               # jobs agendados (node-cron) executados no processo da API
    env/                # validação das variáveis de ambiente
  app.ts            # factory do Fastify
  server.ts         # bootstrap
drizzle/            # migrations SQL geradas pelo drizzle-kit
```

## Setup

Requisitos: Node.js 24+, pnpm, e (opcional) Docker para Postgres/Redis/MinIO.

```bash
pnpm install
cp .env.example .env
```

Subir a infraestrutura local:

```bash
docker compose up -d postgres redis minio createbuckets
```

Aplicar migrations e seeds:

```bash
pnpm db:migrate
pnpm db:seed
```

Rodar em desenvolvimento:

```bash
pnpm dev          # tsx watch + pino-pretty
pnpm build        # gera dist/server.js
pnpm start        # executa o build
```

### Stack completo com Docker

O `docker-compose.yml` também sobe a API e aplica migrations/seeds automaticamente:

```bash
docker compose up -d --build
```

Para subir também o worker (`echo-worker`) e o frontend (`echo-web`), clone os três
repositórios como diretórios irmãos e use o profile `full`:

```bash
docker compose --profile full up -d --build
```

O compose espera `../echo-worker` e `../echo-web`; use `ECHO_WORKER_PATH` e
`ECHO_WEB_PATH` para apontar para outros caminhos. Nesse profile o worker roda com
`WHISPER_MODE=fake` e `SUMMARY_MODE=fake`, o que permite testar o fluxo completo
sem baixar modelos nem usar a OpenAI.

Serviços expostos:

| Serviço | URL |
| --- | --- |
| API | http://localhost:3333 |
| Web | http://localhost:3000 |
| MinIO API | http://localhost:9000 |
| MinIO Console | http://localhost:9001 (`minioadmin` / `minioadmin`) |
| PostgreSQL | `postgres://echo:echo@localhost:5432/echo` |
| Redis | `localhost:6379` |

### Smoke test end-to-end

Com o stack completo no ar, rode:

```bash
./scripts/e2e.sh
```

O script cria um usuário, faz upload de um WAV de 1s, cria a mídia, espera a
transcrição, solicita o resumo e valida o resultado persistido. Requer `curl` e
`python3`; use `BASE_URL` para apontar para outra API.

## Git hooks (husky)

`pnpm install` configura o husky automaticamente (script `prepare`). Os hooks versionados ficam em `.husky/`:

| Hook | Quando | Roda |
| --- | --- | --- |
| `pre-commit` | antes do commit | `pnpm lint` + `pnpm typecheck` |
| `pre-push` | antes do push | `pnpm test` |

Para pular os hooks pontualmente (não recomendado): `git commit --no-verify` / `git push --no-verify`.

## Scripts

| Script | Descrição |
| --- | --- |
| `pnpm dev` | servidor em watch mode |
| `pnpm build` | bundle ESM em `dist/` |
| `pnpm start` | executa `dist/server.js` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | testes com Vitest |
| `pnpm lint` | Biome check |
| `pnpm lint:fix` | Biome check + fix |
| `pnpm db:generate` | gera migration a partir do schema |
| `pnpm db:migrate` | aplica migrations |
| `pnpm db:push` | sincroniza schema sem migration (apenas dev) |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm db:seed` | popula planos e templates de resumo |

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `NODE_ENV` | `dev`, `test` ou `production` |
| `PORT` | porta HTTP (default `3333`) |
| `CLIENT_ORIGIN` | origens permitidas no CORS (separadas por vírgula, com suporte a `*`, ex.: `http://localhost:*`) |
| `DATABASE_URL` | connection string do PostgreSQL |
| `DATABASE_POOL_SIZE` | tamanho do pool (default `10`) |
| `REDIS_HOST` / `REDIS_PORT` | conexão do BullMQ |
| `JWT_SECRET` | segredo dos tokens |
| `JWT_EXPIRES_IN` | validade do access token (default `1h`) |
| `JWT_REFRESH_EXPIRES_IN` | validade do refresh token (default `7d`) |
| `STORAGE_TYPE` | `local` ou `s3` |
| `UPLOAD_DIR` | diretório usado quando `STORAGE_TYPE=local` |
| `MINIO_*` | endpoint, credenciais, bucket, SSL e região do storage |
| `SENTRY_DSN` | opcional; Sentry desabilitado quando vazio |
| `CLEANUP_EXPIRED_FILES_CRON` | padrão cron do job de expurgo de arquivos expirados (default `0 3 * * *`; use `disabled` para desligar) |

## Jobs agendados

### Expurgo de arquivos expirados (MinIO/S3)

O processo da API registra um cron (via `node-cron`, padrão `0 3 * * *`, configurável em
`CLEANUP_EXPIRED_FILES_CRON`; use `disabled` para desligar) que remove do storage os arquivos
de mídias cuja retenção, definida pelo plano do dono da mídia, já venceu.

Regras:

- A retenção é contada a partir do `created_at` da mídia.
- Áudios usam `plans.audio_retention_days`; vídeos usam `plans.video_retention_days`.
- Retenção `0` significa "nunca expira" e o arquivo é ignorado pelo job.
- Apenas o objeto no storage é apagado. O registro em `medias` é mantido
  (transcrição, resumo, segmentos etc.); `storage_key` é limpo e `url` é esvaziada.
  Mídias sem `storage_key` não são reprocessadas.
- Falhas individuais não interrompem o lote: o job loga os erros e tenta de novo na próxima execução.

## Endpoints

Autenticação:

- `POST /users` — cria usuário e atribui o plano `Free`
- `POST /authenticate` — retorna `{ token }` e seta o cookie `refreshToken`
- `POST /refresh-token` — renova o access token usando o cookie
- `GET /me` — perfil + plano + minutos usados no ciclo

Arquivos e mídias:

- `POST /files/upload` — multipart; retorna `{ url, key, filename, duration }`
- `POST /medias` — cria a mídia e publica na fila de transcrição
- `GET /medias` — lista com filtros (`type`, `status`, `language`, `tags`) e paginação
- `GET /medias/:mediaId` — detalhe (404 quando não encontrada)
- `POST /medias/:mediaId/summary` — publica job de resumo (`prompt` + `instructions` opcional)
- `GET /tags` — tags do usuário
- `GET /plans` — planos ativos
- `GET /summary-templates` — templates de resumo

`POST /files/upload` **não** cria mídia. O fluxo esperado é:

1. `POST /files/upload` → `{ url, key, filename, duration }`
2. `POST /medias` com `url`, `storageKey` (o `key`), `filename`, `duration`, `type`, `language`

## Schema do banco

Tabelas: `plans`, `users`, `usage_counters`, `summary_templates`, `medias`.

- IDs são `uuid`
- `medias.segments` é `jsonb`
- `medias.summary` e `medias.tags` são `text[]` (índice GIN em `tags`)
- `usage_counters` é a fonte de verdade dos minutos consumidos no ciclo
- `medias.usage_debited_at` garante idempotência do débito de minutos pelo worker

Fluxo de alteração de schema:

```bash
# edite src/infra/database/drizzle/schema.ts
pnpm db:generate   # cria drizzle/000N_*.sql
pnpm db:migrate    # aplica
```

## Contrato com o worker

A API publica em duas filas BullMQ:

`media_transcription_queue`

```json
{
  "mediaId": "uuid",
  "url": "https://...",
  "storageKey": "uuid-filename.ext"
}
```

`media_summary_queue`

```json
{
  "mediaId": "uuid",
  "prompt": "prompt final já composto"
}
```

O prompt enviado na fila de resumo já é o texto final (template base + instruções do usuário) e
também fica salvo em `medias.summaryPrompt`.

## Estrutura de resposta de erro

Erros de domínio são mapeados para HTTP nos controllers:

- `EntityNotFoundError` → `404`
- `VideoNotAllowedError` → `403`
- `PlanLimitExceededError` → `402`
- `InvalidStatusError` → `400`
- `SummaryAttemptsExceededError` → `409`
- e-mail duplicado no cadastro → `409`
- credenciais inválidas → `401`
