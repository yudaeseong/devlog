// 훅 공용 도구: stdin 의 JSON 입력 읽기, 차단 기록
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { appendLog } from "../../scripts/harness/lib/log.mjs";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export async function readInput() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

/** 행동을 막는다: 로그를 남기고 exit 2 (stderr 가 에이전트에게 전달됨) */
export function block({ hook, rule, reason, input }) {
  appendLog("hooks", {
    hook,
    action: "block",
    rule,
    tool: input.tool_name,
    agent: input.agent_type ?? "main",
    session: input.session_id,
  });
  process.stderr.write(`[하네스:${rule}] ${reason}\n`);
  process.exit(2);
}
