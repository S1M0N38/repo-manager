import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { OpenClawService } from '../services/openclaw';
import type { GitHubIssue, RepoConfig } from '../types/index';

const mockGatewayUrl = 'http://localhost:18789';
const mockToken = 'test-token';

describe('OpenClawService', () => {
  let service: OpenClawService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = new OpenClawService(mockGatewayUrl, mockToken);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('triggerAgent', () => {
    test('should return success when OpenClaw responds with 200', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      } as Response;

      // biome-ignore lint/suspicious/noExplicitAny: mock needs to replace global.fetch
      global.fetch = mock(() => Promise.resolve(mockResponse)) as any;

      const result = await service.triggerAgent({
        message: 'Test message',
        user: 'test-user',
        context: {},
      });

      expect(result.success).toBe(true);
    });

    test('should return error when OpenClaw responds with error', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      } as Response;

      // biome-ignore lint/suspicious/noExplicitAny: mock needs to replace global.fetch
      global.fetch = mock(() => Promise.resolve(mockResponse)) as any;

      const result = await service.triggerAgent({
        message: 'Test message',
        user: 'test-user',
        context: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });

    test('should return error when fetch fails', async () => {
      // biome-ignore lint/suspicious/noExplicitAny: mock needs to replace global.fetch
      global.fetch = mock(() => Promise.reject(new Error('Network error'))) as any;

      const result = await service.triggerAgent({
        message: 'Test message',
        user: 'test-user',
        context: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('buildIssueLabelingPrompt', () => {
    test('should build correct prompt for issue', () => {
      const issue: GitHubIssue = {
        id: 1,
        number: 42,
        title: 'Bug: Login crashes',
        body: 'The login page crashes when clicking submit',
        state: 'open',
        labels: [],
        user: { login: 'testuser' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const repoConfig: RepoConfig = {
        enabled: true,
        labels: ['bug', 'enhancement', 'triage'],
        events: { issues: { opened: { skill: 'github-labeler', enabled: true } } },
      };

      const prompt = service.buildIssueLabelingPrompt(issue, 'owner/repo', repoConfig);

      expect(prompt.message).toContain('owner/repo');
      expect(prompt.message).toContain('Bug: Login crashes');
      expect(prompt.message).toContain('The login page crashes when clicking submit');
      expect(prompt.message).toContain('bug, enhancement, triage');
      expect(prompt.user).toBe('repo-manager');
      expect(prompt.context.repo).toBe('owner/repo');
      expect(prompt.context.issue_number).toBe(42);
    });

    test('should handle issue without body', () => {
      const issue: GitHubIssue = {
        id: 1,
        number: 42,
        title: 'Feature request',
        body: null,
        state: 'open',
        labels: [],
        user: { login: 'testuser' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const repoConfig: RepoConfig = {
        enabled: true,
        labels: ['bug', 'enhancement'],
        events: { issues: {} },
      };

      const prompt = service.buildIssueLabelingPrompt(issue, 'owner/repo', repoConfig);

      expect(prompt.message).toContain('No description provided');
    });
  });
});
