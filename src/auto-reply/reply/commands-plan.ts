import fs from "node:fs/promises";
import path from "node:path";

import { confirm, isCancel, select, text, multiselect } from "@clack/prompts";

import type { ClawdbotPluginApi } from "../../plugins/types.js";
import type { CommandHandler } from "./commands-types.js";

// We import the llm-task tool directly (Clawdbot-native) so standalone TUI runs can
// still use the agent's configured models via the embedded runner.
import { createLlmTaskTool } from "../../../extensions/llm-task/src/llm-task-tool.js";

type QuestionKind = "text" | "select" | "multiselect" | "confirm";

export type QuestionSpec = {
  id: string;
  section: string;
  prompt: string;
  kind: QuestionKind;
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

type QuestionSet = {
  title?: string;
  goal: string;
  questions: QuestionSpec[];
};

const QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    goal: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          section: { type: "string" },
          prompt: { type: "string" },
          kind: { type: "string", enum: ["text", "select", "multiselect", "confirm"] },
          required: { type: "boolean" },
          options: { type: "array", items: { type: "string" } },
          placeholder: { type: "string" },
        },
        required: ["id", "section", "prompt", "kind"],
        additionalProperties: false,
      },
    },
  },
  required: ["goal", "questions"],
  additionalProperties: false,
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function nowStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(
    d.getMinutes(),
  )}`;
}

async function safeReadJson(filePath: string): Promise<any | null> {
  try {
    const text = await fs.readFile(filePath, "utf-8");
    return JSON.parse(text);
  } catch (err: any) {
    if (err?.code === "ENOENT") return null;
    return null;
  }
}

async function writeJson(filePath: string, value: any) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf-8");
}

async function writeTextFile(filePath: string, textContent: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, textContent, "utf-8");
}

function buildLlmQuestionPrompt(goal: string) {
  return (
    `You are helping a user plan a project. Generate a compact questionnaire grouped into sections.\n` +
    `Return JSON matching the provided schema.\n\n` +
    `Requirements:\n` +
    `- Ask only high-signal questions. Prefer multiple choice when the user can pick from common options.\n` +
    `- Use sections like Goals, Constraints, Inputs, Outputs, Timeline, Risks (as appropriate).\n` +
    `- Keep it to ~8-15 questions unless the goal clearly needs more.\n` +
    `- Use stable ids (snake_case).\n` +
    `- Use multiselect when multiple options may apply.\n\n` +
    `GOAL:\n${goal}`
  );
}

function buildLlmExtendPrompt(goal: string) {
  return (
    `You are helping a user plan a project.\n` +
    `Given the current answers and existing question ids, propose any missing high-signal questions.\n` +
    `Return JSON matching the provided schema.\n\n` +
    `Rules:\n` +
    `- If nothing important is missing, return {"goal": <same>, "questions": []}.\n` +
    `- Do not repeat existing question ids.\n` +
    `- Keep it short: up to 5 additional questions.\n\n` +
    `GOAL:\n${goal}`
  );
}

function buildPlanMarkdown(goal: string, answers: Record<string, any>, questions: QuestionSpec[]) {
  const byId = new Map(questions.map((q) => [q.id, q] as const));
  const sections = new Map<string, Array<{ q: QuestionSpec; a: any }>>();
  for (const [id, a] of Object.entries(answers)) {
    const q = byId.get(id);
    if (!q) continue;
    const list = sections.get(q.section) ?? [];
    list.push({ q, a });
    sections.set(q.section, list);
  }

  const lines: string[] = [];
  lines.push(`# Plan\n\n## Goal\n${goal}\n`);
  for (const [section, items] of sections) {
    lines.push(`## ${section}`);
    for (const { q, a } of items) {
      const rendered = Array.isArray(a)
        ? a.join(", ")
        : typeof a === "boolean"
          ? a
            ? "yes"
            : "no"
          : String(a);
      lines.push(`- **${q.prompt}**: ${rendered}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}

function createFakePluginApi(cfg: any, workspaceDir: string): ClawdbotPluginApi {
  // Minimal stub for llm-task tool; it only relies on `config` and `pluginConfig`.
  return {
    id: "local",
    name: "local",
    source: "internal",
    config: cfg,
    pluginConfig: {},
    runtime: {} as any,
    logger: {
      info() {},
      warn() {},
      error() {},
      debug() {},
    },
    registerTool() {},
    registerHook() {},
    registerHttpHandler() {},
    registerChannel() {},
    registerGatewayMethod() {},
    registerCli() {},
    registerService() {},
    registerProvider() {},
    registerCommand() {},
    resolvePath: (input: string) => path.resolve(workspaceDir, input),
    on() {},
  } as any;
}

export const handlePlanCommand: CommandHandler = async (params, allowTextCommands) => {
  if (!allowTextCommands) return null;

  if (!params.command.commandBodyNormalized.startsWith("/plan")) return null;

  // Only implement interactive plan builder in the local CLI.
  const isInteractiveCli =
    params.ctx.CommandSource === "cli" &&
    Boolean(process.stdin.isTTY) &&
    Boolean(process.stdout.isTTY);
  if (!isInteractiveCli) return null;

  const raw =
    params.ctx.BodyForCommands ??
    params.ctx.CommandBody ??
    params.ctx.RawBody ??
    params.ctx.BodyStripped ??
    params.ctx.Body ??
    "/plan";

  const goal = raw.replace(/^\s*\/plan\s*/i, "").trim();
  if (!goal) {
    return {
      shouldContinue: false,
      reply: { text: "Usage: /plan <goal>" },
    };
  }

  const defaultName = `${nowStamp()}-${slugify(goal.split(/\s+/).slice(0, 6).join(" ")) || "plan"}`;
  const chosenName = await text({
    message: "Plan name (folder under workspace/plans/)",
    initialValue: defaultName,
    validate: (v) => (!v?.trim() ? "Name required" : undefined),
  });
  if (isCancel(chosenName)) {
    return { shouldContinue: false, reply: { text: "Cancelled." } };
  }

  const planName = slugify(String(chosenName).trim()) || defaultName;
  const plansDir = path.join(params.workspaceDir, "plans");
  const planDir = path.join(plansDir, planName);
  await fs.mkdir(planDir, { recursive: true });

  const metaPath = path.join(planDir, "meta.json");
  const answersPath = path.join(planDir, "answers.json");
  const planMdPath = path.join(planDir, "plan.md");

  const existingAnswers = (await safeReadJson(answersPath)) ?? {};

  await writeJson(metaPath, {
    name: planName,
    goal,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Ask the LLM to generate the question set.
  const api = createFakePluginApi(params.cfg, params.workspaceDir);
  const tool = createLlmTaskTool(api);

  const llmResult = await tool.execute("llm-task", {
    prompt: buildLlmQuestionPrompt(goal),
    input: { goal, existingAnswers },
    schema: QUESTIONS_SCHEMA,
  });

  const questionSet = (llmResult as any).details?.json as QuestionSet;
  const questions: QuestionSpec[] = Array.isArray(questionSet?.questions)
    ? questionSet.questions
    : [];
  if (questions.length === 0) {
    return {
      shouldContinue: false,
      reply: { text: "No questions generated (unexpected)." },
    };
  }

  const questionsPath = path.join(planDir, "questions.json");
  await writeJson(questionsPath, { goal, questions });

  // Group by section.
  const sectionOrder: string[] = [];
  const bySection = new Map<string, QuestionSpec[]>();
  for (const q of questions) {
    const section = q.section?.trim() || "General";
    if (!bySection.has(section)) sectionOrder.push(section);
    const list = bySection.get(section) ?? [];
    list.push(q);
    bySection.set(section, list);
  }

  const answers: Record<string, any> = { ...existingAnswers };

  // Iterate sections with a review loop.
  while (true) {
    const section = await select({
      message: "Choose a section",
      options: [
        ...sectionOrder.map((s) => ({ label: s, value: s })),
        { label: "Review + finalize", value: "__review" },
      ],
    });
    if (isCancel(section)) {
      return { shouldContinue: false, reply: { text: "Cancelled." } };
    }

    if (section === "__review") break;

    const qs = bySection.get(String(section)) ?? [];
    for (const q of qs) {
      const existing = answers[q.id];
      const required = Boolean(q.required);

      if (q.kind === "confirm") {
        const res = await confirm({ message: q.prompt, initialValue: Boolean(existing ?? false) });
        if (isCancel(res)) return { shouldContinue: false, reply: { text: "Cancelled." } };
        answers[q.id] = Boolean(res);
      } else if (q.kind === "select") {
        const opts = (q.options ?? []).map((o) => ({ label: o, value: o }));
        if (opts.length === 0) {
          const res = await text({
            message: q.prompt,
            initialValue: existing ? String(existing) : "",
          });
          if (isCancel(res)) return { shouldContinue: false, reply: { text: "Cancelled." } };
          const v = String(res).trim();
          if (required && !v)
            return { shouldContinue: false, reply: { text: `Missing required answer: ${q.id}` } };
          answers[q.id] = v;
        } else {
          const res = await select({ message: q.prompt, options: opts });
          if (isCancel(res)) return { shouldContinue: false, reply: { text: "Cancelled." } };
          answers[q.id] = res;
        }
      } else if (q.kind === "multiselect") {
        const opts = (q.options ?? []).map((o) => ({ label: o, value: o }));
        if (opts.length === 0) {
          const res = await text({
            message: q.prompt,
            initialValue: Array.isArray(existing) ? existing.join(", ") : "",
            placeholder: q.placeholder,
          });
          if (isCancel(res)) return { shouldContinue: false, reply: { text: "Cancelled." } };
          const arr = String(res)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          if (required && arr.length === 0) {
            return { shouldContinue: false, reply: { text: `Missing required answer: ${q.id}` } };
          }
          answers[q.id] = arr;
        } else {
          const res = await multiselect({
            message: q.prompt,
            options: opts,
            required: required ? true : false,
          } as any);
          if (isCancel(res)) return { shouldContinue: false, reply: { text: "Cancelled." } };
          const arr = Array.isArray(res) ? res : [];
          if (required && arr.length === 0) {
            return { shouldContinue: false, reply: { text: `Missing required answer: ${q.id}` } };
          }
          answers[q.id] = arr;
        }
      } else {
        const res = await text({
          message: q.prompt,
          initialValue: existing ? String(existing) : "",
          placeholder: q.placeholder,
        });
        if (isCancel(res)) return { shouldContinue: false, reply: { text: "Cancelled." } };
        const v = String(res).trim();
        if (required && !v) {
          return { shouldContinue: false, reply: { text: `Missing required answer: ${q.id}` } };
        }
        answers[q.id] = v;
      }

      await writeJson(answersPath, answers);
    }
  }

  // One-time dynamic extension at the end.
  const existingIds = new Set(questions.map((q) => q.id));
  const extend = await tool.execute("llm-task", {
    prompt: buildLlmExtendPrompt(goal),
    input: {
      goal,
      answers,
      existingQuestionIds: Array.from(existingIds),
    },
    schema: QUESTIONS_SCHEMA,
  });

  const extendSet = (extend as any).details?.json as QuestionSet;
  const extraQuestions: QuestionSpec[] = Array.isArray(extendSet?.questions)
    ? extendSet.questions
    : [];
  const filteredExtras = extraQuestions.filter((q) => q && q.id && !existingIds.has(q.id));

  if (filteredExtras.length > 0) {
    const ok = await confirm({
      message: `I have ${filteredExtras.length} more question(s) to tighten the plan. Add them?`,
    });
    if (!isCancel(ok) && ok === true) {
      for (const q of filteredExtras) {
        const section = q.section?.trim() || "General";
        if (!bySection.has(section)) {
          sectionOrder.push(section);
          bySection.set(section, []);
        }
        bySection.get(section)!.push(q);
        questions.push(q);
        existingIds.add(q.id);
      }

      // Ask only the newly added questions (once).
      for (const q of filteredExtras) {
        const existing = answers[q.id];
        const required = Boolean(q.required);

        if (q.kind === "confirm") {
          const res = await confirm({
            message: q.prompt,
            initialValue: Boolean(existing ?? false),
          });
          if (isCancel(res)) return { shouldContinue: false, reply: { text: "Cancelled." } };
          answers[q.id] = Boolean(res);
        } else if (q.kind === "select") {
          const opts = (q.options ?? []).map((o) => ({ label: o, value: o }));
          if (opts.length === 0) {
            const res = await text({
              message: q.prompt,
              initialValue: existing ? String(existing) : "",
            });
            if (isCancel(res)) return { shouldContinue: false, reply: { text: "Cancelled." } };
            const v = String(res).trim();
            if (required && !v)
              return { shouldContinue: false, reply: { text: `Missing required answer: ${q.id}` } };
            answers[q.id] = v;
          } else {
            const res = await select({ message: q.prompt, options: opts });
            if (isCancel(res)) return { shouldContinue: false, reply: { text: "Cancelled." } };
            answers[q.id] = res;
          }
        } else if (q.kind === "multiselect") {
          const opts = (q.options ?? []).map((o) => ({ label: o, value: o }));
          if (opts.length === 0) {
            const res = await text({
              message: q.prompt,
              initialValue: Array.isArray(existing) ? existing.join(", ") : "",
            });
            if (isCancel(res)) return { shouldContinue: false, reply: { text: "Cancelled." } };
            const arr = String(res)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            if (required && arr.length === 0)
              return { shouldContinue: false, reply: { text: `Missing required answer: ${q.id}` } };
            answers[q.id] = arr;
          } else {
            const res = await multiselect({
              message: q.prompt,
              options: opts,
              required: required ? true : false,
            } as any);
            if (isCancel(res)) return { shouldContinue: false, reply: { text: "Cancelled." } };
            const arr = Array.isArray(res) ? res : [];
            if (required && arr.length === 0)
              return { shouldContinue: false, reply: { text: `Missing required answer: ${q.id}` } };
            answers[q.id] = arr;
          }
        } else {
          const res = await text({
            message: q.prompt,
            initialValue: existing ? String(existing) : "",
          });
          if (isCancel(res)) return { shouldContinue: false, reply: { text: "Cancelled." } };
          const v = String(res).trim();
          if (required && !v)
            return { shouldContinue: false, reply: { text: `Missing required answer: ${q.id}` } };
          answers[q.id] = v;
        }

        await writeJson(answersPath, answers);
      }

      await writeJson(questionsPath, { goal, questions });
    }
  }

  const md = buildPlanMarkdown(goal, answers, questions);
  await writeTextFile(planMdPath, md);
  await writeJson(metaPath, {
    name: planName,
    goal,
    createdAt: (await safeReadJson(metaPath))?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return {
    shouldContinue: false,
    reply: {
      text:
        `✅ Plan saved: ${planName}\n` +
        `- ${path.relative(params.workspaceDir, planMdPath)}\n` +
        `- ${path.relative(params.workspaceDir, answersPath)}\n\n` +
        `Use /plans show ${planName} to view it.`,
    },
  };
};
