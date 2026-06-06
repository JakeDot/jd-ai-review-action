# jd-ai-review-action

A unified toolkit combining AI-powered code review automation with shared CI/CD building blocks.

**Two complementary toolsets in one repo:**

| Feature | What it does |
| --- | --- |
| **AI Code Reviews** | Automated Copilot and Gemini code reviews on pull requests |
| **Build Pipeline** | Multi-language compilation/build with caching and artifacts |

---

## AI Code Review Workflows

### `request-ai-reviews.yml`

Requests reviews from Copilot and Gemini Code Assist on pull request events.  
Skip tags supported in PR titles: `[no-review]`, `[no-copilot]`, `[no-gemini]`.

**Usage example:**

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

With a prior build job:

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

**Usage example:**

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

**Usage example:**

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
| --- | --- |
| Browser extension (jdVidCat) | `'^(manifest\.json\|background\.js\|content\.js\|popup\.js\|popup\.html\|icons\/[A-Za-z0-9._-]+)$'` |
| Node.js project | `'^(src\/[A-Za-z0-9._/-]+\|package\.json\|tsconfig\.json)$'` |
| Allow all non-.github files | `'^[A-Za-z0-9._/-]+$'` (default) |

---

## Build Pipeline

Multi-language compilation and build pipeline with automatic toolchain setup, caching, artifact handling, and test execution.

### Two ways to use

1. **Reusable workflow** — call directly by repo ref (no submodule needed):
   ```yaml
   uses: JakeDot/jd-ai-review-action/.github/workflows/build-pipeline.yml@main
   ```

2. **Composite action** — reference via local filesystem path (requires submodule):
   ```yaml
   uses: ./.github/jd-ai-review-action
   ```

### Reusable workflow example

```yaml
# .github/workflows/build.yml  (in your repo)
name: Build All Components

on: [push, pull_request]

jobs:
  build:
    uses: JakeDot/jd-ai-review-action/.github/workflows/build-pipeline.yml@main
    with:
      components: |
        [
          {
            "name": "Java API",
            "language": "java",
            "version": "21",
            "workdir": "services/api",
            "cache": "maven",
            "build": "mvn -B -ntp clean package",
            "test": "mvn -B -ntp test",
            "artifacts": "services/api/target/*.jar"
          },
          {
            "name": "Node Client",
            "language": "node",
            "version": "20",
            "workdir": "client",
            "cache": "npm",
            "build": "npm ci && npm run build",
            "test": "npm test",
            "artifacts": "client/dist/**"
          }
        ]
```

For the complete pipeline reference (all inputs, component schema, error handling), see  
[`docs/build-pipeline.md`](docs/build-pipeline.md).

Example caller workflows are in [`examples/build-pipeline/`](examples/build-pipeline).

---

## Project Standards

See [`CLAUDE.md`](CLAUDE.md) for contributor guidelines on:

- Git authentication and co-author conventions
- Branch naming and PR requirements
- Commit style and messaging

---

## Repository structure

```
.github/
  workflows/
    request-ai-reviews.yml      # Request AI reviews on PRs
    condense-reviews.yml        # Minimize outdated review comments
    gemini-auto-fix.yml         # Auto-apply Gemini diff suggestions
    build-pipeline.yml          # Multi-language build orchestrator
    request-reviewers.yml       # Legacy (for submodule-based setups)
  
action.yml                      # Composite action for language setup
docs/
  build-pipeline.md             # Complete build pipeline reference
examples/
  build-pipeline/
    reusable-workflow.yml       # Copy-paste example using workflow_call
    submodule-composite.yml     # Copy-paste example using composite action
commands/
  rem.md                        # Claude Code slash commands (setup-related)

CLAUDE.md                       # Contributor guidelines
README.md                       # This file
LICENSE
```

---

## Quick start

### Use AI review workflows

Add to your repo's `.github/workflows/`:

```bash
# Request reviews
curl -o .github/workflows/request-ai-reviews.yml \
  https://raw.githubusercontent.com/JakeDot/jd-ai-review-action/main/.github/workflows/request-ai-reviews.yml

# Condense outdated comments
curl -o .github/workflows/condense-reviews.yml \
  https://raw.githubusercontent.com/JakeDot/jd-ai-review-action/main/.github/workflows/condense-reviews.yml

# (Optional) Auto-apply Gemini fixes
curl -o .github/workflows/gemini-auto-fix.yml \
  https://raw.githubusercontent.com/JakeDot/jd-ai-review-action/main/.github/workflows/gemini-auto-fix.yml
```

Then trigger them from your own workflows (see examples above).

### Use the build pipeline

Copy an example from [`examples/build-pipeline/`](examples/build-pipeline) and adapt it to your repo.

---

## Integration

Both feature sets work independently or together. Common patterns:

- **Review-then-build**: Run `request-ai-reviews` after a build succeeds
- **Build-then-review**: Let reviews trigger conditional builds
- **Monorepo**: Use `build-pipeline` for components, AI reviews on the aggregate PR

---

## Support

See the original repos for standalone documentation:

- **AI reviews**: [`github.com/JakeDot/jd-ai-review-action`](https://github.com/JakeDot/jd-ai-review-action)
- **Build pipeline**: [`github.com/JakeDot/claude-setup`](https://github.com/JakeDot/claude-setup)

Both are maintained as a unified toolkit here.
