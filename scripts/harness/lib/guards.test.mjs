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

  // H002: '>' 가 있기만 하면 feature_list.json 쓰기로 오탐했다. 실제 쓰기 대상만 막는다.
  describe("feature-list-shell-write (H002)", () => {
    it.each([
      "cat feature_list.json 2>&1 | head",
      "cat feature_list.json 2>/dev/null",
      "node -e \"const f = require('./feature_list.json'); console.log(f.features.length)\" 2>/dev/null",
      "node -e \"console.log(require('./feature_list.json').features.filter(f => f.passes).length > 0)\"",
      "grep '\"passes\": true' feature_list.json > /tmp/passed.txt",
      "jq '.features[] | select(.passes)' feature_list.json > out.json",
      "cp feature_list.json /tmp/backup.json",
      "cat > docs/notes.md <<'EOF'\nfeature_list.json 은 verify 만 고친다 > 직접 수정 금지\nEOF",
      "cat <<EOF > progress.md\n- feature_list.json 확인\nEOF\ngit status",
      "npm run verify -- F002 > verify.log 2>&1",
      "git diff feature_list.json | tee /tmp/diff.txt",
    ])("허용한다: %s", (cmd) => {
      expect(checkBashCommand(cmd)).toEqual({ allow: true });
    });

    it.each([
      "echo {} > feature_list.json",
      "echo {} >> ./feature_list.json",
      "jq '.features[0].passes = true' feature_list.json > tmp.json && mv tmp.json feature_list.json",
      "cat x.json > \"feature_list.json\"",
      "echo {} &> feature_list.json",
      "echo {} >| feature_list.json",
      "echo {} 2>&1 >feature_list.json",
      "cat x.json | tee feature_list.json",
      "cat x.json | tee -a /c/Users/O/devlog/feature_list.json",
      "sed -i 's/false/true/' feature_list.json",
      "sed -i.bak -e 's/false/true/' feature_list.json",
      "perl -pi -e 's/false/true/' feature_list.json",
      "mv feature_list.json old.json",
      "cp /tmp/x.json feature_list.json",
      "cp /tmp/feature_list.json .",
      "rm feature_list.json",
      "F=feature_list.json; echo {} > $F",
      "node -e \"require('fs').writeFileSync('feature_list.json', '{}')\"",
      "node <<'EOF'\nconst fs = require('fs');\nfs.writeFileSync('feature_list.json', '{}');\nEOF",
      "python -c \"open('feature_list.json', 'w').write('{}')\"",
      "echo \"a\\\" > b\" > feature_list.json",
    ])("막는다: %s", (cmd) => {
      expect(checkBashCommand(cmd)).toMatchObject({ allow: false, rule: "feature-list-shell-write" });
    });
  });

  // H002 와 같은 방식의 오탐이 disable-hooks 에도 있었다.
  describe("disable-hooks (H002)", () => {
    it.each([
      "cat .claude/settings.json 2>&1 | head",
      "ls .claude/hooks/ 2>/dev/null",
      "grep -n disableAllHooks .claude/settings.json",
      "cp .claude/hooks/stop-gate.mjs /tmp/stop-gate.mjs",
      "cat > docs/harness/notes.md <<'EOF'\n.claude/hooks/ 는 사람이 고친다 > 에이전트 금지\nEOF",
    ])("허용한다: %s", (cmd) => {
      expect(checkBashCommand(cmd)).toEqual({ allow: true });
    });

    it.each([
      "echo '{\"disableAllHooks\":true}' > .claude/settings.json",
      "echo '{\"disableAllHooks\":true}' > .claude/settings.local.json",
      "echo '{\"disableAllHooks\":true}' > ~/.claude/settings.json",
      "sed -i 's/guard-bash/noop/' .claude/settings.json",
      "echo 'process.exit(0)' | tee .claude/hooks/guard-bash.mjs",
      "cp /tmp/empty.mjs .claude/hooks/guard-bash.mjs",
      "mv .claude/hooks/guard-bash.mjs /tmp/",
      "rm .claude/hooks/guard-bash.mjs",
      "node -e \"require('fs').writeFileSync('.claude/settings.json', '{}')\"",
    ])("막는다: %s", (cmd) => {
      expect(checkBashCommand(cmd)).toMatchObject({ allow: false, rule: "disable-hooks" });
    });

    it("유지보수 모드에서는 허용한다", () => {
      expect(checkBashCommand("rm .claude/hooks/old.mjs", { maintenance: true })).toEqual({ allow: true });
    });
  });
});

describe("checkTestContent", () => {
  it("기능 ID, expect, skip 여부를 검사한다", () => {
    expect(checkTestContent("F002", "test.describe('F002 404', () => { test('a', async () => { expect(1).toBe(1) }) })")).toEqual([]);
    expect(checkTestContent("F002", "test('a', () => { expect(1).toBe(1) })")).toHaveLength(1);
    expect(checkTestContent("F002", "test.skip('F002', () => {})")).toHaveLength(2);
  });
});
