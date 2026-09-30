---
name: log-failure
description: 에이전트가 실수했을 때 원인을 분석하고, 같은 실수가 반복되지 않도록 하네스 규칙을 추가한다 (래칫 원칙).
argument-hint: "<무슨 일이 있었는지>"
disable-model-invocation: true
---

# 실패를 하네스 규칙으로 바꾸기

"AGENTS.md 의 모든 줄은 실제로 잘못된 일 하나로 거슬러 올라갈 수 있어야 한다."
사람이 에이전트의 실수를 발견했을 때 이 절차를 실행한다.

무슨 일이 있었나: $ARGUMENTS

## 1. 원인 분석
- 관련 커밋, 파일, `harness/logs/*.jsonl`, `progress.md` 를 확인한다.
- 원인을 분류한다:
  - **정보 부족**: 에이전트가 알아야 할 규칙이 문서에 없었다 → `AGENTS.md` 또는 `docs/*.md`
  - **절차 누락**: 해야 할 단계를 건너뛰었다 → `.claude/skills/next-feature/SKILL.md` 또는 서브에이전트
  - **강제 필요**: 문서에 있었는데도 어겼다 → 훅(`scripts/harness/lib/guards.mjs`)이나 검증(`verify-feature.mjs`)으로 기계적으로 막기
- 문서로 충분한 것을 훅으로 만들지 않는다. 훅은 "알고도 어기는" 경우에만.

## 2. 규칙 제안
- 가장 작은 변경을 제안한다. 파일, 추가할 내용, 이 변경이 막는 실패를 사용자에게 보여주고 **승인을 받는다.**

## 3. 적용
- 하네스 파일(`.claude/`, `scripts/harness/`)은 보호되어 있다. 사용자가 유지보수 모드로 세션을 시작해야 수정할 수 있다:
  - PowerShell: `$env:HARNESS_MAINTENANCE=1; claude`
- 훅 로직을 바꿨다면 `scripts/harness/lib/guards.test.mjs` 에 테스트를 추가하고 `npm run test` 로 확인한다.

## 4. 기록
`harness/harness-log.md` 표에 한 줄을 추가한다. 번호는 H001 부터 순서대로.

`| H00n | YYYY-MM-DD | 무슨 일이 있었나 | 원인 분류 | 추가한 규칙 | 변경 파일 |`

커밋: `git commit -m "harness(H00n): <요약>"`
