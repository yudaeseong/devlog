// 처음 한 번 실행하는 준비 스크립트 (Anthropic 하네스의 init.sh 역할)
// 사용법: npm run setup
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/features.mjs";
import { progressText } from "./progress.mjs";

function step(label, args) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`✗ ${label} 실패`);
    process.exit(1);
  }
}

if (!existsSync(join(ROOT, ".claude", "settings.json"))) {
  console.error("✗ 하네스 설정(.claude/)이 아직 설치되지 않았어요. 먼저 `npm run harness:install` 을 실행하세요.");
  process.exit(1);
}

step("DB 마이그레이션", [join(ROOT, "scripts", "db-migrate.mjs")]);
step("Playwright 브라우저(Chromium) 설치", [join(ROOT, "node_modules", "@playwright", "test", "cli.js"), "install", "chromium"]);
step("정적 검사와 단위 테스트", [join(ROOT, "node_modules", "vitest", "vitest.mjs"), "run"]);

console.log("\n✓ 준비 완료\n");
console.log(progressText());
console.log("\n이제 이 폴더에서 `claude` 를 실행하고 `/next-feature` 를 입력하세요.");
