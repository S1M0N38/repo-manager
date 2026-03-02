# repo-manager

AI-Powered GitHub Repository Manager - A thin webhook dispatcher for OpenClaw.

## Overview

repo-manager receives GitHub webhooks and forwards them to an OpenClaw gateway for AI-powered repository management. Currently supports automated issue labeling through the `github-labeler` skill.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- OpenClaw gateway running and accessible

## Setup

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd repo-manager
bun install
```

### 2. Configure environment variables

Copy the example file and configure:

```bash
cp .env.example .env
```

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `GITHUB_WEBHOOK_SECRET` | Secret for validating GitHub webhooks | (required) |
| `OPENCLAW_GATEWAY_URL` | OpenClaw gateway URL | `http://localhost:18789` |
| `OPENCLAW_GATEWAY_TOKEN` | Auth token for OpenClaw | (required) |

### 3. Configure repositories

Edit `repos.json` to define which repositories to manage:

```json
{
  "repos": {
    "owner/repo-name": {
      "enabled": true,
      "labels": ["bug", "feature", "documentation", "triage"],
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

### 4. Configure GitHub webhook

In your GitHub repository settings:

1. Go to Settings > Webhooks > Add webhook
2. Payload URL: `http://your-server:3000/webhook/github`
3. Content type: `application/json`
4. Secret: Same as `GITHUB_WEBHOOK_SECRET`
5. Events: Select "Issues" (and others as needed)

## Development

### Run in development mode

```bash
bun run dev
```

Hot reload is enabled via `--hot` flag.

### Build for production

```bash
bun run build
```

Output goes to `./dist/`.

### Run in production

```bash
bun run start
```

### Running as a Systemd Service (Linux)

For production deployments on Linux, you can run the server as a systemd service for automatic startup and process management.

#### 1. Install the Server

```bash
# Clone to /opt (or your preferred location)
sudo git clone <repository-url> /opt/repo-manager
cd /opt/repo-manager

# Install dependencies
bun install

# Copy and configure environment
cp .env.example .env
# Edit .env with your values
nano .env

# Ensure the service user can read the files
sudo chown -R www-data:www-data /opt/repo-manager
```

#### 2. Customize the Service File (Optional)

The included `repo-manager.service` uses these defaults:
- **User/Group:** `www-data` (common on Debian/Ubuntu)
- **Install path:** `/opt/repo-manager`
- **Bun path:** `/root/.bun/bin/bun`

Check your bun installation path and adjust if needed:

```bash
which bun  # Common paths: /usr/local/bin/bun, /home/user/.bun/bin/bun, /root/.bun/bin/bun
```

If you need different settings, edit the service file before installing:

```bash
# Key lines to customize:
User=www-data                    # Service user (www-data, nobody, or dedicated user)
Group=www-data                   # Service group
WorkingDirectory=/opt/repo-manager    # Where you cloned the repo
EnvironmentFile=/opt/repo-manager/.env
ExecStart=/root/.bun/bin/bun run start  # Adjust bun path if needed
```

<details>
<summary>Creating a dedicated user (optional but recommended)</summary>

```bash
# Create a system user without login shell
sudo useradd --system --no-create-home --shell /usr/sbin/nologin repo-manager

# Set ownership
sudo chown -R repo-manager:repo-manager /opt/repo-manager

# Update service file to use:
# User=repo-manager
# Group=repo-manager
```

</details>

#### 3. Install and Start the Service

```bash
# Copy the service file
sudo cp repo-manager.service /etc/systemd/system/

# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable to start on boot
sudo systemctl enable repo-manager

# Start the service
sudo systemctl start repo-manager

# Verify it's running
sudo systemctl status repo-manager
```

#### 4. Set Up Reverse Proxy (Recommended)

For HTTPS with GitHub webhooks, use a reverse proxy like Caddy or nginx.

**Caddy (recommended for automatic HTTPS):**

```bash
# Install Caddy (Ubuntu/Debian)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

Create `/etc/caddy/Caddyfile`:

```
webhook.yourdomain.com {
    reverse_proxy localhost:3000
}
```

```bash
sudo systemctl reload caddy
```

#### 5. View Logs

```bash
# Follow logs in real-time
sudo journalctl -u repo-manager -f

# View logs from last hour
sudo journalctl -u repo-manager --since "1 hour ago"

# View recent logs with service status
sudo systemctl status repo-manager
```

#### Service Management Commands

| Command | Description |
|---------|-------------|
| `sudo systemctl start repo-manager` | Start the service |
| `sudo systemctl stop repo-manager` | Stop the service |
| `sudo systemctl restart repo-manager` | Restart the service |
| `sudo systemctl status repo-manager` | Check service status |
| `sudo systemctl enable repo-manager` | Enable start on boot |
| `sudo systemctl disable repo-manager` | Disable start on boot |
| `sudo journalctl -u repo-manager -f` | Follow logs |

## Testing

```bash
# Run tests
bun test

# Watch mode
bun run test:watch

# Coverage report
bun run test:coverage
```

## Code Quality

```bash
# Type checking
bun run typecheck

# Linting (Biome)
bun run lint

# Auto-fix lint issues
bun run lint:fix

# Format code
bun run format

# Run all checks
bun run validate
```

Pre-commit hooks are configured via `simple-git-hooks` and `lint-staged` to auto-format changed files.

## Architecture

```
src/
├── index.ts           # Entry point
├── server.ts          # Express server setup
├── config/
│   └── index.ts       # Configuration loading
├── handlers/
│   └── issues.ts      # Issue event handlers
├── middleware/
│   └── webhook-signature.ts  # GitHub signature validation
├── routes/
│   └── webhook.ts     # Webhook route handlers
├── services/
│   └── openclaw.ts    # OpenClaw gateway client
└── types/
    └── index.ts       # TypeScript types and Zod schemas
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/webhook/github` | GitHub webhook receiver |

## License

MIT
