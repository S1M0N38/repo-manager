import express from 'express';
import { getServerConfig } from './config/index';
import { validateWebhookSignature } from './middleware/webhook-signature';
import { handleWebhook } from './routes/webhook';

export function createServer(): express.Application {
  const app = express();
  const config = getServerConfig();

  // Middleware
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // GitHub webhook endpoint
  app.post('/', validateWebhookSignature(config.githubWebhookSecret), handleWebhook);

  return app;
}

export function startServer(): void {
  const config = getServerConfig();
  const app = createServer();

  app.listen(config.port, () => {
    console.info(`repo-manager listening on port ${config.port}`);
    console.info(`OpenClaw Gateway: ${config.openclawGatewayUrl}`);
  });
}
