import { readGitActivity, type GitRunner } from "./git.js";
import {
  createNarrative,
  type NarrativeOptions
} from "./narrative.js";
import { renderJson, renderMarkdown } from "./renderers.js";
import { createStandupSummary } from "./summary.js";
import type { ActivityQuery, OutputFormat } from "./types.js";

const VERSION = "0.1.0";

export interface ParsedCli {
  query: ActivityQuery;
  format: OutputFormat;
  narrative: boolean;
  useOpenAI: boolean;
  help: boolean;
  version: boolean;
}

export interface ParseOptions {
  now?: Date;
  cwd?: string;
}

export interface RunCliDependencies {
  gitRunner?: GitRunner;
  env?: Record<string, string | undefined>;
  now?: Date;
  cwd?: string;
  fetchImpl?: NarrativeOptions["fetchImpl"];
}

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export function parseArgs(
  argv: string[],
  options: ParseOptions = {}
): ParsedCli {
  const authors: string[] = [];
  const branches: string[] = [];
  const files: string[] = [];
  let since: string | undefined;
  let until: string | undefined;
  let days: number | undefined;
  let cwd = options.cwd ?? process.cwd();
  let format: OutputFormat = "markdown";
  let narrative = false;
  let useOpenAI = true;
  let help = false;
  let version = false;

  for (let index = 0; index < argv.length; index += 1) {
    const { flag, inlineValue } = splitInlineValue(argv[index] ?? "");

    switch (flag) {
      case "--since":
        since = readOptionValue(flag, inlineValue, argv, index);
        index += inlineValue === undefined ? 1 : 0;
        break;
      case "--until":
        until = readOptionValue(flag, inlineValue, argv, index);
        index += inlineValue === undefined ? 1 : 0;
        break;
      case "--days": {
        const rawDays = readOptionValue(flag, inlineValue, argv, index);
        index += inlineValue === undefined ? 1 : 0;
        days = parsePositiveInteger(rawDays, "--days");
        break;
      }
      case "--author":
        authors.push(...splitList(readOptionValue(flag, inlineValue, argv, index)));
        index += inlineValue === undefined ? 1 : 0;
        break;
      case "--branch":
        branches.push(...splitList(readOptionValue(flag, inlineValue, argv, index)));
        index += inlineValue === undefined ? 1 : 0;
        break;
      case "--file":
        files.push(...splitList(readOptionValue(flag, inlineValue, argv, index)));
        index += inlineValue === undefined ? 1 : 0;
        break;
      case "--format":
        format = parseFormat(readOptionValue(flag, inlineValue, argv, index));
        index += inlineValue === undefined ? 1 : 0;
        break;
      case "--json":
        format = "json";
        break;
      case "--markdown":
        format = "markdown";
        break;
      case "--narrative":
        narrative = true;
        break;
      case "--no-openai":
        useOpenAI = false;
        break;
      case "--cwd":
        cwd = readOptionValue(flag, inlineValue, argv, index);
        index += inlineValue === undefined ? 1 : 0;
        break;
      case "--help":
      case "-h":
        help = true;
        break;
      case "--version":
      case "-v":
        version = true;
        break;
      default:
        throw new Error(`Unknown option: ${flag}`);
    }
  }

  if (!since && days !== undefined) {
    since = formatDateOnly(subtractDays(options.now ?? new Date(), days));
  }

  return {
    query: {
      cwd,
      ...(since ? { since } : {}),
      ...(until ? { until } : {}),
      ...(authors.length > 0 ? { authors } : {}),
      ...(branches.length > 0 ? { branches } : {}),
      ...(files.length > 0 ? { files } : {})
    },
    format,
    narrative,
    useOpenAI,
    help,
    version
  };
}

export async function runCli(
  argv: string[],
  dependencies: RunCliDependencies = {}
): Promise<CliResult> {
  try {
    const parseOptions: ParseOptions = {};
    if (dependencies.cwd) {
      parseOptions.cwd = dependencies.cwd;
    }
    if (dependencies.now) {
      parseOptions.now = dependencies.now;
    }

    const parsed = parseArgs(argv, parseOptions);

    if (parsed.help) {
      return { exitCode: 0, stdout: helpText(), stderr: "" };
    }

    if (parsed.version) {
      return { exitCode: 0, stdout: `${VERSION}\n`, stderr: "" };
    }

    const commits = await readGitActivity(parsed.query, dependencies.gitRunner);
    const summary = createStandupSummary(commits, {
      ...parsed.query,
      generatedAt: (dependencies.now ?? new Date()).toISOString()
    });
    const env = dependencies.env ?? process.env;
    const narrative = parsed.narrative
      ? await createNarrative(summary, narrativeOptions(env, parsed.useOpenAI, dependencies))
      : undefined;
    const stdout =
      parsed.format === "json"
        ? renderJson(summary, narrative)
        : renderMarkdown(summary, narrative);

    return { exitCode: 0, stdout, stderr: "" };
  } catch (error) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: `${error instanceof Error ? error.message : String(error)}\n`
    };
  }
}

function narrativeOptions(
  env: Record<string, string | undefined>,
  useOpenAI: boolean,
  dependencies: RunCliDependencies
): NarrativeOptions {
  const options: NarrativeOptions = {
    forceFallback: !useOpenAI
  };

  if (env.OPENAI_API_KEY) {
    options.apiKey = env.OPENAI_API_KEY;
  }
  if (env.OPENAI_MODEL) {
    options.model = env.OPENAI_MODEL;
  }
  if (env.OPENAI_BASE_URL) {
    options.baseUrl = env.OPENAI_BASE_URL;
  }
  if (dependencies.fetchImpl) {
    options.fetchImpl = dependencies.fetchImpl;
  }

  return options;
}

export function helpText(): string {
  return [
    "git-standup-bot [options]",
    "",
    "Options:",
    "  --since <date>       Include commits on or after this date",
    "  --until <date>       Include commits on or before this date",
    "  --days <number>      Rolling window ending now, ignored when --since is set",
    "  --author <value>     Filter by author name or email; repeat or comma-separate",
    "  --branch <name>      Read from a branch or revision; repeat for many",
    "  --file <path>        Limit to changed files under a pathspec; repeat for many",
    "  --format <type>      json or markdown (default: markdown)",
    "  --json               Shortcut for --format json",
    "  --markdown           Shortcut for --format markdown",
    "  --narrative          Add optional OpenAI narrative with local fallback",
    "  --no-openai          Force deterministic local narrative fallback",
    "  --cwd <path>         Run git from this repository directory",
    "  --help               Show this help",
    "  --version            Show version",
    ""
  ].join("\n");
}

function splitInlineValue(arg: string): {
  flag: string;
  inlineValue: string | undefined;
} {
  const equalsIndex = arg.indexOf("=");

  if (equalsIndex === -1) {
    return { flag: arg, inlineValue: undefined };
  }

  return {
    flag: arg.slice(0, equalsIndex),
    inlineValue: arg.slice(equalsIndex + 1)
  };
}

function readOptionValue(
  flag: string,
  inlineValue: string | undefined,
  argv: string[],
  index: number
): string {
  const value = inlineValue ?? argv[index + 1];

  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFormat(value: string): OutputFormat {
  if (value === "json" || value === "markdown") {
    return value;
  }

  throw new Error(`Unsupported format: ${value}. Expected json or markdown.`);
}

function parsePositiveInteger(value: string, flag: string): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1 || String(parsed) !== value) {
    throw new Error(`${flag} must be a positive integer.`);
  }

  return parsed;
}

function subtractDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
