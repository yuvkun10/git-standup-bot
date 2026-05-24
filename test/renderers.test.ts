import { describe, expect, it } from "vitest";

import { renderJson, renderMarkdown } from "../src/renderers.js";
import type { StandupSummary } from "../src/types.js";

const summary: StandupSummary = {
  generatedAt: "2026-05-24T00:00:00.000Z",
  window: {
    since: "2026-05-20",
    until: "2026-05-24"
  },
  filters: {
    authors: ["Ada"],
    branches: ["main"],
    files: ["src"]
  },
  totals: {
    commits: 1,
    authors: 1,
    changedFiles: 1,
    blockers: 1
  },
  authors: ["Ada Lovelace <ada@example.com>"],
  branches: ["main"],
  changedFiles: [{ path: "src/import.ts", commits: 1 }],
  highlights: ["Add receipt import"],
  blockers: [
    {
      commit: "abc1234",
      author: "Ada Lovelace",
      message: "Add receipt import",
      reason: "Blocked by vendor API approval."
    }
  ],
  commits: [
    {
      hash: "abc123456789",
      shortHash: "abc1234",
      authorName: "Ada Lovelace",
      authorEmail: "ada@example.com",
      date: "2026-05-23T08:00:00+10:00",
      refs: "HEAD -> main",
      subject: "Add receipt import",
      body: "Blocked by vendor API approval.",
      files: ["src/import.ts"]
    }
  ]
};

describe("renderers", () => {
  it("renders parseable JSON", () => {
    expect(JSON.parse(renderJson(summary))).toEqual(summary);
  });

  it("renders Markdown standup sections with blockers and changed files", () => {
    const markdown = renderMarkdown(summary);

    expect(markdown).toContain("# Git Standup Summary");
    expect(markdown).toContain("Window: 2026-05-20 to 2026-05-24");
    expect(markdown).toContain("- Add receipt import");
    expect(markdown).toContain("- `src/import.ts` (1 commit)");
    expect(markdown).toContain("- `abc1234` Ada Lovelace: Add receipt import - Blocked by vendor API approval.");
  });
});
