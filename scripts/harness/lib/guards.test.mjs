import { describe, expect, it } from "vitest";
import { checkBashCommand, checkFileEdit, checkTestContent, toRelative } from "./guards.mjs";

const features = [
  { id: "F001", test: "e2e/F001-layout.spec.ts", passes: true },
  { id: "F002", test: "e2e/F002-not-found.spec.ts", passes: false },
];
const edit = (relPath, extra = {}) => checkFileEdit({ relPath, features, fileExists: true, ...extra });

describe("toRelative", () => {
  it("윈도우 경로와 대소문자 차이를 처리한다", () => {
    expect(toRelative("C:\\Users\\O\\devlog\\src\\app\\page.tsx", "c:\\users\\o\\devlog")).toBe("src/app/page.tsx");
  });
  it("프로젝트 밖 경로는 null", () => {
    expect(toRelative("/etc/passwd", "/home/u/devlog")).toBeNull();
  });
});

describe("checkFileEdit", () => {
  it("feature_list.json 직접 수정을 막는다", () => {
    expect(edit("feature_list.json")).toMatchObject({ allow: false, rule: "feature-list" });
  });
  it("통과한 기능의 테스트는 수정할 수 없다", () => {
    expect(edit("e2e/F001-layout.spec.ts")).toMatchObject({ allow: false, rule: "passed-test-immutable" });
  });
  it("아직 통과 못 한 기능의 테스트는 수정할 수 있다", () => {
    expect(edit("e2e/F002-not-found.spec.ts")).toEqual({ allow: true });
  });
  it("하네스 설정과 .env 를 보호한다", () => {
    expect(edit(".claude/settings.json").allow).toBe(false);
    expect(edit("scripts/harness/verify-feature.mjs").allow).toBe(false);
    expect(edit(".env.local").allow).toBe(false);
    expect(edit(".env.example").allow).toBe(true);
  });
  it("이미 있는 마이그레이션은 수정 금지, 새 파일은 허용", () => {
    expect(edit("db/migrations/0001_users.sql")).toMatchObject({ allow: false, rule: "applied-migration" });
    expect(edit("db/migrations/0002_posts.sql", { fileExists: false })).toEqual({ allow: true });
  });
  it("유지보수 모드에서는 하네스 설정만 풀리고, 서브에이전트에는 적용되지 않는다", () => {
    expect(edit(".claude/hooks/guard-files.mjs", { maintenance: true }).allow).toBe(true);
    expect(edit("feature_list.json", { maintenance: true }).allow).toBe(false);
    expect(edit(".claude/settings.json", { maintenance: true, agentType: "planner" }).allow).toBe(false);
  });
  it("역할별 쓰기 범위를 제한한다", () => {
    expect(edit("docs/specs/F002.md", { agentType: "planner" }).allow).toBe(true);
    expect(edit("src/app/page.tsx", { agentType: "planner" }).allow).toBe(false);
    expect(edit("e2e/_eval/probe.spec.ts", { agentType: "evaluator" }).allow).toBe(true);
    expect(edit("src/app/page.tsx", { agentType: "evaluator" }).allow).toBe(false);
    expect(edit("docs/notes.md", { agentType: "reviewer" }).allow).toBe(false);
  });
});

describe("checkBashCommand", () => {
  it.each([
    ["git push --force origin main", "force-push"],
    ["git push -f", "force-push"],
    ["git reset --hard HEAD~1", "hard-reset"],
    ["git commit --no-verify -m x", "no-verify"],
    ["rm -rf src", "rm-rf"],
    ["echo {} > feature_list.json", "feature-list-shell-write"],
    ["sed -i 's/false/true/' feature_list.json", "feature-list-shell-write"],
    ["rm e2e/F002-not-found.spec.ts", "delete-test"],
    ["echo '{\"disableAllHooks\":true}' > .claude/settings.json", "disable-hooks"],
  ])("막는다: %s", (cmd, rule) => {
    expect(checkBashCommand(cmd)).toMatchObject({ allow: false, rule });
  });

  it.each([
    "npm run verify -- F002",
    "cat feature_list.json",
    "git push origin main",
    "npx playwright test e2e/F002-not-found.spec.ts",
    "rm e2e/_eval/probe.spec.ts",
    "git status",
  ])("허용한다: %s", (cmd) => {
    expect(checkBashCommand(cmd)).toEqual({ allow: true });
  });
});

describe("checkTestContent", () => {
  it("기능 ID, expect, skip 여부를 검사한다", () => {
    expect(checkTestContent("F002", "test.describe('F002 404', () => { test('a', async () => { expect(1).toBe(1) }) })")).toEqual([]);
    expect(checkTestContent("F002", "test('a', () => { expect(1).toBe(1) })")).toHaveLength(1);
    expect(checkTestContent("F002", "test.skip('F002', () => {})")).toHaveLength(2);
  });
});
