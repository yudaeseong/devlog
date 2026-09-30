// PreToolUse (Edit|Write|MultiEdit|NotebookEdit)
// 보호 파일 수정, 통과한 테스트 수정, 역할 밖 수정을 막는다.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadFeatureList } from "../../scripts/harness/lib/features.mjs";
import { checkFileEdit, toRelative } from "../../scripts/harness/lib/guards.mjs";
import { block, readInput, ROOT } from "./lib.mjs";

const input = await readInput();
const filePath = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
if (!filePath) process.exit(0);

const relPath = toRelative(filePath, process.env.CLAUDE_PROJECT_DIR ?? ROOT);
if (relPath === null) process.exit(0); // 프로젝트 밖 파일은 이 훅의 관심 밖

const verdict = checkFileEdit({
  maintenance: process.env.HARNESS_MAINTENANCE === "1",
  relPath,
  agentType: input.agent_type,
  features: loadFeatureList().features,
  fileExists: existsSync(join(ROOT, relPath)),
});

if (!verdict.allow) block({ hook: "guard-files", rule: verdict.rule, reason: verdict.reason, input });
process.exit(0);
