// Stop
// 에이전트가 작업을 끝내려 할 때, 코드가 바뀌었으면 타입 검사·린트·단위 테스트를 돌린다.
// 실패하면 종료를 막고 오류를 돌려준다. ("다 했어요"라고 말하고 깨진 코드를 남기는 것을 방지)
// 무한 반복을 막기 위해 한 세션에서 연속 3번까지만 막는다.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readInput, ROOT } from "./lib.mjs";
import { appendLog } from "../../scripts/harness/lib/log.mjs";

const MAX_CONSECUTIVE_BLOCKS = 3;
const input = await readInput();
const counterFile = join(tmpdir(), `devlog-stop-gate-${input.session_id ?? "unknown"}.txt`);

const status = spawnSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" });
const changed = (status.stdout ?? "")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.slice(3).replace(/"/g, ""))
  .filter((p) => /^(src|e2e|db|scripts)\//.test(p) && !p.startsWith("e2e/_eval/"));

if (changed.length === 0) {
  rmSync(counterFile, { force: true });
  process.exit(0);
}

const node = (args) => spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
const checks = [
  ["타입 검사", [join(ROOT, "node_modules", "typescript", "bin", "tsc"), "--noEmit", "--pretty", "false"]],
  ["린트", [join(ROOT, "node_modules", "eslint", "bin", "eslint.js"), "."]],
  ["단위 테스트", [join(ROOT, "node_modules", "vitest", "vitest.mjs"), "run", "--reporter", "dot"]],
];

for (const [label, args] of checks) {
  const r = node(args);
  if (r.status !== 0) {
    const count = existsSync(counterFile) ? Number(readFileSync(counterFile, "utf8")) + 1 : 1;
    writeFileSync(counterFile, String(count));
    if (count > MAX_CONSECUTIVE_BLOCKS) {
      appendLog("hooks", { hook: "stop-gate", action: "gave-up", rule: "stop-gate", session: input.session_id });
      console.log(JSON.stringify({ systemMessage: `⚠ 하네스: ${label} 단계가 ${MAX_CONSECUTIVE_BLOCKS}번 연속 실패해 종료를 허용했어요. 사람이 확인해 주세요.` }));
      rmSync(counterFile, { force: true });
      process.exit(0);
    }
    appendLog("hooks", { hook: "stop-gate", action: "block", rule: "stop-gate", check: label, session: input.session_id });
    const output = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim().split(/\r?\n/).slice(-30).join("\n");
    console.log(
      JSON.stringify({
        decision: "block",
        reason: `[하네스:stop-gate] 코드가 바뀌었는데 ${label} 단계가 실패해서 아직 끝낼 수 없어요 (${count}/${MAX_CONSECUTIVE_BLOCKS}). 고친 뒤 다시 마무리하세요.\n\n${output}`,
      }),
    );
    process.exit(0);
  }
}

rmSync(counterFile, { force: true });
process.exit(0);
