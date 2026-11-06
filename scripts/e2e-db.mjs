#!/usr/bin/env node
/**
 * Sobe (start) ou derruba (stop) o Postgres descartável usado pelos testes e2e.
 * A e2e não possui fallback para o banco de desenvolvimento.
 *
 *   node scripts/e2e-db.mjs start [backend]
 *   node scripts/e2e-db.mjs stop [backend]
 */
import { spawnSync } from 'node:child_process';
import net from 'node:net';

const command = process.argv[2] ?? 'start';
const target = process.argv[3] ?? 'backend';

if (!['start', 'stop'].includes(command)) {
  console.error(`Comando inválido: "${command}". Use start ou stop.`);
  process.exit(1);
}

if (target !== 'backend') {
  console.error(`Alvo inválido: "${target}". Apenas "backend" é suportado.`);
  process.exit(1);
}

const composeArgs = ['compose', '-f', 'docker-compose.e2e.yml'];

function run(args) {
  const result = spawnSync('docker', args, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  if (result.error) {
    throw new Error(
      `Não foi possível executar o docker (${result.error.message}). ` +
        'Instale o Docker ou use E2E_DATABASE_URL apontando para um Postgres local descartável.',
    );
  }

  if (result.status !== 0) {
    throw new Error(`"docker ${args.join(' ')}" falhou com código ${result.status}.`);
  }
}

function waitForPort(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;

    const attempt = () => {
      const socket = net.connect(port, host);

      socket.once('connect', () => {
        socket.end();
        resolve();
      });

      socket.once('error', () => {
        socket.destroy();

        if (Date.now() > deadline) {
          reject(new Error(`Postgres e2e não ficou acessível em ${host}:${port} dentro de ${timeoutMs}ms.`));
          return;
        }

        setTimeout(attempt, 500);
      });
    };

    attempt();
  });
}

if (command === 'start') {
  run([...composeArgs, 'up', '-d', 'postgres-e2e']);
  await waitForPort('127.0.0.1', 5433, 120_000);
  console.log('[e2e-db] Postgres e2e pronto em 127.0.0.1:5433');
} else {
  run([...composeArgs, 'down', '-v', 'postgres-e2e']);
  console.log('[e2e-db] Postgres e2e removido');
}
