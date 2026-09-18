# Configuration

The tool does not require environment variables for normal summaries. Optional narrative generation can use these values from your shell or an ignored local `.env` file. The values below are the defaults from `.env.example`, not secrets.

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

Use `.env.example` as the safe tracked template. Keep real keys in `.env`, `.env.local`, your shell or your secret manager. The repo ignores `.env` and `.env.*` while explicitly keeping `.env.example` tracked.
