import { z } from 'zod';

// GitHub Webhook Event Types
export const GitHubIssueSchema = z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  body: z.string().nullable(),
  state: z.enum(['open', 'closed']),
  labels: z.array(z.object({ name: z.string() })),
  user: z.object({ login: z.string() }),
  created_at: z.string(),
  updated_at: z.string(),
});

export const GitHubRepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  owner: z.object({ login: z.string() }),
});

export const GitHubWebhookPayloadSchema = z.object({
  action: z.string().optional(),
  issue: GitHubIssueSchema.optional(),
  repository: GitHubRepositorySchema,
  sender: z.object({ login: z.string() }),
});

export type GitHubIssue = z.infer<typeof GitHubIssueSchema>;
export type GitHubRepository = z.infer<typeof GitHubRepositorySchema>;
export type GitHubWebhookPayload = z.infer<typeof GitHubWebhookPayloadSchema>;

// Configuration Types
export const EventHandlerConfigSchema = z.object({
  skill: z.string(),
  enabled: z.boolean(),
});

export const IssueEventsConfigSchema = z.object({
  opened: EventHandlerConfigSchema.optional(),
  edited: EventHandlerConfigSchema.optional(),
  closed: EventHandlerConfigSchema.optional(),
  reopened: EventHandlerConfigSchema.optional(),
});

export const EventsConfigSchema = z.object({
  issues: IssueEventsConfigSchema.optional(),
});

export const RepoConfigSchema = z.object({
  enabled: z.boolean(),
  labels: z.array(z.string()),
  events: EventsConfigSchema,
});

export const ReposConfigSchema = z.object({
  repos: z.record(z.string(), RepoConfigSchema),
});

export type EventHandlerConfig = z.infer<typeof EventHandlerConfigSchema>;
export type IssueEventsConfig = z.infer<typeof IssueEventsConfigSchema>;
export type EventsConfig = z.infer<typeof EventsConfigSchema>;
export type RepoConfig = z.infer<typeof RepoConfigSchema>;
export type ReposConfig = z.infer<typeof ReposConfigSchema>;

// OpenClaw Request Types
export const OpenClawRequestSchema = z.object({
  message: z.string(),
  user: z.string(),
  context: z.record(z.string(), z.unknown()),
});

export type OpenClawRequest = z.infer<typeof OpenClawRequestSchema>;

// Server Types
export interface ServerConfig {
  port: number;
  githubWebhookSecret: string;
  openclawGatewayUrl: string;
  openclawGatewayToken: string;
}
