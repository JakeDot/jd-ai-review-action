# File Aliases and Deduplication

Manage file references and reduce duplication across the project using the file aliases system.

## Overview

File aliases allow you to define canonical files and their alternative names. This prevents confusion about which file is the "true" source and helps maintain consistency across documentation, configuration, and workflows.

**Example:** If `CLAUDE.md` is the canonical developer guidelines file, aliases like `DEVELOPER.md` or `CONTRIBUTING.md` conceptually point to it, making the canonical source explicit.

## Configuration

Edit `.github/file-aliases.json` to define file aliases:

```json
{
  "aliases": [
    {
      "canonical": "CLAUDE.md",
      "aliases": ["DEVELOPER.md", "CONTRIBUTING.md"],
      "description": "Developer and contributor guidelines"
    },
    {
      "canonical": ".github/reviewers-config.json",
      "aliases": [".github/reviewer-config.json", "reviewers.json"],
      "description": "Reviewer configuration - single source of truth"
    }
  ],
  "deduplication": {
    "enabled": true,
    "scan_paths": [".github/", "docs/", "."],
    "ignore_patterns": [".git/", "node_modules/", ".DS_Store", "*.swp"]
  }
}
```

### Properties

- **canonical** — the primary/authoritative file path
- **aliases** — array of alternative names that conceptually reference the canonical file
- **description** — explains what the file contains and why aliases exist
- **scan_paths** — directories to scan for duplicate files during deduplication
- **ignore_patterns** — file patterns to exclude from duplicate scanning

## Validation

Validate the aliases configuration:

```bash
node .github/scripts/validate-file-aliases.js
```

The validator checks:
- Canonical files exist
- No alias files actually exist (aliases are conceptual)
- All aliases have descriptions
- Deduplication config is valid

## Usage

### Referencing Canonical Files

Always reference the canonical file in:
- Documentation
- Configuration files
- Workflow definitions
- Scripts and code

Example: Link to `CLAUDE.md`, not `DEVELOPER.md`

### Finding All References

To find all places where aliases are mentioned:

```bash
grep -r "DEVELOPER.md\|CONTRIBUTING.md" --include="*.md" --include="*.yml" --include="*.json"
```

This helps identify where documentation needs to be updated to use the canonical name.

### Adding New Aliases

1. Edit `.github/file-aliases.json`
2. Add the canonical file path and its aliases
3. Include a clear description
4. Run: `node .github/scripts/validate-file-aliases.js`
5. Commit the changes

Example:

```json
{
  "canonical": "EXAMPLE.md",
  "aliases": ["EXAMPLE-GUIDE.md", "HOW-TO-EXAMPLE.md"],
  "description": "Example documentation and guides"
}
```

## Benefits

- **Single source of truth** — clear which file is canonical
- **Reduced confusion** — developers know where to look for authoritative information
- **Easier refactoring** — when renaming files, aliases make the intent clear
- **Consistency** — enforces canonical names across the codebase
- **Documentation** — the alias config serves as a map of file purposes

## Examples

### Scenario 1: Contributor Guidelines

```json
{
  "canonical": "CLAUDE.md",
  "aliases": ["DEVELOPER.md", "CONTRIBUTING.md", "DEV_GUIDE.md"],
  "description": "Developer guidelines, contributor instructions, preferences"
}
```

Users looking for any of the alias names should be directed to `CLAUDE.md`.

### Scenario 2: Configuration Files

```json
{
  "canonical": ".github/reviewers-config.json",
  "aliases": ["reviewers.json", ".github/reviewer-config.json"],
  "description": "Reviewer configuration (legacy aliases should not be used)"
}
```

Only `.github/reviewers-config.json` is canonical; aliases document historical names.

### Scenario 3: Framework Documentation

```json
{
  "canonical": "BWXT.md",
  "aliases": ["PHILOSOPHY.md", "FRAMEWORK.md", "ARCHITECTURE.md"],
  "description": "BWXT graphene alloy framework philosophy and design guidance"
}
```

All architecture and philosophy questions should reference `BWXT.md`.

## Integration with Workflows

The file aliases system can be integrated into:

- **CI/CD validation** — ensure only canonical files are referenced
- **Documentation linting** — flag references to alias files
- **Link checking** — verify canonical files exist
- **Deduplication scanning** — identify actual duplicate files that should be consolidated

## Future Extensions

Potential enhancements:

- Automatic alias resolution in documentation
- CI check to prevent referencing alias files
- Deduplication report generation
- Symbolic link creation (where appropriate)
- Alias hierarchy for nested references
