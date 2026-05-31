import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import test from 'node:test';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sentStatus = 'נשלח';
const failedStatus = 'נכשל';
const testAdminEmail = 'admin-test@example.com';
const testAdminPassword = 'test-admin-password';
const winnerSmsText = 'ברכות! זכית בהגרלת Starlink בכנס Fortinet. נציג שלנו יצור איתך קשר.';

function testParticipant(suffix = Date.now()) {
  return {
    fullName: `Flow Tester ${suffix}`,
    company: 'SpotNet QA',
    role: 'QA',
    phone: `050-${String(suffix).slice(-3).padStart(3, '0')}-${String(suffix).slice(-4).padStart(4, '0')}`,
    email: `flow-${suffix}@example.com`,
    isBusinessCustomer: true,
    interest: 'Starlink',
    marketingConsent: true,
    source: 'integration_test',
  };
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForHealth(baseUrl, child, logs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10_000) {
    if (child.exitCode != null) {
      throw new Error(`Backend exited early (${child.exitCode})\n${logs()}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // Keep polling until the backend finishes booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Backend did not become healthy\n${logs()}`);
}

async function startBackend(envOverrides = {}) {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'starlink-flow-'));
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const env = {
    ...process.env,
    PORT: String(port),
    DB_PATH: path.join(tempDir, 'raffle.db'),
    SKIP_SEED: 'true',
    NODE_ENV: 'test',
    SMS4FREE_KEY: 'fake-local-key',
    SMS4FREE_USER: '0500000000',
    SMS4FREE_PASS: 'fake-pass',
    SMS_DRY_RUN: 'true',
    ADMIN_EMAIL: testAdminEmail,
    ADMIN_PASSWORD: testAdminPassword,
    JWT_SECRET: 'integration-test-secret',
    ...envOverrides,
  };

  const child = spawn(process.execPath, ['dist/index.js'], {
    cwd: backendDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  await waitForHealth(baseUrl, child, () => `${stdout}\n${stderr}`);

  return {
    baseUrl,
    async stop() {
      if (child.exitCode == null) {
        child.kill();
        await Promise.race([
          once(child, 'exit'),
          new Promise((resolve) => setTimeout(resolve, 2_000)),
        ]);
      }
      await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    },
  };
}

async function jsonRequest(baseUrl, pathName, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${baseUrl}/api${pathName}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;
  assert.ok(response.ok, `${method} ${pathName} failed with ${response.status}: ${text}`);
  return data;
}

async function login(baseUrl) {
  const data = await jsonRequest(baseUrl, '/auth/login', {
    method: 'POST',
    body: { email: testAdminEmail, password: testAdminPassword },
  });
  return data.token;
}

test('registration stores an eligible participant and records the automatic SMS', async (t) => {
  const app = await startBackend();
  t.after(app.stop);

  const input = testParticipant(10101);
  const participant = await jsonRequest(app.baseUrl, '/participants', {
    method: 'POST',
    body: input,
  });

  assert.equal(participant.fullName, input.fullName);
  assert.equal(participant.email, input.email);

  const token = await login(app.baseUrl);
  const participants = await jsonRequest(app.baseUrl, '/participants', { token });
  const saved = participants.find((item) => item.id === participant.id);
  assert.ok(saved, 'registered participant should be visible in admin participants');
  assert.equal(saved.smsStatus, sentStatus);

  const eligible = await jsonRequest(app.baseUrl, '/participants/eligible', { token });
  assert.ok(eligible.some((item) => item.id === participant.id), 'registered participant should be eligible for the wheel');

  const messages = await jsonRequest(app.baseUrl, '/sms', { token });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].audience, input.phone);
  assert.equal(messages[0].recipientsCount, 1);
  assert.equal(messages[0].status, sentStatus);
});

test('missing SMS key without dry-run records failure instead of fake success', async (t) => {
  const app = await startBackend({
    NODE_ENV: 'development',
    SMS4FREE_KEY: '',
    SMS4FREE_USER: '',
    SMS4FREE_PASS: '',
    SMS_DRY_RUN: '',
  });
  t.after(app.stop);

  const input = testParticipant(30303);
  const participant = await jsonRequest(app.baseUrl, '/participants', {
    method: 'POST',
    body: input,
  });
  const token = await login(app.baseUrl);

  const participants = await jsonRequest(app.baseUrl, '/participants', { token });
  const saved = participants.find((item) => item.id === participant.id);
  assert.equal(saved.smsStatus, failedStatus);

  const messages = await jsonRequest(app.baseUrl, '/sms', { token });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].status, failedStatus);
  assert.equal(messages[0].recipientsCount, 0);
});

test('local dev origins can call the backend through Vite proxy ports', async (t) => {
  const app = await startBackend();
  t.after(app.stop);

  const response = await fetch(`${app.baseUrl}/api/health`, {
    headers: { Origin: 'http://127.0.0.1:5175' },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5175');
});

test('confirming a winner records the winner SMS and removes them from the wheel', async (t) => {
  const app = await startBackend();
  t.after(app.stop);

  const participant = await jsonRequest(app.baseUrl, '/participants', {
    method: 'POST',
    body: testParticipant(20202),
  });
  const token = await login(app.baseUrl);

  const winner = await jsonRequest(app.baseUrl, '/winners', {
    token,
    method: 'POST',
    body: { participantId: participant.id },
  });

  assert.equal(winner.participantId, participant.id);
  assert.equal(winner.smsSent, true);

  const eligible = await jsonRequest(app.baseUrl, '/participants/eligible', { token });
  assert.equal(eligible.some((item) => item.id === participant.id), false);

  const messages = await jsonRequest(app.baseUrl, '/sms', { token });
  assert.equal(messages.length, 2);
  assert.equal(messages[0].audience, participant.phone);
  assert.equal(messages[0].content, winnerSmsText);
  assert.equal(messages[0].recipientsCount, 1);
  assert.equal(messages[0].status, sentStatus);
});

test('confirming the same participant twice is idempotent and does not send duplicate winner SMS', async (t) => {
  const app = await startBackend();
  t.after(app.stop);

  const participant = await jsonRequest(app.baseUrl, '/participants', {
    method: 'POST',
    body: testParticipant(40404),
  });
  const token = await login(app.baseUrl);

  const first = await jsonRequest(app.baseUrl, '/winners', {
    token,
    method: 'POST',
    body: { participantId: participant.id },
  });
  const second = await jsonRequest(app.baseUrl, '/winners', {
    token,
    method: 'POST',
    body: { participantId: participant.id },
  });

  assert.equal(second.id, first.id);

  const winners = await jsonRequest(app.baseUrl, '/winners', { token });
  assert.equal(winners.length, 1);

  const messages = await jsonRequest(app.baseUrl, '/sms', { token });
  assert.equal(messages.length, 2);
  assert.equal(messages.filter((message) => message.content === winnerSmsText).length, 1);
});
