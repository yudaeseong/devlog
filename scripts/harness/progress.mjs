// 현재 진행 상황 요약. 세션 시작 훅이 이 출력을 에이전트 컨텍스트에 넣는다.
// 사용법: npm run progress
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadFeatureList, pickNext, ROOT, summarize } from "./lib/features.mjs";

export function progressText() {
  const { features } = loadFeatureList();
  const { total, passed, byCategory } = summarize(features);
  const lines = [];

  lines.push(`# Devlog 하네스 현황`);
  lines.push(`기능 ${passed}/${total} 통과 (${Math.round((passed / total) * 100)}%)`);
  lines.push(
    Object.entries(byCategory)
      .map(([c, v]) => `${c} ${v.passed}/${v.total}`)
      .join(" · "),
  );

  const next = pickNext(features, 3);
  lines.push("", "## 다음 구현 후보 (의존 기능 충족, 배열 순서)");
  if (next.length === 0) lines.push(passed === total ? "- 모든 기능 완료!" : "- 없음: 의존 관계를 확인하세요");
  for (const f of next) lines.push(`- ${f.id} [${f.category}] ${f.title} → ${f.test}`);

  const git = spawnSync("git", ["log", "--oneline", "-5"], { cwd: ROOT, encoding: "utf8" });
  if (git.status === 0 && git.stdout.trim()) lines.push("", "## 최근 커밋", git.stdout.trim());

  const status = spawnSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" });
  if (status.status === 0 && status.stdout.trim()) {
    const changed = status.stdout.trimEnd().split(/\r?\n/);
    const shown = changed.slice(0, 15).join("\n") + (changed.length > 15 ? `\n… 외 ${changed.length - 15}개` : "");
    lines.push("", "## 커밋되지 않은 변경 (이전 세션이 중간에 끝났을 수 있음)", shown);
  }

  const progressFile = join(ROOT, "progress.md");
  if (existsSync(progressFile)) {
    const sessions = readFileSync(progressFile, "utf8").split(/\n(?=## )/);
    const last = sessions.length > 1 ? sessions.at(-1).trim() : null;
    if (last) lines.push("", "## 마지막 세션 기록 (progress.md)", last);
  }

  lines.push("", "규칙: 한 세션에 기능 하나. 절차는 /next-feature, 지도는 AGENTS.md.");
  return lines.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("progress.mjs")) {
  console.log(progressText());
}
