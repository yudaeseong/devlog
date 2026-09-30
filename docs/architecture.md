# 아키텍처

## 스택
- Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4
- DB: libSQL(SQLite 호환). 로컬은 파일(`data/*.db`), 배포는 Turso 예정
- 테스트: Playwright(E2E), Vitest(단위)

## 계층
```
페이지·서버 액션 (src/app)
      │  호출
도메인 함수 (src/lib/<영역>/*.ts)   ← 입력 검증, 권한 검사, SQL
      │
DB 클라이언트 (src/lib/db.ts)
```
- **페이지와 컴포넌트는 SQL을 직접 쓰지 않는다.** `src/lib/posts/queries.ts` 같은 도메인 함수를 호출한다.
- 영역별 폴더: `src/lib/auth/`, `src/lib/posts/`, `src/lib/comments/` … 파일은 `queries.ts`(읽기), `actions.ts`(쓰기 서버 액션), `validation.ts`(입력 검증).
- SQL은 항상 파라미터 바인딩을 쓴다: `db.execute({ sql: "... WHERE id = ?", args: [id] })`. 문자열 이어붙이기 금지.

## 데이터
- 스키마 변경은 `db/migrations/NNNN_이름.sql` 새 파일로만 한다. (`npm run db:migrate`)
- 시각은 ISO 문자열(`TEXT`, UTC)로 저장하고, 화면에서 한국 시간으로 표시한다.
- ID는 `INTEGER PRIMARY KEY` 를 기본으로 한다.

## 렌더링과 캐시
- DB를 읽는 페이지는 요청 시점에 렌더링해야 한다. 쿠키 같은 요청 API를 쓰지 않는 페이지라면 데이터 조회 전에 `await connection()` (`next/server`)을 호출한다.
  - 이유: 그렇지 않으면 빌드 시점에 정적 페이지로 굳어 새 글이 보이지 않는다. 참고: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/connection.md`
- 쓰기(글 작성, 댓글 등)는 서버 액션으로 하고, 성공 후 `redirect` 또는 `revalidatePath` 로 화면을 갱신한다.

## 인증
- 이메일 + 비밀번호. 비밀번호는 `bcryptjs` 로 해시한다.
- 세션: 로그인 시 무작위 토큰을 `sessions` 테이블에 저장하고, httpOnly·sameSite=lax 쿠키로 보낸다.
- `src/lib/auth/session.ts` 에 `getCurrentUser()` 를 두고, 모든 권한 검사는 **서버에서** 이 함수로 한다.
- 로그인이 필요한 페이지는 미로그인 시 `/login?next=<원래 주소>` 로 보낸다. `next` 는 같은 사이트의 경로(`/`로 시작, `//` 금지)만 허용한다.

## 마크다운
- 렌더러는 한 곳(`src/lib/markdown/`)에 두고 상세 페이지와 미리보기가 같은 함수를 쓴다.
- 사용자가 쓴 HTML은 실행되면 안 된다. (F013) 라이브러리 선택은 `docs/decisions.md` 에 기록한다.
