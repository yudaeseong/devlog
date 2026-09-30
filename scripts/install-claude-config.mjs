// 하네스 설정(서브에이전트, 훅, 스킬, settings.json)을 .claude/ 폴더에 설치한다.
// 사용법: npm run harness:install
//
// 왜 필요한가: 원격 도구는 보안상 .claude/ 폴더에 직접 쓸 수 없다.
// 그래서 설정을 harness/claude-config/ 에 두고, 사람이 내용을 확인한 뒤 이 스크립트로 설치한다.
// 훅은 Claude Code가 실행할 때마다 이 컴퓨터에서 코드를 실행하므로, 설치 전에 한 번 읽어 보길 권한다.
import { cpSync, existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "harness", "claude-config");
const dest = join(root, ".claude");
const force = process.argv.includes("--force");

if (!existsSync(src)) {
  console.log(existsSync(join(dest, "settings.json")) ? "이미 설치되어 있어요 (.claude/)." : "harness/claude-config/ 폴더가 없어요.");
  process.exit(0);
}

function list(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? list(p) : [p];
  });
}

const files = list(src);
const conflicts = files.filter((f) => existsSync(join(dest, relative(src, f))));
if (conflicts.length && !force) {
  console.error("이미 있는 파일이 있어요. 덮어쓰려면 --force:\n" + conflicts.map((f) => `- .claude/${relative(src, f)}`).join("\n"));
  process.exit(1);
}

cpSync(src, dest, { recursive: true, force: true });
rmSync(src, { recursive: true, force: true });

console.log("하네스 설정을 설치했어요:");
for (const f of files) console.log(`  .claude/${relative(src, f).replace(/\\/g, "/")}`);
console.log("\n다음: git add -A && git commit -m \"harness: Claude Code 설정 설치\"");
