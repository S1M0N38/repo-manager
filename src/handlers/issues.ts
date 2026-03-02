import type { OpenClawService } from '../services/openclaw';
import type { GitHubWebhookPayload, RepoConfig } from '../types/index';

export class IssueHandler {
  constructor(private readonly openclaw: OpenClawService) {}

  async handleIssueOpened(
    payload: GitHubWebhookPayload,
    repoConfig: RepoConfig,
  ): Promise<{ success: boolean; error?: string }> {
    const issue = payload.issue;
    if (!issue) {
      return { success: false, error: 'No issue in payload' };
    }

    const request = this.openclaw.buildIssueLabelingPrompt(
      issue,
      payload.repository.full_name,
      repoConfig,
    );

    return this.openclaw.triggerAgent(request);
  }

  async handleIssue(
    action: string,
    payload: GitHubWebhookPayload,
    repoConfig: RepoConfig,
  ): Promise<{ success: boolean; error?: string }> {
    switch (action) {
      case 'opened':
        return this.handleIssueOpened(payload, repoConfig);
      case 'edited':
      case 'closed':
      case 'reopened':
        // Future: handle other actions
        return { success: true };
      default:
        return { success: true };
    }
  }
}
