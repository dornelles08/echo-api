# echo-api — Guia para agentes

API HTTP do Echo: upload de mídia, transcrição assíncrona e geração de resumos.
Node 24 + TypeScript, Fastify 5, PostgreSQL + Drizzle, Redis + BullMQ (só publicação),
MinIO/S3, Zod, Biome, tsup, Vitest.

**Dono do schema PostgreSQL.** Migrations e seeds vivem aqui; worker/web só leem/escrevem.

## Arquitetura (Clean / DDD por camadas)

```
src/
  contracts/        # schemas Zod + tipos HTTP (fonte de verdade do contrato)
  domain/           # regras de negócio puras (entities, use-cases, repos interfaces, services interfaces)
  infra/
    database/drizzle/   # schema, client, mappers, repos concretos, migrations (drizzle/), seeds
    http/               # controllers, routes, middlewares, presenters, error-handler
    factories/          # composição dos use-cases (new DomainUseCase(new DrizzleRepo, ...))
    service/            # storage, bcrypt, fila Redis, queue
    jobs/               # jobs agendados (node-cron) no processo da API
    env/                # validação Zod das env vars
    auth/               # BetterAuth config
    libs/               # sentry, health
  app.ts            # factory do Fastify (plugins + rotas)
  server.ts         # bootstrap + cron
```

Dependências apontam para dentro: `domain` não importa `infra`. `infra` implementa interfaces
do `domain`. `contracts` é compartilhado por controllers e presenters.

### Padrões obrigatórios

- **Use-case retorna `Either<L, R>`** (`src/domain/either.ts`). Erros de domínio são classes
  `AppError` (ou subclasses em `src/domain/.../errors` e `src/domain/errors`). Sucesso é `right`.
  Controllers fazem:
  ```ts
  const result = await makeXUseCase().execute(input);
  if (result.isLeft()) return handleUseCaseError(result.value, request, reply);
  return reply.status(...).send(...);
  ```
- **Validação de entrada com Zod** no controller via `schema.parse(request.body/params/query)`.
  Schemas vivem em `src/contracts` e são reexportados pelo barrel `contracts`.
- **Composição via factories** em `src/infra/factories/<modulo>/<use-case>.factory.ts`:
  `new UseCase(new DrizzleRepo(), new RedisQueueService(), ...)`. Controllers chamam
  `makeXUseCase()`, nunca instanciam repos direto.
- **Repository pattern**: interface em `domain/<modulo>/repositories/*.repository.ts`; implementação
  Drizzle em `infra/database/drizzle/repositories/drizzle-*.repository.ts`; in-memory em
  `domain/test/repositories/in-memory-*.repository.ts` (para testes unitários).
- **Mappers** `infra/database/drizzle/mappers/*.mapper.ts` convertem row ↔ entity (Drizzle rows
  não vazam para o domínio).
- **Presenters** `infra/http/presenters/*.presenter.ts` convertem entidade de domínio → DTO HTTP.
- **Erros**: `AppError(message, statusCode, code, isOperational)`. Códigos estáveis são consumidos
  pelo web (`API_ERROR_MESSAGES`). Adicionar código novo exige entrada em `echo-web/src/lib/api-error.ts`.
- **Auth**: BetterAuth (email/senha, bearer plugin, drizzle adapter). `verifySession` middleware
  popula `request.user` com `sub = session.user.id`. Rotas protegidas usam
  `onRequest: [verifySession]`. Logout revoga refresh token (`verifyNotRevoked`).
- **Env**: validada com Zod em `infra/env/index.ts`; importe `env` de lá, nunca `process.env` direto
  (exceto `NODE_ENV` em error-handler).

### Convenções de código

- TypeScript strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`). Imports de tipo com `type`.
- Biome: 2 espaços, aspas duplas, ponto-e-vírgula, lineWidth 100. Imports organizados pelo assist.
- ESM (`"type": "module"`). Node ≥ 24.
- Arquivos: kebab-case para arquivos (`create-media.controller.ts`), PascalCase para classes/entidades.
- Testes unitários ao lado do código: `*.spec.ts` em `src/`. E2e em `tests/e2e/*.e2e.spec.ts`.
- Funções de erro de domínio em `use-cases/errors/`.

### Status de mídia (fluxo)

`pending_transcription → processing_transcription → (failed_transcription | transcribed) →
pending_summary → processing_summary → (failed_summary | summarized)`.

Transições são feitas pelo worker (transcrição/resumo) e pela API (ao solicitar resumo).

### Minutos de uso (cota)

- Upload (`UploadFileUseCase`) mede duração com ffprobe, checa `remainingMinutes`, salva arquivo e
  **debita** via `usageCounterRepository.increment`.
- Worker (`debit_usage`) é idempotente: verifica `usageDebitedAt` da mídia; se já debitado, retorna
  `None`. API marca `usageDebitedAt` no create-media para evitar dupla contagem.
- Delete de mídia **não** devolve minutos (anti-abuso).

### Storage

- Interface `StorageService` (`domain/file/services/storage.service.ts`).
- Impl: `S3StorageService` (MinIO/S3) e `LocalStorageService`.
- Seleção por `STORAGE_TYPE` (local/s3). Upload aceita Buffer/Uint8Array/Readable (streaming).

### Filas (BullMQ/Redis)

- `QueueService` (`domain/media/services/queue.service.ts`) com `publish`/`remove`.
- Impl `RedisQueueService`. API **apenas publica**; worker consome.
- Filas: `media_transcription_queue`, `media_summary_queue`.

### Auth

- BetterAuth com drizzle adapter, `generateId: "uuid"`, bcrypt (10 rounds).
- Hook `user.create.before` atribui plano `Free` ao cadastrar.
- Bearer plugin habilitado. Sessão em cookie httpOnly (web usa `withCredentials`).
- `verifySession` lê sessão via `auth.api.getSession` e seta `request.user.sub`.

### Middlewares

- `verifySession` (auth), `verifyNotRevoked` (lista negra de refresh tokens).

### Erros HTTP

- `normalizeError`/`handleError` em `infra/http/error-handler.ts` produzem body estruturado
  `{ statusCode, error, message, details? }`. ZodError vira `VALIDATION_ERROR` com `details` por campo.
- Operational vs inesperado: inesperado retorna 500 genérico e stack em dev.

### Health

- `GET /health` → `checkHealth()` (status das dependências).

### Cron

- `registerCleanupExpiredFilesJob` (node-cron) expurga arquivos cuja retenção do plano expirou.
- Padrão `0 3 * * *`; `"disabled"` desliga.

### Testes

- Vitest Projects: `unit` (`src/**/*.spec.ts`) e `e2e` (`tests/e2e/**/*.e2e.spec.ts`).
- Unit: repositórios in-memory, use-cases, env, presenters.
- E2e: Postgres real descartável (porta 5433 ou `E2E_DATABASE_URL` RFC1918/.local), schema por
  arquivo (`e2e_<ts>_<uuid>`), migrations aplicadas, filas em memória
  (`tests/e2e/helpers/memory-queue.ts`), storage local em temp dir, tabelas truncadas + seeds
  re-aplicados por teste. Hosts públicos rejeitados.
- `tests/setup-env.ts` defaults mínimos de env para todos os testes.

Comandos:
```bash
pnpm test          # unit + e2e
pnpm test:unit
pnpm test:e2e      # sobe postgres sozinho se docker disponível
pnpm test:cov
pnpm e2e:db:start / stop
```

### Lint/format/build

```bash
pnpm lint / lint:fix / format
pnpm typecheck     # tsc --noEmit
pnpm build         # tsup → dist/server.js
pnpm dev           # tsx watch + pino-pretty
```

Hooks (husky): pre-commit `lint`+`typecheck`; pre-push `test`.

### Onde procurar

| Tarefa | Arquivo(s) |
| --- | --- |
| Novo endpoint | controller em `infra/http/controllers/<modulo>/`, route em `infra/http/routes/*.routes.ts`, factory em `infra/factories/<modulo>/`, schema em `contracts/<modulo>/` |
| Nova regra de negócio | `domain/<modulo>/use-cases/` + erros em `use-cases/errors/` |
| Nova entidade | `domain/<modulo>/entities/` (extends `Entity`) |
| Novo repo | interface `domain/<modulo>/repositories/`, impl `infra/database/drizzle/repositories/drizzle-*.repository.ts`, in-memory `domain/test/repositories/` |
| Mudança de schema | `infra/database/drizzle/schema.ts` → `pnpm db:generate` → migration em `drizzle/` → atualizar worker `db.py` e web types |
| Presenter/DTO | `infra/http/presenters/` |
| Middleware | `infra/http/middlewares/` |
| Job agendado | `infra/jobs/` + registro em `server.ts` |
| Env var | `infra/env/index.ts` (+ `.env.example`) |
| Auth config | `infra/auth/better-auth.ts` |
| Storage impl | `infra/service/*-storage.service.ts` |

### Não fazer

- Não importar `infra` em `domain`.
- Não rodar migrations no worker/web.
- Não criar mídia no upload (upload só armazena; criação é `POST /medias`).
- Não reverter minutos no delete.
- Não expor stack trace em produção (handleError já trata).
- Não logar body (credenciais).

### Particularidades

- `noUncheckedIndexedAccess` ativo: indexações de array são `T | undefined`.
- Fastify logger desligado em `NODE_ENV=test`.
- Multipart limit 500MB.
- Rate limit global 60 req/min/IP.
- CORS: em dev `origin: true`; em prod valida contra `CLIENT_ORIGIN` (suporta wildcard `*`).
- Compose profile `full` sobe worker/web com `WHISPER_MODE=fake` e `SUMMARY_MODE=fake`.

### Observabilidade

- **Sentry**: configurado em `infra/libs/sentry.ts`. Ativo apenas quando `SENTRY_DSN_API` está preenchido. Captura erros inesperados (5xx) e exceções não tratadas.
- **Logger estruturado**: `infra/libs/logger.ts` cria um logger Pino. Em produção com `LOKI_URL` definido, envia logs via HTTP para o Loki. Em desenvolvimento, imprime em stdout (usar `pino-pretty` via script `dev`).
- **Correlation ID**: middleware `infra/http/middlewares/trace-id.middleware.ts`. Lê o header `X-Trace-ID` da requisição (se enviado pelo front) ou usa o `request.id` do Fastify. Expõe o mesmo ID no header de resposta `X-Trace-ID` para rastreamento ponta a ponta (front → back → worker).
- **Logs de erro**: `infra/http/error-handler.ts` inclui `traceId`, `requestId`, `userId`, `method`, `url`, `params`, `query` e `stack` (apenas em erros inesperados). Nunca loga o body da requisição.
- **Env vars**: `SENTRY_DSN_API`, `LOKI_URL`, `LOG_LEVEL` (valores: fatal, error, warn, info, debug, trace).
