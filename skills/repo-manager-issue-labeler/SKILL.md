---
name: repo-manager-issue-labeler
description: Classify and label GitHub issues.
version: 1.0.0
license: MIT
disable-model-invocation: true
metadata:
  {
    "openclaw": {
      "emoji": "🏷️",
      "homepage": "htts://github.com/S1M0N38/repo-manager",
      "category": "github",
      "requires": { "bins": ["gh"] },
      "tags": [
        "github",
        "issues",
        "labels",
        "triage"
      ]
    }
  }
---

# GitHub Issue Labeler

Classify GitHub issues and apply standard labels based on content analysis.

## Invocation

```
/issue-labeler <issue-number> [--repo owner/repo]
```

## Standard GitHub Labels

| Label | Keywords | Description |
|-------|----------|-------------|
| `bug` | bug, error, crash, broken, fails, exception | Something isn't working |
| `documentation` | doc, docs, documentation, readme, guide | Improvements or additions to documentation |
| `duplicate` | duplicate, already exists, same as | This issue already exists |
| `enhancement` | feature, add, request, enhance, improve | New feature or request |
| `good first issue` | beginner, starter, easy, simple | Good for newcomers |
| `help wanted` | help, assistance, stuck, need | Extra attention is needed |
| `invalid` | invalid, wrong, incorrect, spam | This doesn't seem right |
| `question` | question, how to, how do, help me | Further information is requested |
| `wontfix` | wontfix, won't fix, not fixing, by design | This will not be worked on |

## Process

1. **Fetch Issue Content**
   ```bash
   gh issue view <number> --repo owner/repo --json title,body,labels
   ```

2. **Analyze Content**
   - Parse title and body for keyword matches
   - Check for existing labels (don't duplicate)
   - Match against classification rules

3. **Apply Labels**
   ```bash
   gh issue edit <number> --repo owner/repo --add-label "bug,triage"
   ```

4. **Confirm Results**
   Report all applied labels to user.

## Example

**User:** `/issue-labeler 42`

**Response:**
1. Fetch: `gh issue view 42 --json title,body`
2. Analyze: Title "Login crashes on mobile" → keywords: "crashes" → `bug`
3. Execute: `gh issue edit 42 --add-label "bug"`
4. Confirm: "Applied label 'bug' to issue #42"
