// db/migrations/*.sql 파일을 이름 순서대로 한 번씩 적용한다.
// 사용법: node scripts/db-migrate.mjs [--reset]
//   --reset : DB 파일을 지우고 처음부터 다시 만든다 (E2E 테스트용)
import { createClient } from "@libsql/client";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = process.env.DATABASE_URL ?? "file:data/devlog.db";

if (url.startsWith("file:")) {
  const file = join(root, url.slice("file:".length));
  if (process.argv.includes("--reset")) {
    for (const suffix of ["", "-wal", "-shm", "-journal"]) rmSync(file + suffix, { force: true });
  }
  mkdirSync(dirname(file), { recursive: true });
}

const db = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
await db.execute(
  "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
);

const dir = join(root, "db", "migrations");
const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".sql")).sort() : [];
const applied = new Set((await db.execute("SELECT name FROM schema_migrations")).rows.map((r) => r.name));

let count = 0;
for (const file of files) {
  if (applied.has(file)) continue;
  const sql = readFileSync(join(dir, file), "utf8");
  await db.executeMultiple(sql);
  await db.execute({
    sql: "INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)",
    args: [file, new Date().toISOString()],
  });
  console.log(`[db] 적용: ${file}`);
  count++;
}
console.log(`[db] 마이그레이션 완료 (${url}, 새로 적용 ${count}개)`);
db.close();
