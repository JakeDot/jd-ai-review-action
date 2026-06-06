# Multiplexed Code Reviews

Distribute code reviews to multiple, configurable AI reviewers with Gemini Code Assist as the primary reviewer.

## Architecture

The multiplexer system consists of:
- **Configuration:** `.github/reviewers-config.json` - Define reviewers and their properties
- **Request workflow:** `request-multiplexed-reviews.yml` - Distributes review requests
- **Condense workflow:** `condense-multiplexed-reviews.yml` - Minimizes outdated reviews

## Configuration

Edit `.github/reviewers-config.json` to manage reviewers:

```json
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
      "id": "copilot",
      "type": "copilot",
      "enabled": true,
      "priority": "secondary"
    }
  ],
  "audit_reviewers": [],
  "custom_reviewers": []
}
```

### Properties

- **name:** Display name for the reviewer
- **id:** GitHub username or bot handle
- **type:** Reviewer type (gemini, copilot, custom)
- **enabled:** Include in review requests (true/false)
- **priority:** "primary" (🔴) or "secondary" (⚪) - determines auto-merge eligibility

## Usage

### Automatic on Pull Requests

Reviews are automatically requested when:
- PR transitions to `ready_for_review`
- New commits are pushed

### Skip Tags

Exclude specific reviewers from a PR using tags in the title:
- `[no-review]` - Skip all reviewers
- `[no-gemini]` - Skip Gemini Code Assist
- `[no-copilot]` - Skip GitHub Copilot
- `[no-{type}]` - Skip by reviewer type

Example PR titles:
```
Add feature [no-copilot]
Fix bug [no-review]
Chore: update deps [no-gemini]
```

## Auto-Merge

PRs auto-merge when the **primary reviewer** (🔴 priority) approves:
- Gemini Code Assist is the default primary reviewer
- Merge method: squash
- Only mergeable PRs are merged

## Workflows

### request-multiplexed-reviews.yml

Triggers on PR ready/synchronize:
1. Loads reviewer config
2. Requests reviews from enabled reviewers in parallel
3. Posts status comments with priority badges
4. Respects skip tags

### condense-multiplexed-reviews.yml

Triggers on any review submission:
1. Groups reviews by reviewer
2. Minimizes all but latest from each reviewer
3. Keeps PR review thread clean

## Adding Custom Reviewers

1. **Update config:**
   ```json
   "custom_reviewers": [
     {
       "name": "Custom Bot",
       "id": "custom-bot",
       "type": "custom",
       "enabled": true,
       "priority": "secondary"
     }
   ]
   ```

2. **Ensure the reviewer is available on GitHub**
   - Must be able to be added as a PR reviewer
   - Must be able to submit reviews

3. **Update workflows** if custom logic is needed (e.g., special handling for specific review types)

## Extending the System

To add new reviewer types:

1. Add to `.github/reviewers-config.json`
2. Update workflow matrix logic if needed
3. Add type-specific handling in request/condense workflows

The system is designed to be extensible without modifying core logic.
