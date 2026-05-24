import { describe, expect, it } from "vitest";

import { createNarrative, fallbackNarrative } from "../src/narrative.js";
import type { StandupSummary } from "../src/types.js";

const summary: StandupSummary = {
  generatedAt: "2026-05-24T00:00:00.000Z",
  window: {},
  filters: {},
  totals: {
    commits: 2,
    authors: 2,
    changedFiles: 2,
    blockers: 1
  },
  authors: ["Ada Lovelace <ada@example.com>", "Grace Hopper <grace@example.com>"],
  branches: [],
  changedFiles: [
    { path: "src/import.ts", commits: 1 },
    { path: "src/parser.ts", commits: 1 }
  ],
  highlights: ["Add receipt import", "Refactor parser"],
  blockers: [
    {
      commit: "abc1234",
      author: "Ada Lovelace",
      message: "Add receipt import",
      reason: "Blocked by vendor API approval."
    }
  ],
  commits: []
};

describe("narrative generation", () => {
  it("creates a deterministic fallback without network configuration", async () => {
    await expect(createNarrative(summary, {})).resolves.toBe(fallbackNarrative(summary));
  });

  it("uses OpenAI Responses API when configured and injected fetch succeeds", async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const fetchImpl: typeof fetch = (url, init) => {
      calls.push({
        url: requestUrl(url),
        body: JSON.parse(requestBody(init))
      });
      return Promise.resolve(
        new Response(JSON.stringify({ output_text: "OpenAI narrative." }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      );
    };

    await expect(
      createNarrative(summary, {
        apiKey: "test-key",
        model: "test-model",
        fetchImpl
      })
    ).resolves.toBe("OpenAI narrative.");

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.openai.com/v1/responses");
    expect(calls[0]?.body).toMatchObject({
      model: "test-model"
    });
  });

  it("falls back deterministically when OpenAI request fails", async () => {
    const fetchImpl: typeof fetch = () =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "nope" }), { status: 500 })
      );

    await expect(
      createNarrative(summary, {
        apiKey: "test-key",
        fetchImpl
      })
    ).resolves.toBe(fallbackNarrative(summary));
  });
});

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

function requestBody(init: RequestInit | undefined): string {
  return typeof init?.body === "string" ? init.body : "{}";
}
