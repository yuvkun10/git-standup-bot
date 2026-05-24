export type OutputFormat = "json" | "markdown";

export interface ActivityQuery {
  cwd?: string;
  since?: string;
  until?: string;
  authors?: string[];
  branches?: string[];
  files?: string[];
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  authorName: string;
  authorEmail: string;
  date: string;
  refs: string;
  subject: string;
  body: string;
  files: string[];
}

export interface ChangedFileSummary {
  path: string;
  commits: number;
}

export interface BlockerSummary {
  commit: string;
  author: string;
  message: string;
  reason: string;
}

export interface StandupSummary {
  generatedAt: string;
  window: {
    since?: string;
    until?: string;
  };
  filters: {
    authors?: string[];
    branches?: string[];
    files?: string[];
  };
  totals: {
    commits: number;
    authors: number;
    changedFiles: number;
    blockers: number;
  };
  authors: string[];
  branches: string[];
  changedFiles: ChangedFileSummary[];
  highlights: string[];
  blockers: BlockerSummary[];
  commits: GitCommit[];
}
