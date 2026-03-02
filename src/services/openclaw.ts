import type { GitHubIssue, OpenClawRequest, RepoConfig } from '../types/index';

export class OpenClawService {
  private readonly gatewayUrl: string;
  private readonly gatewayToken: string;

  constructor(gatewayUrl: string, gatewayToken: string) {
    this.gatewayUrl = gatewayUrl;
    this.gatewayToken = gatewayToken;
  }

  async triggerAgent(request: OpenClawRequest): Promise<{ success: boolean; error?: string }> {
    const url = `${this.gatewayUrl}/hooks/agent`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.gatewayToken}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `OpenClaw error: ${response.status} - ${errorText}` };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Failed to reach OpenClaw: ${message}` };
    }
  }

  buildIssueLabelingPrompt(
    issue: GitHubIssue,
    repoFullName: string,
    repoConfig: RepoConfig,
  ): OpenClawRequest {
    const labels = repoConfig.labels.join(', ');

    const message = `A new issue was opened in ${repoFullName}:

Title: ${issue.title}
Body: ${issue.body ?? 'No description provided'}
Author: ${issue.user.login}

Use the github-labeler skill to analyze this issue and apply appropriate labels.
Available labels: ${labels}

Apply the most relevant labels based on the issue content. If uncertain, apply "triage" for manual review.`;

    return {
      message,
      user: 'repo-manager',
      context: {
        repo: repoFullName,
        issue_number: issue.number,
        available_labels: repoConfig.labels,
      },
    };
  }
}
