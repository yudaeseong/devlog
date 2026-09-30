# 하네스 변경 기록 (래칫 로그)

에이전트가 실수할 때마다 원인을 찾고, 같은 실수가 반복되지 않도록 규칙을 추가한다.
각 줄은 실제로 일어난 실패 하나에서 나온다. 추가 방법: `/log-failure <무슨 일이 있었는지>`

원인 분류: **정보 부족**(문서에 없었음) · **절차 누락**(단계를 건너뜀) · **강제 필요**(알고도 어김 → 훅/검증)

| ID | 날짜 | 무슨 일이 있었나 | 원인 분류 | 추가한 규칙 | 변경 파일 |
| --- | --- | --- | --- | --- | --- |
| H001 | 2026-09-30 | stop-gate 훅이 ESLint 9 에서 제거된 `--format unix` 로 린트를 실행해, 코드와 무관하게 린트 단계가 항상 실패함 (F001 세션에서 2회 차단). 에이전트가 원인을 찾아 사람에게 결정을 넘겼고, 사람이 훅을 직접 고침 | 하네스 결함 (훅 설정 오류) | 린트 명령에서 `--format unix` 를 빼고 기본 출력 형식 사용 | .claude/hooks/stop-gate.mjs (F001 커밋 27c96e4 에 포함) |
| H002 | 2026-09-30 | guard-bash 의 feature-list-shell-write 가 명령에 `>` 만 있어도 쓰기로 판단해 `cat feature_list.json 2>&1 \| head`, `require('./feature_list.json') 2>/dev/null`, 다른 파일에 쓰는 heredoc 까지 막음 (F001 세션에서 3회 차단). disable-hooks 도 같은 방식이라 `ls .claude/hooks/ 2>/dev/null` 등을 오탐 | 강제 필요 (훅 오탐 수정) | 셸 명령을 따옴표·heredoc·fd 복제(`2>&1`)를 구분해 해석하고, 실제 쓰기 대상(리다이렉트 대상, tee, sed/perl -i, mv, cp 대상, rm, 파일 쓰기 API)이 보호 파일일 때만 차단. disableAllHooks 는 settings.local.json 등 모든 설정 파일 대상 | scripts/harness/lib/guards.mjs, scripts/harness/lib/guards.test.mjs |
