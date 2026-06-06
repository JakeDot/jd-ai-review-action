# Claude user preferences

## Git

### Authentication
Use the GitHub PAT stored in the `origin` remote URL.
When setting up a new repo, embed it as:
`https://JakeDot:<PAT>@github.com/JakeDot/<repo>.git`

### Co-author trailer
Every commit must include the following trailer on its own line after a blank
line at the end of the commit message body:

```
Co-authored-by: JakeDot <dev@htl.ing>
```

### Branch naming
- Never use a `claude/` prefix on branch names. That prefix is an
  auto-generated default and produces meaningless names.
- If no branch name has been given for a task, **ask the user before
  creating the branch**. Do not invent one.

### Pull requests
- **Never create PRs as drafts.** Draft PRs prevent GitHub Copilot from
  performing automatic code review, which is a key part of the workflow.
- Only create a PR when the user explicitly asks for one.

### Commit style
- **Small and focused**: one logical change per commit. If a task requires
  changing the server, the client, and CI, those are three separate commits
  unless the changes are genuinely inseparable.
- **Verbose messages**: explain the *why* and the *what* in the body.
  - Subject line: ≤72 chars, imperative mood, no trailing period.
  - Blank line after subject.
  - Body: describe motivation, what was changed, any non-obvious decisions,
    and tradeoffs. Use bullet points or short paragraphs. Aim for enough
    context that a future reader never has to open the diff to understand why
    the change was made.
  - Trailers: `Co-authored-by:` last, after a blank line.
- **No "fix typo" squashing**: even small fixes get their own commit with a
  proper message.

### Example commit message shape
```
Add FastCDC chunking to local Tauri storage backend

Previously the client uploaded files directly to the server, which stored
them as opaque blobs. Moving to a P2P-first model means the Tauri app needs
to chunk files locally so it can announce individual chunks to peers and
serve them from its embedded HTTP server.

- Use fastcdc v3.1 with 256 KB min / 1 MB avg / 4 MB max thresholds,
  matching the server's parameters so chunk hashes are comparable.
- Hash each chunk with BLAKE3 (same as server) so peers can verify
  integrity without trusting the sender.
- Store chunk boundaries in a local SQLite table (file_hash, chunk_id,
  offset, length, hash) so random-access reads are O(chunk_size) not
  O(file_size).

Co-authored-by: JakeDot <dev@htl.ing>
```
