import { describe, expect, it } from "vitest";

import { parseArgs, runCli } from "../src/cli.js";
import type { GitRunner } from "../src/git.js";

const gitOutput = [
  "\x1eabc123456789\x1fAda Lovelace\x1fada@example.com\x1f2026-05-23T08:00:00+10:00\x1fHEAD -> main\x1fAdd receipt import\x1fBlocked by vendor API approval.\x1f",
  "src/import.ts"
].join("\n");

describe("CLI", () => {
  it("parses date windows, authors, branches, changed files, and output format", () => {
    expect(
      parseArgs([
        "--since",
        "2026-05-20",
        "--until",
        "2026-05-24",
        "--author",
        "Ada,Grace",
        "--branch",
        "main",
        "--file",
        "src",
        "--json",
        "--cwd",
        "/repo"
      ])
    ).toMatchObject({
      query: {
        cwd: "/repo",
        since: "2026-05-20",
        until: "2026-05-24",
        authors: ["Ada", "Grace"],
        branches: ["main"],
        files: ["src"]
      },
      format: "json"
    });
  });

  it("derives --since from --days when no explicit --since is provided", () => {
    expect(
      parseArgs(["--days", "2"], {
        now: new Date("2026-05-24T12:00:00.000Z")
      }).query.since
    ).toBe("2026-05-22");
  });

  it("returns JSON output from injected git activity without network", async () => {
    const seenArgs: string[][] = [];
    const gitRunner: GitRunner = (args) => {
      seenArgs.push(args);
      return Promise.resolve({ stdout: gitOutput, stderr: "" });
    };

    const result = await runCli(
      ["--since", "2026-05-20", "--author", "Ada", "--branch", "main", "--file", "src", "--json"],
      {
        gitRunner,
        env: {},
        now: new Date("2026-05-24T00:00:00.000Z")
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      totals: {
        commits: 1,
        blockers: 1
      },
      filters: {
        authors: ["Ada"],
        branches: ["main"],
        files: ["src"]
      }
    });
    expect(seenArgs[0]).toContain("--since=2026-05-20");
  });

  it("adds deterministic fallback narrative to Markdown when requested without an API key", async () => {
    const gitRunner: GitRunner = () =>
      Promise.resolve({ stdout: gitOutput, stderr: "" });

    const result = await runCli(["--narrative", "--no-openai"], {
      gitRunner,
      env: {},
      now: new Date("2026-05-24T00:00:00.000Z")
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("## Narrative");
    expect(result.stdout).toContain("1 changed file");
    expect(result.stdout).toContain("1 inferred blocker");
    expect(result.stdout).toContain("Add receipt import");
  });

  it("returns help text without reading git", async () => {
    const result = await runCli(["--help"], {
      gitRunner: () => Promise.reject(new Error("git should not run for help")),
      env: {}
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("git-standup-bot [options]");
  });

  it("reports parse errors with exit code 1", async () => {
    const result = await runCli(["--format", "xml"], {
      gitRunner: () => Promise.resolve({ stdout: "", stderr: "" }),
      env: {}
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Unsupported format");
  });
});
