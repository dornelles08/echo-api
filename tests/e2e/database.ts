import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

/**
 * Infra dos testes e2e de backend.
 *
 * Regra de ouro: os testes rodam contra um Postgres local ou de rede privada
 * e descartável (Docker, ver `docker-compose.e2e.yml`, ou homelab). Não existe
 * fallback para `DATABASE_URL` de desenvolvimento/produção (Neon etc.), e
 * hosts públicos são rejeitados.
 */

export const E2E_SCHEMA_PREFIX = "e2e_";

const DEFAULT_E2E_DATABASE_URL = "postgresql://echo:echo@127.0.0.1:5433/echo_e2e";

const MIGRATIONS_FOLDER = join(process.cwd(), "drizzle");

const DATABASE_SCRIPT = join(process.cwd(), "scripts", "e2e-db.mjs");

/**
 * Hosts aceitos para o Postgres de teste:
 * - loopback (localhost, 127.0.0.1, ::1)
 * - IPs privados RFC1918 (10/8, 172.16/12, 192.168/16) e IPv6 ULA/link-local
 * - mDNS (`.local`), comum em homelabs
 *
 * Hosts públicos (Neon, RDS, qualquer endpoint da internet) são rejeitados:
 * os testes criam e apagam schemas `e2e_*` em DROP CASCADE.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function isPrivateIPv4(host: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);

  if (!match) {
    return false;
  }

  const a = Number(match[1]);
  const b = Number(match[2]);

  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  if (LOCAL_HOSTS.has(host)) {
    return true;
  }

  if (isPrivateIPv4(host)) {
    return true;
  }

  // IPv6 loopback, ULA (fc00::/7) e link-local (fe80::/10).
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) {
    return true;
  }

  // mDNS (ex.: `homelab.local`) — resolvido na rede local.
  if (host.endsWith(".local")) {
    return true;
  }

  return false;
}

export type E2ETarget = "backend";

export function e2eDatabaseUrl(): string {
  const url = new URL(process.env.E2E_DATABASE_URL ?? DEFAULT_E2E_DATABASE_URL);

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error(
      `E2E_DATABASE_URL inválida: use uma URL postgresql:// (recebido ${url.protocol}).`,
    );
  }

  if (!isAllowedHost(url.hostname)) {
    throw new Error(
      `Os testes e2e só rodam contra Postgres local ou de rede privada (RFC1918/.local); "${url.hostname}" não é permitido. ` +
        "Aponte E2E_DATABASE_URL para o banco descartável do docker-compose.e2e.yml (127.0.0.1) ou para um Postgres descartável do seu homelab.",
    );
  }

  return url.toString();
}

export async function canConnect(url: string, timeoutMs = 1_000) {
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: timeoutMs,
    max: 1,
  });

  try {
    await pool.query("select 1");
    return true;
  } catch {
    return false;
  } finally {
    await pool.end().catch(() => {});
  }
}

function runDatabaseScript(command: string, target: E2ETarget) {
  const result = spawnSync(process.execPath, [DATABASE_SCRIPT, command, target], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(
      `Falha ao executar "e2e-db.mjs ${command} ${target}". ` +
        "Os testes e2e não possuem fallback para o banco de desenvolvimento.",
    );
  }
}

export async function ensureE2EDatabase(target: E2ETarget = "backend") {
  const url = e2eDatabaseUrl();

  if (await canConnect(url)) {
    return;
  }

  runDatabaseScript("start", target);

  if (!(await canConnect(url, 5_000))) {
    throw new Error(
      `Postgres e2e inacessível em ${url}. Rode "node scripts/e2e-db.mjs start ${target}".`,
    );
  }
}

export function stopE2EDatabase(target: E2ETarget = "backend") {
  runDatabaseScript("stop", target);
}

function migrationTags(): string[] {
  const journalPath = join(MIGRATIONS_FOLDER, "meta", "_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
    entries: { tag: string }[];
  };
  return journal.entries.map((entry) => entry.tag);
}

async function applyMigrations(pool: Pool) {
  for (const tag of migrationTags()) {
    const statements = readFileSync(join(MIGRATIONS_FOLDER, `${tag}.sql`), "utf8")
      .replace(/"public"\./g, "")
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    for (const statement of statements) {
      await pool.query(statement);
    }
  }
}

function withSearchPath(baseUrl: string, schema: string) {
  const url = new URL(baseUrl);
  url.searchParams.set("options", `-csearch_path=${schema}`);
  return url.toString();
}

async function dropSchema(baseUrl: string, schema: string) {
  const pool = new Pool({ connectionString: baseUrl, max: 1 });

  try {
    await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } finally {
    await pool.end();
  }
}

/**
 * Cria um schema exclusivo para o arquivo de teste, aplica as migrations e
 * aponta `DATABASE_URL` para ele. Lança erro se o `search_path` não for
 * aplicado (ex.: pooler que ignora `options`), evitando escrever em `public`.
 */
export async function createE2ESchema(baseUrl: string = e2eDatabaseUrl()): Promise<string> {
  const schema = `${E2E_SCHEMA_PREFIX}${Date.now()}_${randomUUID()}`;

  const adminPool = new Pool({ connectionString: baseUrl, max: 1 });

  try {
    await adminPool.query(`CREATE SCHEMA "${schema}"`);
  } finally {
    await adminPool.end();
  }

  const schemaUrl = withSearchPath(baseUrl, schema);
  const migrationPool = new Pool({ connectionString: schemaUrl, max: 1 });

  try {
    const result = await migrationPool.query<{ schema: string | null }>(
      "select current_schema() as schema",
    );

    if (result.rows[0]?.schema !== schema) {
      throw new Error(
        `O banco ignorou o search_path (esperado "${schema}", atual "${result.rows[0]?.schema}"). ` +
          "Os testes e2e exigem um Postgres local que aplique o parâmetro options.",
      );
    }

    await applyMigrations(migrationPool);
  } catch (error) {
    await dropSchema(baseUrl, schema);
    throw error;
  } finally {
    await migrationPool.end();
  }

  process.env.DATABASE_URL = schemaUrl;

  return schema;
}

export async function dropE2ESchema(schema: string, baseUrl: string = e2eDatabaseUrl()) {
  await dropSchema(baseUrl, schema);
}

/**
 * Remove schemas deixados por execuções interrompidas. O nome carrega o
 * timestamp de criação para não apagar um schema de uma execução em curso.
 */
export async function cleanupStaleSchemas(
  baseUrl: string = e2eDatabaseUrl(),
  olderThanMs = 2 * 60 * 60 * 1_000,
) {
  const pool = new Pool({ connectionString: baseUrl, max: 1 });

  try {
    const result = await pool.query<{ schema_name: string }>(
      "select schema_name from information_schema.schemata where starts_with(schema_name, $1)",
      [E2E_SCHEMA_PREFIX],
    );

    for (const { schema_name } of result.rows) {
      const timestamp = Number(schema_name.slice(E2E_SCHEMA_PREFIX.length).split("_")[0]);

      if (Number.isFinite(timestamp) && Date.now() - timestamp < olderThanMs) {
        continue;
      }

      await pool.query(`DROP SCHEMA IF EXISTS "${schema_name}" CASCADE`);
      console.log(`[e2e] schema órfão removido: ${schema_name}`);
    }
  } finally {
    await pool.end();
  }
}

export async function dropAllE2ESchemas(baseUrl: string = e2eDatabaseUrl()) {
  await cleanupStaleSchemas(baseUrl, 0);
}
