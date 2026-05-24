import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { ActivityQuery, GitCommit } from "./types.js";

const execFileAsync = promisify(execFile);

export const GIT_PRETTY_FORMAT =
  "%x1e%H%x1f%an%x1f%ae%x1f%aI%x1f%D%x1f%s%x1f%b%x1f";

const FIELD_SEPARATOR = "\x1f";
const RECORD_SEPARATOR = "\x1e";

export interface GitCommandResult {
  stdout: string;
  stderr: string;
}

export type GitRunner = (
  args: string[],
  options: { cwd: string }
) => Promise<GitCommandResult>;

export function buildGitLogArgs(query: ActivityQuery): string[] {
  const branches = cleanList(query.branches);
  const files = cleanList(query.files);
  const args = [
    "log",
    "--date=iso-strict",
    "--name-only",
    `--pretty=format:${GIT_PRETTY_FORMAT}`
  ];

  if (query.since) {
    args.push(`--since=${query.since}`);
  }

  if (query.until) {
    args.push(`--until=${query.until}`);
  }

  args.push(...(branches.length > 0 ? branches : ["HEAD"]));
  args.push("--", ...files);

  return args;
}

export function parseGitLog(stdout: string): GitCommit[] {
  if (!stdout.trim()) {
    return [];
  }

  return stdout
    .split(RECORD_SEPARATOR)
    .map((chunk) => chunk.replace(/^\r?\n/, "").trimEnd())
    .filter(Boolean)
    .map(parseCommitChunk);
}

export async function execGit(
  args: string[],
  options: { cwd: string }
): Promise<GitCommandResult> {
  try {
    const result = await execFileAsync("git", args, {
      cwd: options.cwd,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    throw new Error(formatGitError(error), { cause: error });
  }
}

export async function readGitActivity(
  query: ActivityQuery,
  runner: GitRunner = execGit
): Promise<GitCommit[]> {
  const cwd = query.cwd ?? process.cwd();
  const args = buildGitLogArgs(query);
  const { stdout } = await runner(args, { cwd });
  const authorFilters = cleanList(query.authors).map((value) =>
    value.toLowerCase()
  );
  const commits = parseGitLog(stdout);

  if (authorFilters.length === 0) {
    return commits;
  }

  return commits.filter((commit) => {
    const author = `${commit.authorName} ${commit.authorEmail}`.toLowerCase();
    return authorFilters.some((filter) => author.includes(filter));
  });
}

function parseCommitChunk(chunk: string): GitCommit {
  const parts = chunk.split(FIELD_SEPARATOR);
  const hash = parts[0]?.trim() ?? "";
  const authorName = parts[1]?.trim() ?? "";
  const authorEmail = parts[2]?.trim() ?? "";
  const date = parts[3]?.trim() ?? "";
  const refs = parts[4]?.trim() ?? "";
  const subject = parts[5]?.trim() ?? "";
  const body = parts[6]?.trim() ?? "";
  const fileBlock = parts.slice(7).join(FIELD_SEPARATOR);
  const files = fileBlock
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);

  return {
    hash,
    shortHash: hash.slice(0, 7) || hash,
    authorName,
    authorEmail,
    date,
    refs,
    subject,
    body,
    files
  };
}

function cleanList(values: string[] | undefined): string[] {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function formatGitError(error: unknown): string {
  if (error instanceof Error) {
    const details = error.message.trim();
    return details ? `git command failed: ${details}` : "git command failed";
  }

  return "git command failed";
}
