# AGENTS.md

`git-standup-bot` is a TypeScript CLI that turns local git history into Markdown or JSON standup summaries, with an optional OpenAI narrative that falls back to a local one.

## Setup

Node.js 20.19 or newer with npm, and Git on `PATH`.

```bash
npm install
npm run build
```

Normal summaries need no environment variables. Narrative mode reads `OPENAI_API_KEY`, `OPENAI_MODEL` and `OPENAI_BASE_URL`. See [docs/configuration.md](docs/configuration.md).

## Commands

```bash
npm run build      # tsc -p tsconfig.json
npm run typecheck  # tsc --noEmit -p tsconfig.json
npm run lint       # eslint .
npm test           # vitest run
npm run audit      # npm audit --audit-level=moderate
npm run outdated   # npm outdated
npm start -- --days 1 --format markdown
```

## Project structure

- `src/bin.ts`, `src/cli.ts`: entry point and argument parsing.
- `src/git.ts`: git log reading and parsing.
- `src/summary.ts`, `src/renderers.ts`: summaries and Markdown or JSON output.
- `src/narrative.ts`: optional OpenAI narrative with local fallback.
- `test/`: Vitest suites.

Details are in [docs/architecture.md](docs/architecture.md).

## Conventions

- TypeScript `strict`. ESLint uses type checked `typescript-eslint` rules; `consistent-type-imports`, `no-floating-promises` and `no-misused-promises` are errors.
- No formatter or commit convention is enforced. Recent history uses `type: summary` subjects. Do not add attribution trailers.

## Testing

Before a PR run audit, outdated, test, lint, typecheck and build. CI runs the same set on pushes to `main` and on pull requests.

## Safety

- Never commit `.env` files, API keys, private handoff notes or generated local workflow files.
- Keep the default output deterministic and local. OpenAI is used only when narrative mode is requested and a key is set.

## More

- [docs/README.md](docs/README.md): docs index
- [docs/cli-reference.md](docs/cli-reference.md): all CLI options
- [docs/security.md](docs/security.md): security notes
