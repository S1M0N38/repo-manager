# Contributing to repo-manager

Thanks for your interest in contributing!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/S1M0N38/repo-manager.git
cd repo-manager

# Install dependencies
bun install

# Setup git hooks (auto-formatting on commit)
bunx simple-git-hooks

# Start development server (with hot reload)
bun run dev
```

## Development Workflow

### Run Checks

```bash
# Run all checks (typecheck + lint + test)
bun run validate

# Or individually:
bun run typecheck  # TypeScript type checking
bun run lint       # Biome linting
bun test           # Run tests

# Watch mode:
bun test --watch
bun run typecheck -- --watch
```

### Code Quality

Pre-commit hooks automatically format and lint changed files. If you see errors:

```bash
# Auto-fix lint issues
bun run lint:fix

# Format code
bun run format
```

## Style Guide

### Tech Stack

| Component | Tool |
|-----------|------|
| Runtime | Bun |
| Language | TypeScript (strict mode) |
| Linting | Biome |
| Formatting | Biome |
| Testing | Bun Test |

### Code Style

We use **Biome** for both linting and formatting. Key rules:

- **Indentation**: 2 spaces
- **Line width**: 100 characters
- **Quotes**: Single quotes for strings
- **Semicolons**: Always
- **Trailing commas**: Always

Biome enforces these automatically. Just run:

```bash
bun run format
```

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Prefer `const` over `let`
- Use Zod for runtime validation

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(webhook): add support for PR events
fix(signature): validate HMAC correctly
docs(readme): update installation steps
```

### Project Structure

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
│   └── github-labeler/
│       └── SKILL.md             # Skill definition
├── docs/                        # Documentation
├── repos.json                   # Repository configuration
└── package.json
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run `bun run validate` to ensure all checks pass
4. Push your branch and open a PR
5. Wait for review

### PR Guidelines

- Keep PRs focused (one feature/fix per PR)
- Write clear commit messages
- Add tests for new functionality
- Update documentation if needed

## Testing

```bash
# Run all tests
bun test

# Watch mode
bun test --watch

# Coverage report
bun test --coverage
```

Test files should be placed next to the code they test:

```
src/
├── routes/
│   ├── webhook.ts
│   └── webhook.test.ts
```

## Need Help?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Be respectful and constructive
