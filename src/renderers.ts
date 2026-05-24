import type { StandupSummary } from "./types.js";

export function renderJson(summary: StandupSummary, narrative?: string): string {
  const payload = narrative ? { ...summary, narrative } : summary;
  return JSON.stringify(payload, null, 2);
}

export function renderMarkdown(
  summary: StandupSummary,
  narrative?: string
): string {
  const lines = [
    "# Git Standup Summary",
    "",
    `Generated: ${summary.generatedAt}`,
    `Window: ${formatWindow(summary)}`,
    "",
    "## Totals",
    "",
    `- Commits: ${summary.totals.commits}`,
    `- Authors: ${summary.totals.authors}`,
    `- Changed files: ${summary.totals.changedFiles}`,
    `- Inferred blockers: ${summary.totals.blockers}`,
    "",
    "## What Changed",
    "",
    ...summary.highlights.map((highlight) => `- ${highlight}`),
    "",
    "## Changed Files",
    "",
    ...formatChangedFiles(summary),
    "",
    "## Blockers",
    "",
    ...formatBlockers(summary),
    "",
    "## Commits",
    "",
    ...formatCommits(summary)
  ];

  if (narrative) {
    lines.push("", "## Narrative", "", narrative);
  }

  return lines.join("\n");
}

function formatWindow(summary: StandupSummary): string {
  const { since, until } = summary.window;

  if (since && until) {
    return `${since} to ${until}`;
  }

  if (since) {
    return `since ${since}`;
  }

  if (until) {
    return `until ${until}`;
  }

  return "current branch history";
}

function formatChangedFiles(summary: StandupSummary): string[] {
  if (summary.changedFiles.length === 0) {
    return ["- No changed files found."];
  }

  return summary.changedFiles.map(
    (file) => `- \`${file.path}\` (${file.commits} ${plural(file.commits, "commit")})`
  );
}

function formatBlockers(summary: StandupSummary): string[] {
  if (summary.blockers.length === 0) {
    return ["- No inferred blockers."];
  }

  return summary.blockers.map(
    (blocker) =>
      `- \`${blocker.commit}\` ${blocker.author}: ${blocker.message} - ${blocker.reason}`
  );
}

function formatCommits(summary: StandupSummary): string[] {
  if (summary.commits.length === 0) {
    return ["- No commits found."];
  }

  return summary.commits.map(
    (commit) =>
      `- \`${commit.shortHash}\` ${commit.subject} (${commit.authorName}, ${commit.date})`
  );
}

function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}
