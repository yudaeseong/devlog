// 하네스 성과 측정. 포트폴리오 README 의 수치가 여기서 나온다.
// 사용법: npm run metrics            (표 출력)
//         npm run metrics -- --readme (README.md 의 METRICS 구역 갱신)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadFeatureList, ROOT, summarize } from "./lib/features.mjs";
import { readLog } from "./lib/log.mjs";

export function computeMetrics() {
  const { features } = loadFeatureList();
  const { total, passed } = summarize(features);
  const verify = readLog("verify");
  const hooks = readLog("hooks");

  // 기능별 검증 시도 횟수 (통과할 때까지)
  const attempts = {};
  const firstTry = new Set();
  for (const e of verify) {
    if (!e.id) continue;
    attempts[e.id] ??= 0;
    if (attempts[e.id] === -1) continue; // 이미 통과
    attempts[e.id]++;
    if (e.result === "pass") {
      if (attempts[e.id] === 1) firstTry.add(e.id);
      attempts[e.id] = -1;
    }
  }
  const passedIds = features.filter((f) => f.passes).map((f) => f.id);
  const tries = verify.filter((e) => passedIds.includes(e.id));
  const failStages = {};
  for (const e of verify.filter((v) => v.result === "fail")) failStages[e.stage] = (failStages[e.stage] ?? 0) + 1;

  const blocksByRule = {};
  for (const h of hooks.filter((x) => x.action === "block")) blocksByRule[h.rule] = (blocksByRule[h.rule] ?? 0) + 1;

  const logFile = join(ROOT, "harness", "harness-log.md");
  const ratchetRules = existsSync(logFile) ? (readFileSync(logFile, "utf8").match(/^\| H\d{3} /gm) ?? []).length : 0;
  const progressFile = join(ROOT, "progress.md");
  const sessions = existsSync(progressFile) ? (readFileSync(progressFile, "utf8").match(/^## 세션/gm) ?? []).length : 0;

  return {
    total,
    passed,
    sessions,
    verifyRuns: verify.length,
    firstTryRate: passedIds.length ? Math.round((firstTry.size / passedIds.length) * 100) : null,
    avgAttempts: passedIds.length ? Math.round((tries.length / passedIds.length) * 10) / 10 : null,
    failStages,
    hookBlocks: hooks.filter((x) => x.action === "block").length,
    blocksByRule,
    stopGateBlocks: blocksByRule["stop-gate"] ?? 0,
    ratchetRules,
  };
}

export function metricsMarkdown(m) {
  const fmt = (o) => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(", ") || "-";
  return [
    "| 지표 | 값 |",
    "| --- | --- |",
    `| 완료 기능 | ${m.passed} / ${m.total} |`,
    `| 에이전트 세션 수 | ${m.sessions} |`,
    `| 검증 실행 횟수 | ${m.verifyRuns} |`,
    `| 첫 검증에 통과한 비율 | ${m.firstTryRate ?? "-"}% |`,
    `| 기능당 평균 검증 시도 | ${m.avgAttempts ?? "-"}회 |`,
    `| 검증 실패 단계 | ${fmt(m.failStages)} |`,
    `| 훅이 막은 행동 | ${m.hookBlocks}회 (${fmt(m.blocksByRule)}) |`,
    `| 실패에서 추가된 하네스 규칙 | ${m.ratchetRules}개 |`,
  ].join("\n");
}

const isMain = process.argv[1]?.endsWith("metrics.mjs");
if (isMain) {
  const md = metricsMarkdown(computeMetrics());
  console.log(md);
  if (process.argv.includes("--readme")) {
    const readme = join(ROOT, "README.md");
    const text = readFileSync(readme, "utf8");
    const updated = text.replace(
      /<!-- METRICS:START -->[\s\S]*<!-- METRICS:END -->/,
      `<!-- METRICS:START -->\n${md}\n\n_갱신: ${new Date().toISOString().slice(0, 10)} · \`npm run metrics -- --readme\`_\n<!-- METRICS:END -->`,
    );
    writeFileSync(readme, updated);
    console.log("\nREADME.md 지표를 갱신했어요.");
  }
}
