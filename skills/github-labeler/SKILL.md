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
