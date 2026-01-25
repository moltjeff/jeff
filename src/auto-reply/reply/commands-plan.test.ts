import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { ClawdbotConfig } from "../../config/config.js";
import type { MsgContext } from "../templating.js";
import { buildCommandContext, handleCommands } from "./commands.js";
import { parseInlineDirectives } from "./directive-handling.js";

// Mock clack prompts to simulate TUI interaction.
const clackHoisted = vi.hoisted(() => {
  let selectCalls = 0;
  const select = vi.fn(async ({ options, message }: any) => {
    selectCalls += 1;
    if (String(message).includes("Choose a section")) {
      // First time: choose first section, second time: review.
      if (selectCalls > 1) return "__review";
      return options[0].value;
    }
    return options[0].value;
  });
  const multiselect = vi.fn(async ({ options }: any) => {
    // pick all
    return options.map((o: any) => o.value);
  });
  const text = vi.fn(async ({ initialValue }: any) => initialValue ?? "");
  const confirm = vi.fn(async () => true);
  const isCancel = vi.fn((v: any) => v === Symbol.for("clack:cancel"));
  return { select, multiselect, text, confirm, isCancel };
});

vi.mock("@clack/prompts", async () => {
  return {
    confirm: clackHoisted.confirm,
    isCancel: clackHoisted.isCancel,
    select: clackHoisted.select,
    multiselect: clackHoisted.multiselect,
    text: clackHoisted.text,
  };
});

const hoisted = vi.hoisted(() => {
  let calls = 0;
  const runEmbeddedPiAgent = vi.fn(async ({ prompt }: any) => {
    calls += 1;

    if (String(prompt).includes("Generate a compact questionnaire")) {
      return {
        payloads: [
          {
            text: JSON.stringify({
              goal: "demo",
              questions: [
                {
                  id: "budget",
                  section: "Constraints",
                  prompt: "Budget?",
                  kind: "select",
                  required: true,
                  options: ["$", "$$"],
                },
                {
                  id: "deadline",
                  section: "Timeline",
                  prompt: "Deadline?",
                  kind: "text",
                },
              ],
            }),
          },
        ],
      };
    }

    // Extend prompt should return one multiselect question.
    if (String(prompt).includes("propose any missing high-signal questions")) {
      return {
        payloads: [
          {
            text: JSON.stringify({
              goal: "demo",
              questions: [
                {
                  id: "transport",
                  section: "Constraints",
                  prompt: "Preferred transport?",
                  kind: "multiselect",
                  required: true,
                  options: ["Car", "Plane"],
                },
              ],
            }),
          },
        ],
      };
    }

    return {
      payloads: [{ text: JSON.stringify({ ok: true }) }],
    };
  });

  return { runEmbeddedPiAgent };
});

// llm-task extension dynamically imports embedded runner in src-first/dist-fallback form.
vi.mock("../../../src/agents/pi-embedded-runner.js", () => ({
  runEmbeddedPiAgent: hoisted.runEmbeddedPiAgent,
}));
vi.mock("../../../agents/pi-embedded-runner.js", () => ({
  runEmbeddedPiAgent: hoisted.runEmbeddedPiAgent,
}));

let testWorkspaceDir = os.tmpdir();

beforeAll(async () => {
  testWorkspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), "clawdbot-plan-"));
  await fs.writeFile(path.join(testWorkspaceDir, "AGENTS.md"), "# Agents\n", "utf-8");
});

afterAll(async () => {
  await fs.rm(testWorkspaceDir, { recursive: true, force: true });
});

function buildParams(commandBody: string, cfg: ClawdbotConfig, ctxOverrides?: Partial<MsgContext>) {
  const ctx = {
    Body: commandBody,
    CommandBody: commandBody,
    CommandSource: "cli",
    CommandAuthorized: true,
    Provider: "cli",
    Surface: "cli",
    ...ctxOverrides,
  } as MsgContext;

  const command = buildCommandContext({
    ctx,
    cfg,
    isGroup: false,
    triggerBodyNormalized: commandBody.trim().toLowerCase(),
    commandAuthorized: true,
  });

  return {
    ctx,
    cfg,
    command,
    directives: parseInlineDirectives(commandBody),
    elevated: { enabled: true, allowed: true, failures: [] },
    sessionKey: "agent:main:main",
    workspaceDir: testWorkspaceDir,
    defaultGroupActivation: () => "mention",
    resolvedVerboseLevel: "off" as const,
    resolvedReasoningLevel: "off" as const,
    resolveDefaultThinkingLevel: async () => undefined,
    provider: "cli",
    model: "test-model",
    contextTokens: 0,
    isGroup: false,
  };
}

describe("/plan TUI", () => {
  it("creates a plan directory and writes plan.md + answers.json", async () => {
    // Make TTY true for interactive mode.
    (process.stdin as any).isTTY = true;
    (process.stdout as any).isTTY = true;

    const cfg = {
      commands: { text: true },
      agents: { defaults: { model: { primary: "openai/mock-1" } } },
    } as ClawdbotConfig;

    const params = buildParams("/plan plan a trip", cfg);
    const result = await handleCommands(params);

    expect(result.shouldContinue).toBe(false);
    expect(result.reply?.text).toContain("Plan saved");

    const plansDir = path.join(testWorkspaceDir, "plans");
    const entries = await fs.readdir(plansDir, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    expect(dirs.length).toBeGreaterThan(0);

    const createdDir = path.join(plansDir, dirs[0]);
    const planMd = await fs.readFile(path.join(createdDir, "plan.md"), "utf-8");
    const answers = JSON.parse(await fs.readFile(path.join(createdDir, "answers.json"), "utf-8"));

    expect(planMd).toContain("# Plan");
    expect(Object.keys(answers).length).toBeGreaterThan(0);
  });
});
