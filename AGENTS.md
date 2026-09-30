<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Devlog — 에이전트용 지도

개발자를 위한 기술 블로그 플랫폼. **이 저장소의 기능은 AI 에이전트가 하네스 안에서 하나씩 구현한다.**
이 파일은 지도다. 자세한 규칙은 아래 문서에 있고, 필요할 때 읽는다.

## 먼저 할 일
1. 세션 시작 시 주입된 현황(없으면 `npm run progress`)을 읽는다.
2. 기능 구현은 `/next-feature` 절차를 따른다. **한 세션에 기능 하나.**

## 절대 규칙 (하네스가 기계적으로 강제한다)
- `feature_list.json` 을 직접 고치지 않는다. 완료 기록은 `npm run verify -- <ID>` 만 한다.
- 이미 통과한 기능의 테스트 파일은 수정하지 않는다. (해시로 검사)
- 이미 만든 마이그레이션 파일은 수정하지 않는다. 새 번호로 추가한다.
- 하네스 파일(`.claude/`, `scripts/harness/`)과 `.env*` 는 수정하지 않는다.
- `git push --force`, `git reset --hard`, `--no-verify`, `rm -rf` 는 쓰지 않는다.
- 코드를 바꾸고 끝내려 하면 타입 검사·린트·단위 테스트가 자동 실행된다. 실패하면 끝낼 수 없다.

## 명령
| 명령 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 (3000, 자동 마이그레이션) |
| `npm run check` | 타입 검사 + 린트 + 단위 테스트 |
| `npx playwright test <파일>` | E2E 테스트 하나 실행 (3100에 테스트 서버를 빌드해 띄움) |
| `npm run verify -- <ID>` | 기능 완료 검증 및 기록 (회귀 테스트 포함) |
| `npm run progress` | 진행 현황과 다음 후보 |
| `npm run db:migrate` | 마이그레이션 적용 |

## 디렉터리
```
src/app/            라우트(페이지, 서버 액션, route handler)
src/components/     재사용 UI 컴포넌트
src/lib/            도메인 로직과 데이터 함수 (DB 접근은 여기서만)
src/lib/db.ts       DB 클라이언트 (libSQL)
db/migrations/      SQL 마이그레이션 (NNNN_이름.sql)
e2e/                기능별 E2E 테스트 (<ID>-이름.spec.ts)
docs/specs/         planner가 쓰는 기능 명세
docs/evals/         evaluator가 쓰는 평가 보고서
feature_list.json   기능 목록과 완료 상태 (verify만 수정)
progress.md         세션별 진행 기록 (세션 끝에 추가)
harness/            하네스 로그와 규칙 변경 기록
```

## 역할 (서브에이전트)
- `planner`: 명세 작성. `docs/specs/` 에만 쓴다.
- `evaluator`: 회의적인 QA. 테스트 품질과 실제 화면을 검사해 PASS/FAIL. 코드 수정 불가.
- `reviewer`: 커밋 전 코드 리뷰. 수정 불가.

## 상세 문서 (필요할 때 읽기)
- `docs/architecture.md` — 계층 구조, 데이터 접근, 인증, 렌더링 방식
- `docs/conventions.md` — 코드 스타일, 서버/클라이언트 컴포넌트, UI 문구
- `docs/testing.md` — 테스트 작성 규칙 (E2E, 단위, 테스트 데이터)
- `docs/decisions.md` — 기술 결정 기록. 새 라이브러리를 추가하면 여기에 한 줄 남긴다.
- `docs/harness/README.md` — 하네스 설계 설명 (사람용)

## 막혔을 때
- 같은 오류로 세 번 이상 실패하면 멈추고 `progress.md` 에 상황을 적은 뒤 사용자에게 묻는다.
- 문서와 코드가 다르면 어느 쪽이 맞는지 사용자에게 묻는다. 임의로 문서를 고치지 않는다.
