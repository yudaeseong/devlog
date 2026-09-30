# Devlog — AI 에이전트가 만드는 기술 블로그

**하네스 엔지니어링 포트폴리오.** 이 저장소의 목표는 블로그 자체보다, **AI 코딩 에이전트가 사람의 코드 작성 없이도 안정적으로 기능을 완성하도록 만드는 작업 환경(하네스)** 을 설계하고 그 효과를 측정하는 것입니다.

- 제품: 개발자를 위한 기술 블로그 플랫폼 (회원, 마크다운 글, 태그, 검색, 댓글, 좋아요, RSS 등 기능 40개)
- 에이전트: Claude Code
- 스택: Next.js 16, TypeScript, Tailwind CSS, libSQL, Playwright, Vitest

## 하네스 한눈에 보기

| 구성 | 역할 |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | 에이전트용 지도 (약 100줄, 상세 규칙은 `docs/` 로 분리) |
| [`feature_list.json`](feature_list.json) | 기능 40개와 수용 기준. 완료 기록은 검증 스크립트만 가능 |
| [`progress.md`](progress.md) | 세션 간 인계 기록 |
| [`.claude/agents/`](.claude/agents) | planner · evaluator · reviewer 역할 분리 |
| [`.claude/hooks/`](.claude/hooks) | 보호 파일·위험 명령 차단, 수정 후 린트, 종료 전 검증 게이트 |
| [`.claude/skills/`](.claude/skills) | `/next-feature`(구현 절차), `/log-failure`(실패 → 규칙), `/harness-status` |
| [`scripts/harness/`](scripts/harness) | 검증(`verify`), 현황(`progress`), 지표(`metrics`) — 판단 로직은 단위 테스트로 검증 |

설계 이유와 막으려는 실패 목록은 **[하네스 설계 문서](docs/harness/README.md)** 에 있습니다.

## 하네스 지표

<!-- METRICS:START -->
| 지표 | 값 |
| --- | --- |
| 완료 기능 | 0 / 40 |

_아직 첫 세션 전입니다. `npm run metrics -- --readme` 로 갱신됩니다._
<!-- METRICS:END -->

## 하네스 개선 기록

에이전트가 실패할 때마다 원인을 분석해 규칙을 추가합니다. → [harness/harness-log.md](harness/harness-log.md)

## 실행 방법

```bash
npm install
npm run harness:install   # 처음 한 번: 하네스 설정을 .claude/ 에 설치
npm run setup             # DB 준비, 테스트용 브라우저 설치, 기본 검사
npm run dev       # http://localhost:3000
```

에이전트로 기능 구현하기:

```bash
claude            # 이 폴더에서 Claude Code 실행
/next-feature     # 다음 기능 하나를 계획 → 테스트 → 구현 → 평가 → 검증 → 커밋
```

## 역할 분담

- **사람(저):** 기능 목록과 수용 기준 설계, 하네스 설계와 개선, 에이전트 실패 분석
- **에이전트:** 기능 명세, 테스트, 구현, 평가, 리뷰
- 초기 하네스는 Claude와 함께 설계했고, 이후 규칙은 실제 실패 기록에서 추가합니다.
