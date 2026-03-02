import type { Request, Response } from 'express';
import { getReposConfig, getServerConfig } from '../config/index';
import { IssueHandler } from '../handlers/issues';
import { OpenClawService } from '../services/openclaw';
import {
  type GitHubWebhookPayload,
  GitHubWebhookPayloadSchema,
  type RepoConfig,
} from '../types/index';

const serverConfig = getServerConfig();
const openclawService = new OpenClawService(
  serverConfig.openclawGatewayUrl,
  serverConfig.openclawGatewayToken,
);
const issueHandler = new IssueHandler(openclawService);

function validateRepoConfig(
  repoFullName: string,
  repoConfig: { enabled: boolean } | undefined,
): { valid: boolean; message?: string } {
  if (!repoConfig) {
    return { valid: false, message: `Repository ${repoFullName} not configured, ignoring` };
  }
  if (!repoConfig.enabled) {
    return { valid: false, message: `Repository ${repoFullName} is disabled, ignoring` };
  }
  return { valid: true };
}

async function handleIssuesEvent(
  payload: GitHubWebhookPayload,
  repoConfig: RepoConfig,
  res: Response,
): Promise<void> {
  const action = payload.action;
  if (!action) {
    res.status(400).json({ error: 'Missing action in issues event' });
    return;
  }

  const eventConfig = repoConfig.events.issues;
  if (!eventConfig) {
    res.status(200).json({ message: 'Issue events not configured' });
    return;
  }

  const handlerConfig = eventConfig[action as keyof typeof eventConfig];
  if (!handlerConfig?.enabled) {
    res.status(200).json({ message: `Action ${action} not configured or disabled` });
    return;
  }

  const result = await issueHandler.handleIssue(action, payload, repoConfig);
  if (result.success) {
    res.status(200).json({ message: 'Event processed successfully' });
  } else {
    res.status(500).json({ error: result.error });
  }
}

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const eventType = req.get('X-GitHub-Event');

  console.info(`Received webhook: ${eventType}`);

  // Parse and validate payload
  const parseResult = GitHubWebhookPayloadSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid payload', details: parseResult.error.errors });
    return;
  }

  const payload = parseResult.data;
  const repoFullName = payload.repository.full_name;

  // Check if repository is configured
  const config = getReposConfig();
  const repoConfig = config.repos[repoFullName];

  const validation = validateRepoConfig(repoFullName, repoConfig);
  if (!validation.valid) {
    console.info(validation.message);
    res.status(200).json({ message: validation.message });
    return;
  }

  // Handle event based on type
  try {
    switch (eventType) {
      case 'issues':
        await handleIssuesEvent(payload, repoConfig, res);
        break;
      default:
        console.info(`Unhandled event type: ${eventType}`);
        res.status(200).json({ message: `Event type ${eventType} not handled` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing webhook:', message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
