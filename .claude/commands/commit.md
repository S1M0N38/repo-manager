---
model: sonnet
---

Analyze all modified and untracked files, group them logically, and create one or more conventional commits.

### Conventional Commits

**Format:** `<type>(<scope>): <description>`

Title must be **< 72 characters**.

#### Types

- feat: new feature
- fix: bug fix
- refactor: code change that neither fixes a bug nor adds a feature
- style: formatting, missing semicolons, etc.
- perf: performance improvement
- docs: documentation
- chore: maintenance tasks
- ci: continuous integration changes
- test: adding or correcting tests

#### Scopes

Use one of these fixed scopes. Omit the scope only when a change spans too many areas to pick one.

| Scope | Covers |
|---|---|
| `webhook` | GitHub webhook endpoint, event routing (routes/webhook.ts) |
| `openclaw` | OpenClaw gateway integration (services/openclaw.ts) |
| `handlers` | Event handlers for issues, PRs, etc. (handlers/) |
| `skills` | Custom OpenClaw skills (skills/) |
| `middleware` | Express middleware (middleware/) |
| `config` | Configuration, repos.json, environment (config/, repos.json) |
| `types` | TypeScript types and Zod schemas (types/) |
| `tests` | Test files (src/__tests__/) |
| `docs` | Documentation (README.md, docs/) |
| `ci` | GitHub Actions, CI/CD |
| `tooling` | package.json, tsconfig, biome, lint-staged |

#### Examples

```
feat(webhook): add PR opened event handler
fix(openclaw): handle gateway timeout errors
feat(skills): add github-labeler skill for auto-triage
test(handlers): cover issue labeling prompt generation
docs: add setup instructions for OpenClaw integration
refactor(config): use Zod for repos.json validation
```

### Workflow

1. Run `git status` to see overall repository state. If there are no changes (staged or unstaged), exit.
2. Run `git diff` and `git diff --stat` to analyze all unstaged changes.
3. Run `git diff --staged` and `git diff --stat --staged` to analyze already staged changes.
4. Run `git log --oneline -10` to review recent commit patterns.
5. Group the changed files logically by scope/purpose. If all changes belong to the same logical unit, make a single commit. If changes span multiple unrelated scopes, split them into separate commits (e.g., a style change and a new gallery feature should be two commits).
6. For each logical group, in order:
   a. Stage only the files for that group with `git add <file1> <file2> ...`
   b. Write a concise commit message (72 chars max for first line). Include a body if the changes are complex.
   c. Create the commit.
7. After all commits, run `git log --oneline -5` to confirm the result.
