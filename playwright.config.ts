import { defineConfig, devices } from "@playwright/test";

// 기능마다 e2e/<기능ID>-<이름>.spec.ts 하나. 규칙은 docs/testing.md 참고.
export default defineConfig({
  testDir: "e2e",
  testIgnore: ["**/_eval/**"],
  fullyParallel: false,
  workers: 1, // SQLite 파일 하나를 공유하므로 순서대로 실행
  retries: 0, // 불안정한 테스트를 재시도로 숨기지 않는다
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    screenshot: "on", // 평가 에이전트가 test-results/의 화면을 직접 확인한다
    trace: "retain-on-failure",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
