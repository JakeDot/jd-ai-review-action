# jd-ai-review-action

A unified toolkit combining AI-powered code review automation with shared CI/CD building blocks.

**Two complementary toolsets in one repo:**

| Feature | What it does |
| --- | --- |
| **AI Code Reviews** | Automated Copilot and Gemini code reviews on pull requests |
| **Build Pipeline** | Multi-language compilation/build with caching and artifacts |

---

## Philosophy: BWXT Graphene Alloy Framework

This toolkit is built on the **BWXT graphene alloy** framework—distinct components bonded into a unified structure that's stronger than the sum of its parts.

**Motto:** *German Bibi Blocksberg; Quantum Tunneling* — practical magic meets quantum reach.

**Three M-Framework:**
- **Motto** — the guiding principle
- **Mantra** — the repeated practice (configuration as truth, parallelism as default, composability as law, safety as discipline)
- **Mechanism** — how disparate workflows bond without coupling

See [`BWXT.md`](BWXT.md) for the full framework and design philosophy.

---

## AI Code Review Workflows

### Multiplexed Code Reviews

Configure and manage multiple, parallel AI reviewers with a single JSON configuration file.  
Supports Gemini Code Assist, GitHub Copilot, and custom reviewers.

**Key features:**
- Configuration-driven reviewer management (`.github/reviewers-config.json`)
- Parallel review requests with priority badges (🔴 primary, ⚪ secondary)
- Auto-merge triggered by primary reviewer approval
- Smart review condensing to minimize comment spam
- Skip tags for granular control: `[no-review]`, `[no-gemini]`, `[no-copilot]`, `[no-{type}]`

For complete documentation, configuration reference, and troubleshooting, see  
[`docs/multiplexed-reviews.md`](docs/multiplexed-reviews.md).

**Setup:**

1. Copy `.github/reviewers-config.json` from this repo and customize:
   ```bash
   curl -o .github/reviewers-config.json \
     https://raw.githubusercontent.com/JakeDot/jd-ai-review-action/main/.github/reviewers-config.json
   ```

2. Copy the workflows:
   ```bash
   # Request multiplexed reviews
   curl -o .github/workflows/request-multiplexed-reviews.yml \
     https://raw.githubusercontent.com/JakeDot/jd-ai-review-action/main/.github/workflows/request-multiplexed-reviews.yml
   
   # Condense outdated reviews
   curl -o .github/workflows/condense-multiplexed-reviews.yml \
     https://raw.githubusercontent.com/JakeDot/jd-ai-review-action/main/.github/workflows/condense-multiplexed-reviews.yml
   
   # Auto-merge on primary approval
   curl -o .github/workflows/auto-merge-after-review.yml \
     https://raw.githubusercontent.com/JakeDot/jd-ai-review-action/main/.github/workflows/auto-merge-after-review.yml
   
   # (Optional) Validate config on changes
   curl -o .github/workflows/validate-config.yml \
     https://raw.githubusercontent.com/JakeDot/jd-ai-review-action/main/.github/workflows/validate-config.yml
   ```

3. Enable GitHub Actions in your repository settings.

**Usage example:**

```yaml
# .github/reviewers-config.json
{
  "default_reviewers": [
    {
      "name": "Gemini Code Assist",
      "id": "gemini-code-assist",
      "type": "gemini",
      "enabled": true,
      "priority": "primary"
    },
    {
      "name": "GitHub Copilot",
      "id": "copilot-pull-request-reviewer[bot]",
      "type": "copilot",
      "enabled": true,
      "priority": "secondary"
    }
  ]
}
```

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
    request-multiplexed-reviews.yml       # Request reviews from configured reviewers
    condense-multiplexed-reviews.yml      # Minimize outdated review comments
    auto-merge-after-review.yml           # Auto-merge on primary approval
    validate-config.yml                   # Validate reviewer config on changes
    nightly-integration-test.yml          # Daily health checks
    build-pipeline.yml                    # Multi-language build orchestrator
  
  scripts/
    validate-reviewers-config.js          # Config validator
    check-reviewer-status.js              # Display reviewer status
    add-reviewer.js                       # Add new reviewers to config
  
  reviewers-config.json                   # Reviewer configuration
  reviewers-config.example.json           # Annotated example
  action.yml                              # Composite action for language setup

docs/
  multiplexed-reviews.md                  # Multiplexed reviews reference
  build-pipeline.md                       # Build pipeline reference

examples/
  build-pipeline/
    reusable-workflow.yml                 # Workflow_call example
    submodule-composite.yml               # Composite action example

commands/
  rem.md                                  # Claude Code slash commands

CLAUDE.md                                 # Contributor guidelines
README.md                                 # This file
LICENSE
```

---

## Quick start

### Set up multiplexed AI reviews

1. Copy the config and workflows (see "AI Code Review Workflows" section above)
2. Customize `.github/reviewers-config.json` with your reviewers
3. Run the validator: `node .github/scripts/validate-reviewers-config.js`
4. Commit and push—reviews will automatically trigger on new PRs

See [`docs/multiplexed-reviews.md`](docs/multiplexed-reviews.md) for detailed setup and configuration.

### Use the build pipeline

Copy an example from [`examples/build-pipeline/`](examples/build-pipeline) and adapt it to your repo.

---

## Integration

AI reviews and the build pipeline work independently or together:

- **Review-first**: Request multiplexed reviews on every PR, auto-merge when primary approves
- **Build-then-review**: Run builds first, request reviews after success
- **Monorepo**: Use `build-pipeline` for components, multiplexed reviews for the aggregate PR
- **Custom workflows**: Both systems trigger cleanly without cascading side effects

---

## Maintenance

- **Config validation**: Runs automatically on any `reviewers-config.json` changes
- **Nightly tests**: Daily integration tests verify workflows and documentation
- **Contributor guide**: See [`CLAUDE.md`](CLAUDE.md) for git and commit conventions
