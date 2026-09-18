# git-standup-bot

`git-standup-bot` is a TypeScript CLI that turns local git history into Markdown or JSON for standups. Engineers, team leads and maintainers use it to summarize real work from commits without giving an outside service access to the repository. An optional narrative mode can call OpenAI and falls back to a deterministic local narrative. Status: version 0.1.0, a public portfolio project, not published to npm.

## Installation

Prerequisites:

- Node.js 20.19 or newer, with its bundled npm
- Git available on `PATH`
- A local git repository to summarize

```bash
npm install
npm run build
```

No environment variables are needed for normal summaries. Narrative mode reads `OPENAI_API_KEY`, `OPENAI_MODEL` and `OPENAI_BASE_URL`. See [docs/configuration.md](docs/configuration.md).

## Usage

Run from this repository after building:

```bash
npm start -- --days 1 --format markdown
npm start -- --since yesterday --file src --narrative --no-openai
```

All options and more examples are in [docs/cli-reference.md](docs/cli-reference.md).

Daily development commands:

```bash
npm run build
npm run audit
npm run outdated
```

`npm run audit` fails on moderate or higher npm advisories. `npm run outdated` checks the npm registry for direct dependencies that no longer match the current installed, wanted and latest versions.

The repo contains no deployment configuration. The package declares a `git-standup-bot` binary for use after publishing or linking.

## Project structure

```text
├── .github
│   ├── workflows
│   │   └── ci.yml
│   └── dependabot.yml
├── docs
│   ├── architecture.md
│   ├── architecture.mmd
│   ├── cli-reference.md
│   └── archive
├── src
│   ├── bin.ts
│   ├── cli.ts
│   ├── git.ts
│   ├── narrative.ts
│   ├── renderers.ts
│   ├── summary.ts
│   └── types.ts
├── test
├── .env.example
├── eslint.config.js
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

See [docs/architecture.md](docs/architecture.md) for the flow diagram and what each file does.

## Coding style

ESLint 10 with the `@eslint/js` recommended config and the `typescript-eslint` type checked recommended config (`eslint.config.js`). Three extra rules are errors: `consistent-type-imports`, `no-floating-promises` and `no-misused-promises`. TypeScript runs in `strict` mode. No formatter, commit hook or commit convention is configured.

```bash
npm run lint
npm run typecheck
```

## Test

```bash
npm test
```

Vitest runs the suites in `test/`. They cover CLI parsing, git log parsing, summaries, renderers and narrative behavior. CI runs audit, outdated, test, lint, typecheck and build on every push to `main` and on pull requests.

## Documentation

- [docs/README.md](docs/README.md): index of all docs
- [docs/architecture.md](docs/architecture.md)
- [docs/cli-reference.md](docs/cli-reference.md)
- [docs/configuration.md](docs/configuration.md)
- [docs/security.md](docs/security.md)

## License

MIT. See [LICENSE](LICENSE).
