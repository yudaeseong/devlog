# 테스트 규칙

## 기본
- 기능마다 테스트 파일 하나. 경로는 `feature_list.json` 의 `test` 값.
- `test.describe` 제목에 기능 ID를 넣는다: `test.describe("F009 글 작성과 발행", ...)`
- 수용 기준마다 최소 하나의 `test` 를 만든다. 테스트 이름에 기준 번호를 붙이면 좋다.
- **구현 전에 실행해서 실패하는 것을 먼저 확인한다.**

## 금지 (verify가 거부한다)
- `test.skip`, `test.only`, `test.fixme`, `test.todo`
- `page.waitForTimeout()` — 대신 `await expect(locator).toBeVisible()` 같은 자동 대기
- `expect` 가 없는 테스트

## E2E (Playwright)
- 테스트 서버: 3100번 포트, 매 실행마다 빈 DB(`data/e2e.db`)로 시작한다.
- 요소는 사용자가 보는 방식으로 찾는다: `getByRole`, `getByLabel`, `getByText`. CSS 선택자는 최후의 수단.
- 테스트끼리 데이터가 겹치지 않게 고유 값을 쓴다: `const email = \`u${Date.now()}@test.dev\``
- 반복되는 준비(회원가입 후 로그인 등)는 `e2e/helpers.ts` 에 함수로 둔다.
- 보안 기준(권한 등)은 화면뿐 아니라 **직접 요청**으로도 확인한다. (`page.request`, 다른 사용자 세션)

```ts
import { expect, test } from "@playwright/test";

test.describe("F002 404 페이지", () => {
  test("없는 주소는 404 상태와 안내 문구를 보여준다", async ({ page }) => {
    const res = await page.goto("/no-such-page");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("페이지를 찾을 수 없어요")).toBeVisible();
  });
});
```

## 단위 (Vitest)
- 순수 로직(계산, 검증, 변환)은 `src/lib/**/<이름>.test.ts` 로 테스트한다.
- 단위 테스트의 DB는 `data/unit.db` 다. 테스트 안에서 필요한 테이블을 준비한다.
