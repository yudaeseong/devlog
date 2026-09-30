// 훅이 사용하는 판단 로직. 순수 함수로 두고 guards.test.mjs 에서 테스트한다.
// 규칙마다 id를 붙여 hook 로그와 하네스 로그(harness/harness-log.md)에서 추적한다.

const norm = (p) => p.replace(/\\/g, "/");

/** 절대경로를 프로젝트 기준 상대경로로 바꾼다. 프로젝트 밖이면 null */
export function toRelative(filePath, root) {
  const f = norm(filePath);
  const r = norm(root).replace(/\/$/, "");
  if (f.toLowerCase().startsWith(r.toLowerCase() + "/")) return f.slice(r.length + 1);
  if (!/^([a-zA-Z]:)?\//.test(f)) return f.replace(/^\.\//, ""); // 이미 상대경로
  return null;
}

// 에이전트가 직접 수정하면 안 되는 파일
const PROTECTED = [
  { id: "feature-list", test: (p) => p === "feature_list.json", reason: "feature_list.json 은 직접 수정할 수 없어요. 기능 완료는 `npm run verify -- <기능ID>` 가 테스트 통과를 확인한 뒤에만 기록해요." },
  { id: "harness-logs", test: (p) => p.startsWith("harness/logs/"), reason: "하네스 로그는 스크립트만 기록해요." },
  { id: "harness-config", test: (p) => p.startsWith(".claude/hooks/") || p === ".claude/settings.json" || p.startsWith("scripts/harness/"), reason: "하네스 설정과 스크립트는 에이전트가 바꿀 수 없어요. 개선이 필요하면 사람에게 제안하세요 (/log-failure)." },
  { id: "env-file", test: (p) => /(^|\/)\.env(\..*)?$/.test(p) && !p.endsWith(".env.example"), reason: ".env 파일은 비밀값을 담고 있어 에이전트가 수정할 수 없어요." },
  { id: "applied-migration", test: () => false, reason: "" }, // checkFileEdit 에서 별도 처리
];

/**
 * 파일 수정(Edit/Write) 요청을 검사한다.
 * @param {object} args
 * @param {string} args.relPath 프로젝트 기준 경로
 * @param {string|undefined} args.agentType 서브에이전트 이름 (메인 세션이면 undefined)
 * @param {Array} args.features feature_list.json 의 features
 * @param {boolean} args.fileExists 이미 존재하는 파일인지
 * @param {boolean} [args.maintenance] 사람이 켠 하네스 유지보수 모드 (HARNESS_MAINTENANCE=1)
 * @returns {{allow: true} | {allow: false, rule: string, reason: string}}
 */
export function checkFileEdit({ relPath, agentType, features, fileExists, maintenance = false }) {
  const p = norm(relPath);

  for (const rule of PROTECTED) {
    // 유지보수 모드에서는 하네스 설정만 수정할 수 있다. (feature_list.json, 로그, .env 는 여전히 보호)
    if (maintenance && !agentType && rule.id === "harness-config") continue;
    if (rule.test(p)) return { allow: false, rule: rule.id, reason: rule.reason };
  }

  // 이미 적용된 마이그레이션은 수정 금지 (새 파일만 추가)
  if (/^db\/migrations\/\d{4}_.+\.sql$/.test(p) && fileExists) {
    return { allow: false, rule: "applied-migration", reason: "이미 만든 마이그레이션 파일은 수정하지 않아요. 새 번호로 마이그레이션 파일을 추가하세요." };
  }

  // 통과한 기능의 테스트는 불변 (테스트를 약하게 고쳐서 통과시키는 것을 막는다)
  const locked = features.find((f) => f.passes && norm(f.test) === p);
  if (locked) {
    return { allow: false, rule: "passed-test-immutable", reason: `${locked.id}는 이미 통과한 기능이라 테스트(${p})를 수정할 수 없어요. 요구사항이 바뀌었다면 사람에게 요청하세요.` };
  }

  // 역할별 쓰기 범위 (역할 분리)
  if (agentType === "planner" && !p.startsWith("docs/specs/")) {
    return { allow: false, rule: "role-planner", reason: "planner는 docs/specs/ 에만 쓸 수 있어요." };
  }
  if (agentType === "evaluator" && !(p.startsWith("e2e/_eval/") || p.startsWith("docs/evals/"))) {
    return { allow: false, rule: "role-evaluator", reason: "evaluator는 코드를 고칠 수 없어요. e2e/_eval/(탐색 테스트)와 docs/evals/(평가 보고서)에만 쓸 수 있어요." };
  }
  if (agentType === "reviewer") {
    return { allow: false, rule: "role-reviewer", reason: "reviewer는 파일을 수정하지 않고 의견만 보고해요." };
  }

  return { allow: true };
}

/**
 * 셸 명령을 대략적으로 해석해 "무엇에 쓰는지"를 뽑는다. (H002)
 * 명령에 '>' 가 있다는 것만으로 쓰기로 보면 `2>&1`, `2>/dev/null`, 따옴표 안의 '>', 다른 파일에 쓰는
 * heredoc 까지 막게 된다. 그래서 따옴표·heredoc·fd 복제를 구분하고, 실제 쓰기 대상만 모은다.
 * @returns {{segments: string[][], redirects: string[], heredocs: string[]} | null} 따옴표가 안 닫히면 null
 */
export function parseShell(src) {
  const segments = [[]];
  const redirects = [];
  const heredocs = [];
  const pendingDelims = [];
  let word = null; // 현재 단어 (null = 단어 밖)
  let next = null; // 다음 단어의 쓰임: "out"(쓰기 대상) | "dup"(>&) | "in"(<) | "heredoc"
  const endWord = () => {
    if (word === null) return;
    if (next === "out") redirects.push(word);
    else if (next === "dup" && !/^(\d+|-)$/.test(word)) redirects.push(word); // `>& file` 은 파일 쓰기
    else if (next === "heredoc") pendingDelims.push(word);
    else if (next !== "dup" && next !== "in") segments.at(-1).push(word);
    word = null;
    next = null;
  };
  const newSegment = () => {
    endWord();
    if (segments.at(-1).length) segments.push([]);
  };

  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "'") {
      const end = src.indexOf("'", i + 1);
      if (end < 0) return null;
      word = (word ?? "") + src.slice(i + 1, end);
      i = end + 1;
    } else if (ch === '"') {
      let j = i + 1;
      let s = "";
      while (j < src.length && src[j] !== '"') {
        if (src[j] === "\\" && /["\\$`]/.test(src[j + 1] ?? "")) j++;
        s += src[j++];
      }
      if (j >= src.length) return null;
      word = (word ?? "") + s;
      i = j + 1;
    } else if (ch === "\\") {
      if (src[i + 1] !== "\n") word = (word ?? "") + (src[i + 1] ?? "");
      i += 2;
    } else if (ch === "\n") {
      newSegment();
      i++;
      // 대기 중인 heredoc 본문은 명령이 아니라 데이터로 따로 모은다
      for (const raw of pendingDelims.splice(0)) {
        const delim = raw.replace(/^-/, "");
        const lines = [];
        while (i < src.length) {
          const eol = src.indexOf("\n", i);
          const line = src.slice(i, eol < 0 ? src.length : eol);
          i = eol < 0 ? src.length : eol + 1;
          if (line.replace(/^\t+/, "").trimEnd() === delim) break;
          lines.push(line);
        }
        heredocs.push(lines.join("\n"));
      }
    } else if (/\s/.test(ch)) {
      endWord();
      i++;
    } else if (ch === ">" || (ch === "&" && src[i + 1] === ">")) {
      if (ch === ">" && word !== null && /^\d+$/.test(word)) word = null; // `2>` 의 fd 번호
      endWord();
      i += ch === "&" ? 2 : 1;
      if (src[i] === ">" || src[i] === "|") i++;
      if (src[i] === "&") {
        next = "dup";
        i++;
      } else next = "out";
    } else if (ch === "<") {
      endWord();
      if (src.startsWith("<<<", i)) {
        next = "in";
        i += 3;
      } else if (src[i + 1] === "<") {
        i += 2;
        next = "heredoc";
        if (src[i] === "-") {
          word = "-";
          i++;
        }
      } else {
        next = "in";
        i++;
      }
    } else if (/[|;&()`]/.test(ch) || (ch === "$" && src[i + 1] === "(")) {
      newSegment();
      i += ch === "$" ? 2 : 1;
    } else {
      word = (word ?? "") + ch;
      i++;
    }
  }
  endWord();
  return { segments: segments.filter((s) => s.length), redirects, heredocs };
}

const baseName = (p) => norm(p).replace(/\/+$/, "").split("/").pop();
const WRAPPERS = new Set(["sudo", "env", "command", "exec", "nohup", "time", "xargs"]);
/** env/sudo, `VAR=x` 같은 접두어를 건너뛴 실제 명령 */
const commandOf = (seg) => {
  let k = 0;
  while (k < seg.length && (WRAPPERS.has(seg[k]) || /^\w+=/.test(seg[k]) || (k > 0 && seg[k].startsWith("-")))) k++;
  return { name: seg[k] ? baseName(seg[k]) : "", args: seg.slice(k + 1) };
};
const API_WRITE = /writeFile|appendFile|createWriteStream|copyFile|renameSync|\brename\(|unlink|rmSync|\bopen\([^)]*['"][wa+x]/;

/**
 * 명령이 matches(path) 인 파일을 바꾸는지(쓰기·이동·삭제) 판단한다.
 * 리다이렉트 대상, tee, sed/perl -i, mv(원본·대상), cp 대상, rm, 스크립트 안의 파일 쓰기 API 를 본다.
 * 읽기(cat, grep, require)와 다른 곳으로의 리다이렉트(2>&1, 2>/dev/null)는 허용한다.
 * matches(text, true) 는 "text 어딘가에 언급되는가"를 뜻한다.
 */
export function writesTo(command, matches) {
  const parsed = parseShell(command);
  // 해석할 수 없으면 예전처럼 보수적으로 판단한다
  if (!parsed) return matches(command, true) && /(>|\btee\b|-i\b|\bmv\b|\bcp\b|\brm\b)/.test(command);
  const { segments, redirects, heredocs } = parsed;
  // 변수·명령 치환이 들어간 대상은 알 수 없으니, 명령이 보호 파일을 언급했으면 쓰기로 본다
  const mentioned = matches(command, true);
  const hits = (p) => matches(p) || (/[$`]/.test(p) && mentioned);

  if (redirects.some(hits)) return true;
  for (const seg of segments) {
    const { name, args } = commandOf(seg);
    const files = args.filter((a) => !a.startsWith("-"));
    if (name === "tee" && files.some(hits)) return true;
    if ((name === "sed" || name === "perl") && args.some((a) => /^-[a-zA-Z]*i|^--in-place/.test(a)) && files.some(hits)) return true;
    if (["mv", "rm", "unlink", "truncate"].includes(name) && files.some(hits)) return true;
    if (name === "cp" && files.length >= 2) {
      const dest = files.at(-1);
      if (hits(dest)) return true;
      // `cp /tmp/feature_list.json .` 처럼 현재 디렉터리로 복사해 덮어쓰는 경우
      if (/^\.\/?$/.test(dest) && files.slice(0, -1).some((f) => matches(baseName(f)))) return true;
    }
  }
  // node -e / python -c / heredoc 스크립트 안에서 파일 쓰기 API 로 고치는 경우
  const code = [command, ...heredocs].join("\n");
  return API_WRITE.test(code) && matches(code, true);
}

const FEATURE_LIST = /(^|\/)feature_list\.json$/;
const isFeatureList = (p, anywhere = false) => (anywhere ? /feature_list\.json/.test(norm(p)) : FEATURE_LIST.test(norm(p)));
const HOOK_CONFIG = /(^|\/)\.claude\/(settings\.json$|hooks(\/|$))/;
const isHookConfig = (p, anywhere = false) => (anywhere ? /\.claude\/(settings\.json|hooks\/)/.test(norm(p)) : HOOK_CONFIG.test(norm(p)));
// disableAllHooks 는 어느 설정 파일(settings.local.json, ~/.claude/settings.json)에 넣어도 훅이 꺼진다
const isSettingsFile = (p, anywhere = false) => (anywhere ? /settings(\.local)?\.json/ : /(^|\/)settings(\.local)?\.json$/).test(norm(p));

// 위험하거나 하네스를 우회하는 셸 명령
const BASH_RULES = [
  { id: "force-push", re: /git\s+push\b[^\n]*(--force\b|--force-with-lease\b|\s-f\b)/, reason: "강제 push는 금지예요." },
  { id: "hard-reset", re: /git\s+reset\s+[^\n]*--hard/, reason: "git reset --hard 는 작업을 지울 수 있어 금지예요. 되돌리려면 git revert 나 git stash 를 쓰세요." },
  { id: "no-verify", re: /--no-verify\b/, reason: "--no-verify 로 검사를 건너뛸 수 없어요." },
  { id: "rm-rf", re: /\brm\s+-[a-zA-Z]*r[a-zA-Z]*f|\brm\s+-[a-zA-Z]*f[a-zA-Z]*r/, reason: "rm -rf 는 금지예요. 지울 파일을 하나씩 지정하세요." },
  { id: "feature-list-shell-write", re: /feature_list\.json/, extra: (c, raw) => writesTo(raw, isFeatureList), reason: "셸로 feature_list.json 을 바꿀 수 없어요. `npm run verify -- <기능ID>` 를 쓰세요." },
  { id: "delete-test", re: /\b(rm|del|git\s+rm)\b[^\n]*(e2e\/|\.test\.ts|\.spec\.ts)/, extra: (c) => !/e2e\/_eval\//.test(c), reason: "테스트 파일은 지울 수 없어요." },
  { id: "disable-hooks", re: /disableAllHooks|\.claude\/(settings\.json|hooks\/)/, extra: (c, raw) => writesTo(raw, isHookConfig) || (/disableAllHooks/.test(raw) && writesTo(raw, isSettingsFile)), reason: "하네스 설정은 셸로도 바꿀 수 없어요." },
];

/** Bash 명령을 검사한다 */
export function checkBashCommand(command, { maintenance = false } = {}) {
  const c = command.replace(/\\/g, "/");
  for (const rule of BASH_RULES) {
    if (maintenance && rule.id === "disable-hooks") continue;
    // extra 에는 원본 명령도 넘긴다. 셸 해석(따옴표·이스케이프)은 \ 를 / 로 바꾸기 전 문자열로 해야 맞다.
    if (rule.re.test(c) && (!rule.extra || rule.extra(c, command))) {
      return { allow: false, rule: rule.id, reason: rule.reason };
    }
  }
  return { allow: true };
}

/** 테스트 파일 내용 검사: 기능 ID 포함, skip/only 금지 */
export function checkTestContent(featureId, text) {
  const problems = [];
  if (!text.includes(featureId)) problems.push(`테스트에 기능 ID(${featureId})가 없어요. describe 제목에 넣어 주세요.`);
  if (/\b(test|it|describe)\.(skip|only|fixme|todo)\s*\(/.test(text)) problems.push("skip/only/fixme/todo 는 쓸 수 없어요.");
  if (/waitForTimeout\s*\(/.test(text)) problems.push("waitForTimeout 대신 expect(...).toBeVisible() 같은 자동 대기를 쓰세요.");
  const assertions = (text.match(/\bexpect\s*\(/g) ?? []).length;
  if (assertions === 0) problems.push("expect 검증이 하나도 없어요.");
  return problems;
}
