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
  "audit_reviewers": [
    {
      "name": "Gemini Code Assist",
      "id": "gemini-code-assist",
      "type": "gemini",
      "enabled": true
    }
  ],
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

### Option 1: Use the helper script (recommended)

```bash
node .github/scripts/add-reviewer.js "Custom Bot" custom-bot custom --priority secondary
```

### Option 2: Manual edit

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

2. **Validate:**
   ```bash
   node .github/scripts/validate-reviewers-config.js
   ```

3. **Ensure the reviewer is available on GitHub**
   - Must be able to be added as a PR reviewer
   - Must be able to submit reviews

4. **Update workflows** if custom logic is needed (e.g., special handling for specific review types)

## Extending the System

To add new reviewer types:

1. Add to `.github/reviewers-config.json`
2. Update workflow matrix logic if needed
3. Add type-specific handling in request/condense workflows

The system is designed to be extensible without modifying core logic.

## Troubleshooting

### No reviews requested

**Symptom:** PR created but no reviewers added  
**Cause:** Workflow not triggered or permission issues  
**Fix:**
- Check PR is not a draft
- Check PR title doesn't contain `[no-review]`
- Verify `request-multiplexed-reviews.yml` is in `.github/workflows/`
- Check GitHub Actions are enabled in repo settings

### Reviews requested but auto-merge not triggering

**Symptom:** Reviewer approved but PR not merging  
**Cause:** Review state is not "APPROVED" or PR has merge conflicts  
**Fix:**
- Check reviewer submitted "APPROVED" review (not "COMMENTED")
- Verify PR has no merge conflicts
- Check auto-merge-after-review.yml conditions
- Ensure `contents: write` permission is available

### Duplicate review requests

**Symptom:** Same reviewer requested multiple times  
**Cause:** Workflow triggered multiple times on same PR  
**Fix:**
- GitHub deduplicates reviewer requests automatically
- If comments spam, check workflow trigger conditions
- Review workflow is stateless — multiple triggers are normal

### Reviewer not recognized

**Symptom:** Reviewer ID in config doesn't match GitHub user  
**Cause:** Typo in reviewer ID or wrong bot name  
**Fix:**
- Run validator: `node .github/scripts/validate-reviewers-config.js`
- Verify exact bot/user name (case-sensitive)
- Use exact match, not substring (e.g., `copilot-pull-request-reviewer[bot]`)

### Validate your config

Always validate configuration before pushing:

```bash
node .github/scripts/validate-reviewers-config.js
```

This catches errors early:
- Missing required fields
- Duplicate IDs
- Invalid priorities
- Disabled primary reviewers
