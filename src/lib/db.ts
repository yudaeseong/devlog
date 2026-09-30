import { createClient, type Client } from "@libsql/client";

// 모든 DB 접근은 이 모듈을 거친다. (docs/architecture.md 참고)
// - 개발: file:data/devlog.db
// - E2E 테스트: file:data/e2e.db (scripts/e2e-server.mjs가 매번 초기화)
// - 배포: DATABASE_URL에 Turso 주소 (추후)

let client: Client | undefined;

export function getDb(): Client {
  if (!client) {
    client = createClient({
      url: process.env.DATABASE_URL ?? "file:data/devlog.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return client;
}
