import { describe, expect, it } from "vitest";

import {
  buildGitLogArgs,
  parseGitLog,
  readGitActivity,
  type GitRunner
} from "../src/git.js";

describe("git activity reader", () => {
  it("builds a git log command for date windows, branches, and changed files", () => {
    expect(
      buildGitLogArgs({
        since: "2026-05-20",
        until: "2026-05-24",
        branches: ["main", "feature/demo"],
        files: ["src", "README.md"]
      })
    ).toEqual([
      "log",
      "--date=iso-strict",
      "--name-only",
      "--pretty=format:%x1e%H%x1f%an%x1f%ae%x1f%aI%x1f%D%x1f%s%x1f%b%x1f",
      "--since=2026-05-20",
      "--until=2026-05-24",
      "main",
      "feature/demo",
      "--",
      "src",
      "README.md"
    ]);
  });

  it("uses HEAD and an empty pathspec separator by default", () => {
    expect(buildGitLogArgs({})).toEqual([
      "log",
      "--date=iso-strict",
      "--name-only",
      "--pretty=format:%x1e%H%x1f%an%x1f%ae%x1f%aI%x1f%D%x1f%s%x1f%b%x1f",
      "HEAD",
      "--"
    ]);
  });

  it("parses commits with bodies, refs, and changed files", () => {
    const raw = [
      "\x1eabc123\x1fAda Lovelace\x1fada@example.com\x1f2026-05-23T08:00:00+10:00\x1fHEAD -> main\x1fAdd receipt import\x1fblocked by API approval\x1f",
      "src/import.ts",
      "README.md",
      "\x1edef456\x1fGrace Hopper\x1fgrace@example.com\x1f2026-05-22T09:30:00+10:00\x1ffeature/demo\x1fRefactor parser\x1f\x1f",
      "src/parser.ts"
    ].join("\n");

    expect(parseGitLog(raw)).toEqual([
      {
        hash: "abc123",
        shortHash: "abc123",
        authorName: "Ada Lovelace",
        authorEmail: "ada@example.com",
        date: "2026-05-23T08:00:00+10:00",
        refs: "HEAD -> main",
        subject: "Add receipt import",
        body: "blocked by API approval",
        files: ["src/import.ts", "README.md"]
      },
      {
        hash: "def456",
        shortHash: "def456",
        authorName: "Grace Hopper",
        authorEmail: "grace@example.com",
        date: "2026-05-22T09:30:00+10:00",
        refs: "feature/demo",
        subject: "Refactor parser",
        body: "",
        files: ["src/parser.ts"]
      }
    ]);
  });

  it("filters authors after reading git activity without requiring network or real git", async () => {
    const runnerCalls: string[][] = [];
    const runner: GitRunner = (args) => {
      runnerCalls.push(args);
      return Promise.resolve({
        stdout: [
          "\x1eabc123\x1fAda Lovelace\x1fada@example.com\x1f2026-05-23T08:00:00+10:00\x1fHEAD -> main\x1fAdd import\x1f\x1f",
          "src/import.ts",
          "\x1edef456\x1fGrace Hopper\x1fgrace@example.com\x1f2026-05-22T09:30:00+10:00\x1fHEAD -> main\x1fRefactor parser\x1f\x1f",
          "src/parser.ts"
        ].join("\n"),
        stderr: ""
      });
    };

    const commits = await readGitActivity(
      { cwd: "/repo", authors: ["grace@example.com"] },
      runner
    );

    expect(commits).toHaveLength(1);
    expect(commits[0]?.authorName).toBe("Grace Hopper");
    expect(runnerCalls[0]).toContain("HEAD");
  });

  it("returns an empty list when git reports no commits", async () => {
    const runner: GitRunner = () => Promise.resolve({ stdout: "", stderr: "" });

    await expect(readGitActivity({ cwd: "/repo" }, runner)).resolves.toEqual([]);
  });
});
