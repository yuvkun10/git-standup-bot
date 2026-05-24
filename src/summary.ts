import type {
  ActivityQuery,
  BlockerSummary,
  ChangedFileSummary,
  GitCommit,
  StandupSummary
} from "./types.js";

const BLOCKER_PATTERN =
  /\b(blocked|blocker|blocking|stuck|waiting|cannot|can't|unable|failed|failing|broken|wip|todo|fixme)\b/i;

export interface StandupSummaryOptions extends ActivityQuery {
  generatedAt?: string;
}

export function createStandupSummary(
  commits: GitCommit[],
  options: StandupSummaryOptions = {}
): StandupSummary {
  const authors = unique(
    commits.map((commit) => `${commit.authorName} <${commit.authorEmail}>`)
  );
  const branches =
    cleanList(options.branches).length > 0
      ? cleanList(options.branches)
      : unique(commits.flatMap((commit) => branchNamesFromRefs(commit.refs)));
  const changedFiles = summarizeChangedFiles(commits);
  const blockers = inferBlockers(commits);
  const highlights =
    commits.length > 0
      ? unique(commits.map((commit) => commit.subject).filter(Boolean)).slice(
          0,
          10
        )
      : ["No git activity found for this window."];

  return {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    window: {
      ...(options.since ? { since: options.since } : {}),
      ...(options.until ? { until: options.until } : {})
    },
    filters: {
      ...(cleanList(options.authors).length > 0
        ? { authors: cleanList(options.authors) }
        : {}),
      ...(cleanList(options.branches).length > 0
        ? { branches: cleanList(options.branches) }
        : {}),
      ...(cleanList(options.files).length > 0
        ? { files: cleanList(options.files) }
        : {})
    },
    totals: {
      commits: commits.length,
      authors: authors.length,
      changedFiles: changedFiles.length,
      blockers: blockers.length
    },
    authors,
    branches,
    changedFiles,
    highlights,
    blockers,
    commits
  };
}

export function inferBlockers(commits: GitCommit[]): BlockerSummary[] {
  return commits.flatMap((commit) => {
    const body = commit.body.trim();
    const text = `${commit.subject}\n${body}`;

    if (!BLOCKER_PATTERN.test(text)) {
      return [];
    }

    return [
      {
        commit: commit.shortHash,
        author: commit.authorName,
        message: commit.subject,
        reason: body || commit.subject
      }
    ];
  });
}

function summarizeChangedFiles(commits: GitCommit[]): ChangedFileSummary[] {
  const counts = new Map<string, number>();

  for (const commit of commits) {
    for (const file of commit.files) {
      counts.set(file, (counts.get(file) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([path, commitCount]) => ({ path, commits: commitCount }))
    .sort((left, right) => right.commits - left.commits || left.path.localeCompare(right.path));
}

function branchNamesFromRefs(refs: string): string[] {
  return refs
    .split(",")
    .map((ref) => ref.trim())
    .map((ref) => ref.replace(/^HEAD -> /, ""))
    .filter((ref) => ref && !/HEAD\b/.test(ref))
    .map((ref) => ref.replace(/^origin\//, ""));
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function cleanList(values: string[] | undefined): string[] {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}
