import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type ReposConfig, ReposConfigSchema, type ServerConfig } from '../types/index';

export function loadReposConfig(): ReposConfig {
  const configPath = join(process.cwd(), 'repos.json');

  try {
    const content = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(content);
    return ReposConfigSchema.parse(parsed);
  } catch (error) {
    console.error('Failed to load repos.json:', error);
    return { repos: {} };
  }
}

export function getServerConfig(): ServerConfig {
  return {
    port: Number.parseInt(process.env.PORT ?? '3000', 10),
    githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET ?? '',
    openclawGatewayUrl: process.env.OPENCLAW_GATEWAY_URL ?? 'http://localhost:18789',
    openclawGatewayToken: process.env.OPENCLAW_GATEWAY_TOKEN ?? '',
  };
}

let reposConfig: ReposConfig | null = null;

export function getReposConfig(): ReposConfig {
  if (!reposConfig) {
    reposConfig = loadReposConfig();
  }
  return reposConfig;
}

export function reloadReposConfig(): ReposConfig {
  reposConfig = loadReposConfig();
  return reposConfig;
}
