// Playwright가 E2E 테스트 전에 실행하는 서버.
// 1) 테스트 전용 DB(data/e2e.db)를 초기화하고
// 2) 프로덕션 빌드 후 3100번 포트로 실행한다.
// 개발 서버(npm run dev)와 동시에 켜져 있어도 충돌하지 않는다. (next dev는 .next/dev를 사용)
import { spawn, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env, DATABASE_URL: "file:data/e2e.db", NEXT_TELEMETRY_DISABLED: "1" };
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");

function run(args) {
  const r = spawnSync(process.execPath, args, { cwd: root, env, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run([join(root, "scripts", "db-migrate.mjs"), "--reset"]);
if (process.env.E2E_SKIP_BUILD !== "1") run([nextBin, "build"]);

const server = spawn(process.execPath, [nextBin, "start", "-p", "3100"], { cwd: root, env, stdio: "inherit" });
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => server.kill(sig));
server.on("exit", (code) => process.exit(code ?? 0));
