# PRD: repo-manager - AI-Powered GitHub Repository Manager

## Context

This project is a **thin webhook dispatcher** that forwards GitHub events to OpenClaw agents. The actual GitHub operations are handled by OpenClaw using its Skills system (particularly the `github` skill which uses `gh` CLI).

**Problem**: Managing multiple GitHub repositories requires manual triage, labeling, and response to issues/PRs.

**Solution**: A lightweight webhook server that triggers OpenClaw agents with specific skills to handle GitHub events autonomously.

**Initial Scope (MVP)**: Auto-label issues when opened using OpenClaw's AI + `gh` CLI.

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────────────────────┐
│   GitHub Repo   │────▶│  repo-manager    │────▶│           OpenClaw Gateway          │
│   (Webhooks)    │     │ (Thin Dispatcher)│     │                                     │
└─────────────────┘     └──────────────────┘     │   ┌─────────┐      ┌─────────────┐  │
                               │                 │   │ Agent   │─────▶│ github skill│  │
                               │                 │   │ (AI)    │      │ (uses gh)   │  │
                        ┌──────▼──────┐          │   └─────────┘      └──────┬──────┘  │
                        │  repos.json │          └───────────────────────────┼─────────┘
                        │  (config)   │                                      │
                        └─────────────┘                                      ▼
                                                                   ┌──────────────────┐
                                                                   │   GitHub API     │
                                                                   │   (via gh CLI)   │
                                                                   └──────────────────┘
```

### Key Insight: Skills Do the Work

OpenClaw Skills are **instruction packs** that teach agents how to use tools. The `github` skill already exists and uses `gh` CLI for:
- `gh issue edit <number> --add-label "bug"` - Add labels
- `gh pr list --state open` - List PRs
- `gh issue create` - Create issues
- etc.

### Components

1. **Webhook Server** (TypeScript + Express) - Thin layer
   - Receives GitHub webhook events
   - Validates webhook signatures
   - Forwards to OpenClaw Gateway

2. **OpenClaw Gateway** - Does the real work
   - Has `/hooks/agent` endpoint for triggering agents
   - Has `/v1/chat/completions` for HTTP API
   - Agent uses `github` skill via `gh` CLI

3. **Configuration** (JSON file)
   - Repository-to-agent mappings
   - Event handlers configuration

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | **Bun** (all-in-one: runtime, package manager, test runner) |
| Language | TypeScript 5.x (strict mode) |
| Web Framework | Express.js (minimal) |
| GitHub Ops | OpenClaw + `github` skill + `gh` CLI |
| Validation | Zod |
| Linting/Formatting | **Biome** (replaces ESLint + Prettier) |
| Testing | **Bun Test** (built-in, Jest-compatible) |
| Git Hooks | simple-git-hooks + lint-staged |

### Why Bun + Biome?

**Bun** provides an all-in-one toolkit:
- ⚡ 10-30x faster dependency installation
- 🔧 Zero-config TypeScript (run `.ts` files directly)
- 📦 Built-in test runner with Jest-compatible API
- 🔄 Hot reload with `--hot` flag

**Biome** is a fast, unified toolchain:
- 🚀 Written in Rust, 25-100x faster than ESLint/Prettier
- 🔧 Handles both linting AND formatting
- 📦 Single dependency instead of ESLint + Prettier + plugins
- 💡 Built-in import organization

---

## Configuration Files

### `tsconfig.json` (Bun-optimized) ✅ DONE

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "Preserve",
    "moduleResolution": "bundler",
    "lib": ["ESNext"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["bun-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### `biome.json` (Linter + Formatter) ✅ DONE

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  },
  "files": {
    "include": ["src/**/*.ts", "skills/**/*.md"],
    "ignore": ["**/dist/**", "**/node_modules/**"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      },
      "style": {
        "useConst": "warn",
        "noParameterAssign": "warn"
      },
      "suspicious": {
        "noExplicitAny": "warn",
        "noConsoleLog": "warn"
      },
      "complexity": {
        "noExcessiveCognitiveComplexity": {
          "level": "warn",
          "options": { "maxAllowedComplexity": 15 }
        }
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  }
}
```

### VS Code Settings (`.vscode/settings.json`) ✅ DONE

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

---

## Project Structure ✅ DONE

```
repo-manager/
├── src/
│   ├── index.ts                 # Entry point
│   ├── server.ts                # Express server setup
│   ├── routes/
│   │   └── webhook.ts           # GitHub webhook endpoint
│   ├── services/
│   │   └── openclaw.ts          # OpenClaw webhook dispatch
│   ├── handlers/
│   │   └── issues.ts            # Issue event → OpenClaw prompt
│   ├── middleware/
│   │   └── webhook-signature.ts # GitHub webhook validation
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   └── config/
│       └── index.ts             # Configuration management
├── skills/                      # Custom OpenClaw skills
│   └── github-labeler/          # Issue labeling skill
│       └── SKILL.md             # Skill definition
├── repos.json                   # Repository configuration
├── package.json
├── tsconfig.json
└── .env.example
```

---

## MVP Feature: Auto-Label Issues ✅ DONE

### Flow
1. Developer opens a new issue on GitHub
2. GitHub sends `issues.opened` webhook to repo-manager
3. repo-manager validates webhook signature
4. repo-manager POSTs to OpenClaw `/hooks/agent` with:
   - Task description
   - Repository context
   - Event payload
5. OpenClaw agent uses `github-labeler` skill (or `github` skill)
6. Agent executes `gh issue edit <number> --add-label "bug"` via exec tool

### OpenClaw Request
```typescript
// POST to OpenClaw /hooks/agent or /v1/chat/completions
{
  "message": `A new issue was opened in ${owner}/${repo}:

  Title: ${issue.title}
  Body: ${issue.body}

  Use the github-labeler skill to analyze this issue and apply appropriate labels.
  Available labels: ${labels.join(', ')}`,
  "user": "repo-manager",
  "context": {
    "repo": `${owner}/${repo}`,
    "issue_number": issue.number
  }
}
```

---

## Custom Skill: github-labeler ✅ DONE

Create a custom skill that teaches OpenClaw how to label issues:

```markdown
# skills/github-labeler/SKILL.md
---
name: github-labeler
description: Analyze GitHub issues and apply appropriate labels based on content. Use when asked to label, categorize, or triage issues.
metadata:
  openclaw:
    requires:
      bins: ["gh"]
---

# GitHub Issue Labeler

## Purpose
Automatically analyze issue content and apply appropriate labels.

## Process

1. **Analyze the issue content**:
   - Read the issue title and body
   - Identify keywords indicating issue type

2. **Classification rules**:
   - Contains "bug", "error", "crash", "broken" → apply "bug"
   - Contains "feature", "add", "request", "enhancement" → apply "enhancement"
   - Contains "doc", "documentation", "readme" → apply "documentation"
   - Contains "question", "how to", "help" → apply "question"
   - High urgency words → apply "priority-high"

3. **Apply labels using gh CLI**:
   ```bash
   cd /path/to/repo
   gh issue edit <number> --add-label "bug,triage"
   ```

## Example

User: "Label issue #42 in owner/repo about a login crash"

Response:
1. Analyze: "login crash" indicates a bug
2. Execute: `gh issue edit 42 --repo owner/repo --add-label "bug,triage"`
3. Confirm: Applied labels "bug" and "triage" to issue #42
```

---

## API Endpoints ✅ DONE

### `POST /webhook/github`
Receives GitHub webhook events and forwards to OpenClaw.

**Headers:**
- `X-GitHub-Event`: Event type (e.g., "issues")
- `X-Hub-Signature-256`: HMAC signature for validation

**Request Body:** GitHub webhook payload

**Response:**
- `200 OK`: Event forwarded to OpenClaw
- `401 Unauthorized`: Invalid signature
- `400 Bad Request`: Invalid payload

### `GET /health`
Health check endpoint.

---

## Configuration ✅ DONE

### Environment Variables
```bash
# Server
PORT=3000

# GitHub
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# OpenClaw
OPENCLAW_GATEWAY_URL=http://localhost:18789
OPENCLAW_GATEWAY_TOKEN=your-gateway-token
```

### repos.json
```json
{
  "repos": {
    "owner/repo": {
      "enabled": true,
      "labels": ["bug", "enhancement", "documentation", "question", "triage"],
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

---

## Dependencies ✅ DONE

```json
{
  "dependencies": {
    "express": "^4.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/express": "^5.x",
    "typescript": "^5.x",
    "@biomejs/biome": "^1.9.4",
    "simple-git-hooks": "^2.x",
    "lint-staged": "^15.x"
  },
  "scripts": {
    "dev": "bun --hot run src/index.ts",
    "build": "bun build ./src/index.ts --outdir ./dist --minify",
    "start": "bun run src/index.ts",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "validate": "bun run typecheck && bun run lint && bun test"
  },
  "simple-git-hooks": {
    "pre-commit": "lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx,json}": ["biome check --write --no-errors-on-unmatched"]
  }
}
```

---

## OpenClaw Skills Required

The repo-manager requires these skills to be installed in OpenClaw:

```bash
# Install the github skill (official, uses gh CLI)
npx clawhub@latest install github

# Or install custom github-labeler skill
cp -r skills/github-labeler ~/.openclaw/skills/
```

### Prerequisites
- `gh` CLI installed and authenticated: `gh auth login`
- OpenClaw Gateway running: `openclaw gateway start`

---

## Verification Plan ✅ DONE

### 1. Development Feedback Loop
```bash
# Run all checks in parallel during development
bun run validate

# Or individually with watch mode:
bun test --watch          # Tests
bun run typecheck --watch # Type checking (tsc --noEmit --watch)
# Biome runs on-save in VS Code
```

### 2. Unit Tests (Bun Test) ✅ DONE
```bash
# Run tests
bun test

# Watch mode
bun test --watch

# Coverage report
bun test --coverage
```

Test files created:
- `src/__tests__/webhook.test.ts` - Webhook signature validation
- `src/__tests__/openclaw.test.ts` - OpenClaw dispatch payload generation

### 3. Integration Tests
- Use `smee.io` for local webhook testing
- Test full flow with a test repository

### 4. Manual Testing
```bash
# 1. Install dependencies
bun install

# 2. Setup git hooks
bunx simple-git-hooks

# 3. Start OpenClaw
openclaw gateway start

# 4. Install github skill
npx clawhub@latest install github

# 5. Copy custom skill
cp -r skills/github-labeler ~/.openclaw/skills/

# 6. Start repo-manager (with hot reload)
bun run dev

# 7. Configure webhook in GitHub repo (use smee.io for local testing)

# 8. Open a test issue with "bug" in title
# 9. Check OpenClaw logs: openclaw gateway logs
# 10. Verify label was applied on GitHub
```

---

## Implementation Phases

### Phase 1: Foundation (MVP) ✅ DONE

- [x] Project setup with Bun (`bun init`)
- [x] Configure TypeScript (strict mode, Bun-optimized)
- [x] Configure Biome (linting + formatting)
- [x] Setup git hooks (simple-git-hooks + lint-staged)
- [x] Webhook endpoint with signature validation
- [x] OpenClaw `/hooks/agent` dispatch client
- [x] `github-labeler` skill creation
- [x] Issue opened → label flow
- [x] Unit tests with Bun Test

### Phase 2: Enhanced (Future)

- [ ] PR auto-labeling skill
- [ ] Issue commenting skill
- [ ] Multi-repository configuration UI

### Phase 3: Advanced (Future)

- [ ] PR creation linked to issues
- [ ] PR review automation skill
- [ ] Auto-merge ready PRs skill

---

## Systemd Integration (Production Deployment) ✅ DONE

repo-manager includes a systemd service unit for production deployment on Linux systems.

### Service Unit File: `repo-manager.service`

```ini
[Unit]
Description=Repo Manager - GitHub Webhook Server
Documentation=https://github.com/onoht.dev/repo-manager
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/repo-manager
Environment="NODE_ENV=production"
EnvironmentFile=/opt/repo-manager/.env
ExecStart=/root/.bun/bin/bun run start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=repo-manager

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/repo-manager
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### Installation

```bash
# 1. Copy service file to systemd directory
sudo cp repo-manager.service /etc/systemd/system/

# 2. Edit the service file to match your environment
sudo nano /etc/systemd/system/repo-manager.service
# Adjust: User, Group, WorkingDirectory, EnvironmentFile, ExecStart (bun path: /root/.bun/bin/bun)

# 3. Find bun path (if needed)
which bun  # Use this path for ExecStart

# 4. Reload systemd daemon
sudo systemctl daemon-reload

# 5. Enable service to start on boot
sudo systemctl enable repo-manager

# 6. Start the service
sudo systemctl start repo-manager

# 7. Verify it's running
sudo systemctl status repo-manager
```

### Management Commands

```bash
# Start service
sudo systemctl start repo-manager

# Stop service
sudo systemctl stop repo-manager

# Restart service
sudo systemctl restart repo-manager

# Check status
sudo systemctl status repo-manager

# View logs (real-time)
sudo journalctl -u repo-manager -f

# View logs (last 100 lines)
sudo journalctl -u repo-manager -n 100

# Disable auto-start on boot
sudo systemctl disable repo-manager
```

### Configuration Checklist

Before enabling the service, ensure:

- [ ] `User` and `Group` exist on the system (or create a dedicated user)
- [ ] `WorkingDirectory` points to the repo-manager installation
- [ ] `.env` file exists at `EnvironmentFile` path with all required variables
- [ ] `bun` is installed and accessible at the path in `ExecStart`
- [ ] The user has read/write permissions to `WorkingDirectory`

### Security Hardening Features

The service includes these security protections:

| Option | Purpose |
|--------|---------|
| `NoNewPrivileges=true` | Prevents privilege escalation |
| `ProtectSystem=strict` | Makes `/usr`, `/boot`, `/efi` read-only |
| `ProtectHome=true` | Hides `/home`, `/root`, `/run/user` |
| `ReadWritePaths=/opt/repo-manager` | Only allows writes to app directory |
| `PrivateTmp=true` | Uses private `/tmp` directory |

### Creating a Dedicated User (Recommended)

```bash
# Create system user for repo-manager
sudo useradd --system --no-create-home --shell /bin/false repo-manager

# Set ownership of installation directory
sudo chown -R repo-manager:repo-manager /opt/repo-manager

# Update service file User/Group
sudo sed -i 's/User=www-data/User=repo-manager/' /etc/systemd/system/repo-manager.service
sudo sed -i 's/Group=www-data/Group=repo-manager/' /etc/systemd/system/repo-manager.service

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart repo-manager
```

### Environment File

Ensure `/opt/repo-manager/.env` contains:

```bash
PORT=3000
GITHUB_WEBHOOK_SECRET=your-webhook-secret
OPENCLAW_GATEWAY_URL=http://localhost:18789
OPENCLAW_GATEWAY_TOKEN=your-gateway-token
```

---

## Security Considerations

1. **Webhook Validation**: Always verify `X-Hub-Signature-256`
2. **Token Storage**: Use environment variables
3. **Skill Sandboxing**: OpenClaw handles skill sandboxing
4. **Rate Limiting**: `gh` CLI respects GitHub rate limits

---

## Files to Create ✅ ALL DONE

| File | Purpose | Status |
|------|---------|--------|
| `src/index.ts` | Application entry point | ✅ |
| `src/server.ts` | Express server configuration | ✅ |
| `src/routes/webhook.ts` | Webhook endpoint handler | ✅ |
| `src/middleware/webhook-signature.ts` | Signature validation | ✅ |
| `src/services/openclaw.ts` | OpenClaw dispatch client | ✅ |
| `src/handlers/issues.ts` | Issue event → OpenClaw prompt | ✅ |
| `src/types/index.ts` | TypeScript definitions | ✅ |
| `src/config/index.ts` | Configuration management | ✅ |
| `src/__tests__/webhook.test.ts` | Webhook tests (Bun Test) | ✅ |
| `src/__tests__/openclaw.test.ts` | OpenClaw dispatch tests | ✅ |
| `skills/github-labeler/SKILL.md` | Issue labeling skill | ✅ |
| `repos.json` | Repository configuration | ✅ |
| `package.json` | Project dependencies + scripts | ✅ |
| `tsconfig.json` | TypeScript config (Bun-optimized) | ✅ |
| `biome.json` | Linter + formatter config | ✅ |
| `.env.example` | Environment template | ✅ |
| `.vscode/settings.json` | VS Code Biome integration | ✅ |
| `.gitignore` | Git ignore rules | ✅ |
| `repo-manager.service` | Systemd service unit | ✅ |

---

## Estimated Effort

| Task | Time | Status |
|------|------|--------|
| Project setup (Bun + TypeScript + Biome) | 30 min | ✅ DONE |
| Git hooks + lint-staged | 15 min | ✅ DONE |
| Webhook server | 1 hour | ✅ DONE |
| OpenClaw dispatch | 1 hour | ✅ DONE |
| github-labeler skill | 1 hour | ✅ DONE |
| Unit tests (Bun Test) | 1 hour | ✅ DONE |
| **Total** | **~5 hours** | ✅ **COMPLETED** |

---

## Quick Start Commands

```bash
# Initialize project
bun init

# Install dependencies
bun add express zod
bun add -d @types/bun @types/express typescript @biomejs/biome simple-git-hooks lint-staged

# Setup git hooks
bunx simple-git-hooks

# Start development (with hot reload)
bun run dev

# Run all checks
bun run validate
```

---

## Key Differences from Original Approach

| Aspect | Original (Complex) | New (Modern + Simple) |
|--------|-------------------|----------------------|
| Runtime | Node.js | **Bun** (all-in-one) |
| Package Manager | npm/yarn | **Bun** (10-30x faster) |
| Test Runner | Vitest | **Bun Test** (built-in) |
| Linter | ESLint | **Biome** (Rust-based, faster) |
| Formatter | Prettier | **Biome** (unified) |
| GitHub API | Octokit in repo-manager | `gh` CLI via OpenClaw skill |
| Labeling logic | In repo-manager code | In OpenClaw skill |
| AI integration | Direct API calls | OpenClaw handles everything |
| Skills | None needed | `github` + custom `github-labeler` |
| Effort | ~12 hours | **~5 hours** |

---

## Development Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Development Feedback Loop                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐     │
│   │  Edit   │───▶│ Biome   │───▶│  TSC    │───▶│ Bun Test│     │
│   │  Code   │    │(on-save)│    │--noEmit │    │ --watch │     │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘     │
│        │              │              │              │           │
│        └──────────────┴──────────────┴──────────────┘           │
│                              │                                  │
│                    ┌─────────▼─────────┐                       │
│                    │  bun run validate │                       │
│                    │  (pre-commit)     │                       │
│                    └───────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
