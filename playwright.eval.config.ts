import base from "./playwright.config";
import { defineConfig } from "@playwright/test";

// 평가 에이전트 전용: e2e/_eval/ 의 탐색용 테스트만 실행한다. (커밋되지 않음)
export default defineConfig({
  ...base,
  testDir: "e2e/_eval",
  testIgnore: [],
  outputDir: "test-results/_eval",
});
