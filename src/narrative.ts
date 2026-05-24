import type { StandupSummary } from "./types.js";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4.1-mini";

export interface NarrativeOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  forceFallback?: boolean;
}

export async function createNarrative(
  summary: StandupSummary,
  options: NarrativeOptions
): Promise<string> {
  if (options.forceFallback || !options.apiKey) {
    return fallbackNarrative(summary);
  }

  const fetcher = options.fetchImpl ?? globalThis.fetch;

  if (!fetcher) {
    return fallbackNarrative(summary);
  }

  try {
    const baseUrl = trimTrailingSlash(options.baseUrl ?? DEFAULT_BASE_URL);
    const response = await fetcher(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${options.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: options.model ?? DEFAULT_MODEL,
        input: [
          {
            role: "system",
            content:
              "Write a concise standup narrative from git activity. Mention completed work, risks, and blockers. Do not invent facts."
          },
          {
            role: "user",
            content: JSON.stringify({
              totals: summary.totals,
              authors: summary.authors,
              branches: summary.branches,
              highlights: summary.highlights,
              blockers: summary.blockers,
              changedFiles: summary.changedFiles.slice(0, 20)
            })
          }
        ]
      })
    });

    if (!response.ok) {
      return fallbackNarrative(summary);
    }

    const body: unknown = await response.json();
    return extractOpenAIText(body) ?? fallbackNarrative(summary);
  } catch {
    return fallbackNarrative(summary);
  }
}

export function fallbackNarrative(summary: StandupSummary): string {
  const highlightText =
    summary.highlights.length > 0
      ? summary.highlights.slice(0, 3).join("; ")
      : "No git activity found for this window.";
  const blockerText =
    summary.blockers.length > 0
      ? `${summary.blockers.length} ${plural(summary.blockers.length, "inferred blocker")}: ${summary.blockers
          .map((blocker) => blocker.message)
          .slice(0, 3)
          .join("; ")}`
      : "no inferred blockers";

  return [
    `Completed ${summary.totals.commits} ${plural(summary.totals.commits, "commit")} across ${summary.totals.authors} ${plural(summary.totals.authors, "author")} and touched ${summary.totals.changedFiles} ${plural(summary.totals.changedFiles, "changed file")}.`,
    `Highlights: ${highlightText}.`,
    `Blockers: ${blockerText}.`
  ].join(" ");
}

function extractOpenAIText(body: unknown): string | undefined {
  if (!isRecord(body)) {
    return undefined;
  }

  const outputText = body.output_text;
  if (typeof outputText === "string" && outputText.trim()) {
    return outputText.trim();
  }

  const output = body.output;
  if (!Array.isArray(output)) {
    return undefined;
  }

  const textParts: string[] = [];

  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (isRecord(content) && typeof content.text === "string") {
        textParts.push(content.text);
      }
    }
  }

  const text = textParts.join("\n").trim();
  return text || undefined;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
