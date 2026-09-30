// 하네스 로그(JSON Lines). 측정(metrics.mjs)의 원천 데이터가 된다.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./features.mjs";

const DIR = join(ROOT, "harness", "logs");

export function appendLog(name, entry) {
  mkdirSync(DIR, { recursive: true });
  appendFileSync(join(DIR, `${name}.jsonl`), JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n");
}

export function readLog(name) {
  const file = join(DIR, `${name}.jsonl`);
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
