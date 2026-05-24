# git-standup-bot

`git-standup-bot` is a TypeScript CLI that reads local git history and turns commit activity into standup summaries. It supports date windows, author filters, branches, changed-file filters, JSON or Markdown output, blocker inference from commit messages, and an optional OpenAI narrative with a deterministic local fallback.

## Install

```bash
npm install
npm run build
```

Run locally from this repo:

```bash
npm start -- --since 2026-05-20 --format markdown
```

After publishing or linking, use:

```bash
git-standup-bot --since 2026-05-20 --author "Ada Lovelace" --branch main
```

## Usage

```bash
git-standup-bot [options]
```

Options:

| Option | Description |
| --- | --- |
| `--since <date>` | Include commits on or after a git-compatible date. |
| `--until <date>` | Include commits on or before a git-compatible date. |
| `--days <number>` | Use a rolling window ending now. Ignored when `--since` is provided. |
| `--author <value>` | Filter by author name or email. Repeat or pass comma-separated values. |
| `--branch <name>` | Read activity from a branch or revision. Repeat for multiple branches. |
| `--file <path>` | Limit activity to changed files under a pathspec. Repeat for multiple pathspecs. |
| `--format <json\|markdown>` | Choose output format. Defaults to `markdown`. |
| `--json` | Shortcut for `--format json`. |
| `--markdown` | Shortcut for `--format markdown`. |
| `--narrative` | Add a narrative summary. Uses OpenAI only when configured. |
| `--no-openai` | Force deterministic fallback narrative even when an API key exists. |
| `--cwd <path>` | Run git commands from a specific repository directory. |
| `--help` | Show help. |
| `--version` | Show package version. |

Examples:

```bash
git-standup-bot --days 1 --author "maddo" --format markdown
git-standup-bot --since 2026-05-01 --until 2026-05-24 --branch main --json
git-standup-bot --since yesterday --file src --file test --narrative --no-openai
```

## OpenAI Narrative

The CLI never requires network access. When `--narrative` is set, it uses a deterministic local fallback unless `OPENAI_API_KEY` is present and `--no-openai` is not set.

Copy `.env.example` to a local `.env` file if your shell or tooling loads environment files:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

## Development

```bash
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

The test suite uses dependency injection for git and OpenAI calls, so tests do not require network access.
