# Privacy and security

- Git parsing happens locally through the installed `git` CLI.
- Normal Markdown and JSON summaries do not call the network.
- Optional OpenAI narrative mode sends only summary fields, highlights, blockers, authors, branches and changed file paths. It does not send repository contents.
- Use `--no-openai` when summaries must stay fully local.
- Do not commit real `.env` files, API keys, private handoff notes or generated local workflow files.
- Review commit messages before sharing summaries if they may contain customer names, credentials, incident details or private business context.
