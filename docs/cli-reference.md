# CLI reference

```bash
git-standup-bot [options]
```

| Option | Description |
| --- | --- |
| `--since <date>` | Include commits on or after a date that git understands. |
| `--until <date>` | Include commits on or before a date that git understands. |
| `--days <number>` | Use a rolling window ending now. Ignored when `--since` is provided. |
| `--author <value>` | Filter by author name or email. Repeat the flag or pass values separated by commas. |
| `--branch <name>` | Read activity from a branch or revision. Repeat for multiple branches. |
| `--file <path>` | Limit activity to changed files under a pathspec. Repeat for multiple pathspecs. |
| `--format <json\|markdown>` | Choose output format. Defaults to `markdown`. |
| `--json` | Shortcut for `--format json`. |
| `--markdown` | Shortcut for `--format markdown`. |
| `--narrative` | Add a narrative summary. Uses OpenAI only when configured. |
| `--no-openai` | Force the deterministic fallback narrative even when an API key exists. |
| `--cwd <path>` | Run git commands from a specific repository directory. |
| `--help` | Show help. |
| `--version` | Show package version. |

## Examples

```bash
git-standup-bot --days 1 --format markdown
git-standup-bot --since 2026-05-01 --until 2026-05-24 --branch main --json
git-standup-bot --since yesterday --file src --file test --narrative --no-openai
git-standup-bot --days 7 --author "ada@example.com" --cwd ../another-repo
```

After publishing or linking the package, run the binary directly:

```bash
git-standup-bot --days 1 --author "Ada Lovelace" --branch main
```
