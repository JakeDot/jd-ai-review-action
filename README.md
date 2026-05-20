# jd-ai-review-action

Reusable GitHub Actions workflows for AI-powered code review automation.

## Workflows

| Workflow | Trigger | Description |
|---|---|---|
| [`request-ai-reviews.yml`](.github/workflows/request-ai-reviews.yml) | `workflow_call` | Requests Copilot and Gemini code reviews on pull requests |
| [`condense-reviews.yml`](.github/workflows/condense-reviews.yml) | `workflow_call` | Collapses outdated AI review comments when a new review is posted |
| [`gemini-auto-fix.yml`](.github/workflows/gemini-auto-fix.yml) | `workflow_call` | Applies actionable diff suggestions from Gemini and commits them |

---

## Usage

### `request-ai-reviews.yml`

Requests reviews from `copilot` and `gemini-code-assist` on pull request events.
Skip tags supported in PR titles: `[no-review]`, `[no-copilot]`, `[no-gemini]`.

```yaml
# .github/workflows/request-ai-reviews.yml  (in your repo)
name: Request AI Code Reviews

on:
  pull_request:
    types: [ready_for_review, synchronize]

jobs:
  request-reviews:
    uses: JakeDot/jd-ai-review-action/.github/workflows/request-ai-reviews.yml@main
    permissions:
      pull-requests: write
```

If you need to gate this on a prior build job, use `needs`:

```yaml
jobs:
  build:
    # ... your build steps

  request-reviews:
    needs: build
    uses: JakeDot/jd-ai-review-action/.github/workflows/request-ai-reviews.yml@main
    permissions:
      pull-requests: write
```

---

### `condense-reviews.yml`

Minimizes outdated review comments from `copilot-pull-request-reviewer[bot]` and
`gemini-code-assist[bot]` whenever either bot posts a new review.

```yaml
# .github/workflows/condense-reviews.yml  (in your repo)
name: Condense AI Code Reviews

on:
  pull_request_review:
    types: [submitted]
  issue_comment:
    types: [created]

jobs:
  condense:
    uses: JakeDot/jd-ai-review-action/.github/workflows/condense-reviews.yml@main
    permissions:
      pull-requests: write
      issues: write
```

---

### `gemini-auto-fix.yml`

Applies actionable `diff` blocks from Gemini review comments, commits them, and
replies with a confirmation comment.

```yaml
# .github/workflows/gemini-auto-fix.yml  (in your repo)
name: Gemini Auto-Fix

on:
  issue_comment:
    types: [created, edited]

jobs:
  auto-fix:
    uses: JakeDot/jd-ai-review-action/.github/workflows/gemini-auto-fix.yml@main
    permissions:
      contents: write
      pull-requests: write
    with:
      # Restrict auto-patching to safe file paths in your repo.
      # Paths starting with .github/ and paths containing .. are always blocked.
      allowed_path_pattern: '^[A-Za-z0-9._/-]+$'
```

#### `allowed_path_pattern` examples

| Repo type | Pattern |
|---|---|
| Browser extension (jdVidCat) | `'^(manifest\.json\|background\.js\|content\.js\|popup\.js\|popup\.html\|icons\/[A-Za-z0-9._-]+)$'` |
| Node.js project | `'^(src\/[A-Za-z0-9._/-]+\|package\.json\|tsconfig\.json)$'` |
| Allow all non-.github files | `'^[A-Za-z0-9._/-]+$'` (default) |
