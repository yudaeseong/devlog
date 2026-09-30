// 기능 완료를 기록하는 유일한 방법.
// 사용법: npm run verify -- F009 [--no-regression]
//
// 1) 테스트 파일이 있고, 기능 ID를 담고, skip/only 가 없는지 확인
// 2) npm run check (타입 검사, 린트, 단위 테스트)
// 3) 이 기능의 테스트 + 이미 통과한 기능들의 테스트(회귀 검사)를 실행
// 4) 이미 통과한 기능의 테스트 파일이 바뀌지 않았는지 해시로 확인
// 5) 모두 통과하면 feature_list.json 에 passes: true 를 기록
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { hashTestFile, isReady, loadFeatureList, ROOT, runnerOf, saveFeatureList } from "./lib/features.mjs";
import { checkTestContent } from "./lib/guards.mjs";
import { appendLog } from "./lib/log.mjs";

const id = process.argv[2]?.toUpperCase();
const noRegression = process.argv.includes("--no-regression");
const started = Date.now();

const list = loadFeatureList();
const feature = list.features.find((f) => f.id === id);

function fail(stage, message) {
  appendLog("verify", { id, result: "fail", stage, duration_ms: Date.now() - started });
  console.error(`\n✗ [${id}] 검증 실패 (${stage})\n${message}\n`);
  process.exit(1);
}

function run(label, args) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: "inherit", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
  return r.status === 0;
}

const bin = {
  tsc: join(ROOT, "node_modules", "typescript", "bin", "tsc"),
  eslint: join(ROOT, "node_modules", "eslint", "bin", "eslint.js"),
  vitest: join(ROOT, "node_modules", "vitest", "vitest.mjs"),
  playwright: join(ROOT, "node_modules", "@playwright", "test", "cli.js"),
};

if (!feature) {
  console.error(`기능 ID를 찾을 수 없어요: ${process.argv[2] ?? "(없음)"}\n사용법: npm run verify -- F001`);
  process.exit(1);
}
if (!isReady(feature, list.features)) {
  fail("depends_on", `먼저 통과해야 하는 기능: ${feature.depends_on.filter((d) => !list.features.find((f) => f.id === d)?.passes).join(", ")}`);
}

// 1) 테스트 파일 검사
const testAbs = join(ROOT, feature.test);
if (!existsSync(testAbs)) fail("test-missing", `테스트 파일이 없어요: ${feature.test}\n수용 기준을 검증하는 테스트를 먼저 작성하세요.`);
const problems = checkTestContent(feature.id, readFileSync(testAbs, "utf8"));
if (problems.length) fail("test-content", problems.map((p) => `- ${p}`).join("\n"));

// 4) 통과한 기능의 테스트가 바뀌지 않았는지 (셸로 수정하는 우회까지 잡는다)
const tampered = list.features.filter((f) => f.passes && f.test_sha256 && hashTestFile(f.test) !== f.test_sha256);
if (tampered.length) fail("test-tampered", `이미 통과한 기능의 테스트가 바뀌었어요: ${tampered.map((f) => `${f.id}(${f.test})`).join(", ")}\n원래대로 되돌리세요 (git checkout -- <파일>).`);

// 2) 정적 검사 + 단위 테스트
if (!run("타입 검사", [bin.tsc, "--noEmit"])) fail("typecheck", "타입 오류를 고치세요.");
if (!run("린트", [bin.eslint, "."])) fail("lint", "린트 오류를 고치세요.");
if (!run("단위 테스트", [bin.vitest, "run"])) fail("unit", "단위 테스트가 실패했어요.");

// 3) 이 기능 + 회귀 테스트
const regression = noRegression ? [] : list.features.filter((f) => f.passes && f.id !== feature.id);
const targets = [feature, ...regression];
const e2eFiles = targets.filter((f) => runnerOf(f.test) === "playwright").map((f) => f.test);
if (e2eFiles.length && !run(`E2E 테스트 (${e2eFiles.length}개 파일, 회귀 포함)`, [bin.playwright, "test", ...e2eFiles])) {
  fail("e2e", "E2E 테스트가 실패했어요. test-results/ 의 스크린샷과 trace를 확인하세요.");
}

// 5) 기록
const now = new Date().toISOString();
Object.assign(feature, { passes: true, verified_at: now, test_sha256: hashTestFile(feature.test) });
saveFeatureList(list);
appendLog("verify", { id, result: "pass", regression: regression.length, duration_ms: Date.now() - started });

const passed = list.features.filter((f) => f.passes).length;
console.log(`\n✓ [${id}] ${feature.title} 통과 — 전체 ${passed}/${list.features.length}`);
console.log("다음: progress.md 에 세션 기록을 남기고 커밋하세요.");
