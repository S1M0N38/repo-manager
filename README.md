# repo-manager

AI-Powered GitHub Repository Manager — a thin webhook dispatcher for OpenClaw.

## Overview

repo-manager receives GitHub webhooks and forwards them to an OpenClaw gateway for AI-powered repository management. Currently supports automated issue labeling through the `github-labeler` skill.

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- OpenClaw gateway running and accessible
- `gh` CLI authenticated (`gh auth login`)

### Install

```bash
git clone https://github.com/S1M0N38/repo-manager.git
cd repo-manager
bun install
```

### Configure

1. Copy environment file:

```bash
cp .env.example .env
```

2. Edit `.env`:

```bash
PORT=3000
GITHUB_WEBHOOK_SECRET=your-webhook-secret
OPENCLAW_GATEWAY_URL=http://localhost:18789
OPENCLAW_GATEWAY_TOKEN=your-gateway-token
```

3. Configure repositories in `repos.json`:

```json
{
  "repos": {
    "owner/repo-name": {
      "enabled": true,
      "labels": ["bug", "enhancement", "documentation", "triage"],
      "events": {
        "issues": {
          "opened": {
            "skill": "github-labeler",
            "enabled": true
          }
        }
      }
    }
  }
}
```

4. Install the skill:

```bash
cp -r skills/github-labeler ~/.openclaw/skills/
```

### Run

```bash
# Development (with hot reload)
bun run dev

# Production
bun run start
```

### GitHub Webhook

In your GitHub repository settings:

1. Go to **Settings > Webhooks > Add webhook**
2. Payload URL: `http://your-server:3000/`
3. Content type: `application/json`
4. Secret: Same as `GITHUB_WEBHOOK_SECRET`
5. Events: Select "Issues"

## Development

```bash
# Run all checks
bun run validate

# Individual checks
bun run typecheck  # TypeScript
bun run lint       # Biome
bun test           # Tests

# Watch mode
bun test --watch
```

## Documentation

- [PRD](docs/PRD.md) — Product requirements and architecture
- [Deployment](docs/deployment.md) — Production deployment guide
- [Contributing](docs/contributing.md) — Development guidelines

## License

MIT
