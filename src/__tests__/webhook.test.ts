import { beforeEach, describe, expect, test } from 'bun:test';
import { createHmac } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { validateWebhookSignature } from '../middleware/webhook-signature';
import { createServer } from '../server';

const TEST_SECRET = 'test-webhook-secret';

describe('Webhook Signature Validation', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/test', validateWebhookSignature(TEST_SECRET), (_req, res) => {
      res.json({ success: true });
    });
  });

  test('should reject requests without signature', async () => {
    const response = await request(app).post('/test').send({ test: 'data' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Missing signature header');
  });

  test('should reject requests with invalid signature', async () => {
    const response = await request(app)
      .post('/test')
      .set('X-Hub-Signature-256', 'sha256=invalid')
      .send({ test: 'data' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid signature');
  });

  test('should accept requests with valid signature', async () => {
    const payload = JSON.stringify({ test: 'data' });
    const signature = `sha256=${createHmac('sha256', TEST_SECRET).update(payload).digest('hex')}`;

    const response = await request(app)
      .post('/test')
      .set('X-Hub-Signature-256', signature)
      .send({ test: 'data' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('should skip validation when secret is empty', async () => {
    const appNoSecret = express();
    appNoSecret.use(express.json());
    appNoSecret.post('/test', validateWebhookSignature(''), (_req, res) => {
      res.json({ success: true });
    });

    const response = await request(appNoSecret).post('/test').send({ test: 'data' });

    expect(response.status).toBe(200);
  });
});

describe('Health Endpoint', () => {
  test('should return ok status', async () => {
    const app = createServer();
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });
});
