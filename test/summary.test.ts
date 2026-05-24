import { describe, expect, it } from "vitest";

import { createStandupSummary } from "../src/summary.js";
import type { GitCommit } from "../src/types.js";

const commits: GitCommit[] = [
  {
    hash: "abc123456789",
    shortHash: "abc1234",
    authorName: "Ada Lovelace",
    authorEmail: "ada@example.com",
    date: "2026-05-23T08:00:00+10:00",
    refs: "HEAD -> main",
    subject: "Add receipt import",
    body: "Blocked by vendor API approval.",
    files: ["src/import.ts", "README.md"]
  },
  {
    hash: "def456789012",
    shortHash: "def4567",
    authorName: "Grace Hopper",
    authorEmail: "grace@example.com",
    date: "2026-05-23T10:00:00+10:00",
    refs: "feature/parser",
    subject: "Refactor parser for branch windows",
    body: "",
    files: ["src/parser.ts", "src/import.ts"]
  }
];

describe("standup summary", () => {
  it("aggregates commits, authors, branches, changed files, and inferred blockers", () => {
    const summary = createStandupSummary(commits, {
      since: "2026-05-20",
      until: "2026-05-24",
      authors: ["Ada", "Grace"],
      branches: ["main", "feature/parser"],
      files: ["src"],
      generatedAt: "2026-05-24T00:00:00.000Z"
    });

    expect(summary.window).toEqual({
      since: "2026-05-20",
      until: "2026-05-24"
    });
    expect(summary.generatedAt).toBe("2026-05-24T00:00:00.000Z");
    expect(summary.totals).toEqual({
      commits: 2,
      authors: 2,
      changedFiles: 3,
      blockers: 1
    });
    expect(summary.authors).toEqual(["Ada Lovelace <ada@example.com>", "Grace Hopper <grace@example.com>"]);
    expect(summary.branches).toEqual(["main", "feature/parser"]);
    expect(summary.changedFiles).toEqual([
      { path: "src/import.ts", commits: 2 },
      { path: "README.md", commits: 1 },
      { path: "src/parser.ts", commits: 1 }
    ]);
    expect(summary.blockers).toEqual([
      {
        commit: "abc1234",
        author: "Ada Lovelace",
        message: "Add receipt import",
        reason: "Blocked by vendor API approval."
      }
    ]);
    expect(summary.highlights).toEqual([
      "Add receipt import",
      "Refactor parser for branch windows"
    ]);
  });

  it("returns deterministic empty-state content when there is no activity", () => {
    const summary = createStandupSummary([], {
      generatedAt: "2026-05-24T00:00:00.000Z"
    });

    expect(summary.totals).toEqual({
      commits: 0,
      authors: 0,
      changedFiles: 0,
      blockers: 0
    });
    expect(summary.highlights).toEqual(["No git activity found for this window."]);
    expect(summary.blockers).toEqual([]);
  });
});
