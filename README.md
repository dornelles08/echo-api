# echo-api

API HTTP do Echo — upload de mídia, transcrição assíncrona e geração de resumos.

## Stack

- Node.js 22 + TypeScript
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
    env/                # validação das variáveis de ambiente
  app.ts            # factory do Fastify
  server.ts         # bootstrap
drizzle/            # migrations SQL geradas pelo drizzle-kit
```

## Setup

Requisitos: Node.js 22+, pnpm, e (opcional) Docker para Postgres/Redis/MinIO.

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
| `CLIENT_ORIGIN` | origens permitidas no CORS (separadas por vírgula) |
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
