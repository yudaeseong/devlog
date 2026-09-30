// feature_list.json 을 읽고 다루는 공용 함수들
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const FEATURE_FILE = join(ROOT, "feature_list.json");

export function loadFeatureList() {
  return JSON.parse(readFileSync(FEATURE_FILE, "utf8"));
}

export function saveFeatureList(list) {
  writeFileSync(FEATURE_FILE, JSON.stringify(list, null, 2) + "\n");
}

/** 의존 기능이 모두 통과했는지 */
export function isReady(feature, features) {
  return feature.depends_on.every((id) => features.find((f) => f.id === id)?.passes);
}

/** 다음에 구현할 기능: 배열 순서대로, 아직 통과 못 했고 의존 기능이 모두 통과한 것 */
export function pickNext(features, count = 1) {
  return features.filter((f) => !f.passes && isReady(f, features)).slice(0, count);
}

/** 줄바꿈 차이(CRLF/LF)에 영향받지 않는 테스트 파일 해시 */
export function hashTestFile(relPath) {
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) return null;
  const text = readFileSync(abs, "utf8").replace(/\r\n/g, "\n");
  return createHash("sha256").update(text).digest("hex");
}

/** 테스트 러너 종류: src/ 아래 .test.ts 는 vitest, 나머지(e2e/)는 playwright */
export function runnerOf(testPath) {
  return /\.test\.(ts|mjs)$/.test(testPath) ? "vitest" : "playwright";
}

export function summarize(features) {
  const total = features.length;
  const passed = features.filter((f) => f.passes).length;
  const byCategory = {};
  for (const f of features) {
    byCategory[f.category] ??= { passed: 0, total: 0 };
    byCategory[f.category].total++;
    if (f.passes) byCategory[f.category].passed++;
  }
  return { total, passed, byCategory };
}
