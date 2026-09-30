// PostToolUse (Edit|Write|MultiEdit)
// 코드 파일을 고친 직후 그 파일만 ESLint로 검사해, 오류를 즉시 에이전트에게 돌려준다.
// (전체 타입 검사는 느려서 종료 게이트(stop-gate)에서 한다)
import { createRequire } from "node:module";
import { join } from "node:path";
import { toRelative } from "../../scripts/harness/lib/guards.mjs";
import { readInput, ROOT } from "./lib.mjs";
import { appendLog } from "../../scripts/harness/lib/log.mjs";

const input = await readInput();
const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

const relPath = toRelative(filePath, process.env.CLAUDE_PROJECT_DIR ?? ROOT);
if (!relPath || !/\.(ts|tsx|js|jsx|mjs)$/.test(relPath) || relPath.startsWith("e2e/_eval/")) process.exit(0);

const require = createRequire(join(ROOT, "package.json"));
const { ESLint } = require("eslint");
const eslint = new ESLint({ cwd: ROOT });
if (await eslint.isPathIgnored(join(ROOT, relPath))) process.exit(0);

const results = await eslint.lintFiles([join(ROOT, relPath)]);
const errors = results.flatMap((r) => r.messages.filter((m) => m.severity === 2));
if (errors.length === 0) process.exit(0);

appendLog("hooks", { hook: "lint-on-edit", action: "feedback", rule: "eslint", count: errors.length, session: input.session_id });
const detail = errors
  .slice(0, 10)
  .map((m) => `- ${relPath}:${m.line}:${m.column} ${m.message} (${m.ruleId ?? "parse"})`)
  .join("\n");

// PostToolUse 에서 decision: block 은 수정을 되돌리지 않고, 이유를 에이전트에게 전달한다.
console.log(
  JSON.stringify({
    decision: "block",
    reason: `[하네스:lint] 방금 수정한 파일에 ESLint 오류가 ${errors.length}개 있어요. 바로 고치세요.\n${detail}`,
  }),
);
process.exit(0);
