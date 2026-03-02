import { createHmac } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function validateWebhookSignature(secret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!secret) {
      console.warn('GITHUB_WEBHOOK_SECRET not set, skipping signature validation');
      next();
      return;
    }

    const signature = req.get('X-Hub-Signature-256');
    if (!signature) {
      res.status(401).json({ error: 'Missing signature header' });
      return;
    }

    const payload = JSON.stringify(req.body);
    const expectedSignature = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;

    if (signature !== expectedSignature) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    next();
  };
}
