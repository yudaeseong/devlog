# 코드 규칙

## TypeScript
- `any`, `@ts-ignore`, `@ts-expect-error` 금지 (ESLint가 막는다). 모르는 값은 `unknown` 으로 받고 좁힌다.
- 함수 반환 타입이 복잡하면 명시한다. 도메인 타입은 영역 폴더의 `types.ts` 에 둔다.

## React / Next.js
- 기본은 서버 컴포넌트. 상태·이벤트가 필요한 부분만 `"use client"` 컴포넌트로 분리한다.
- 폼은 서버 액션 + `useActionState` 로 오류를 보여준다. 클라이언트 검증은 편의용이고, 서버 검증이 기준이다.
- 이 버전의 API는 `node_modules/next/dist/docs/` 로 확인한다. (예: `cookies()` 는 async)

## UI 문구
- 모든 화면 문구는 한국어 해요체. 수용 기준에 적힌 문구는 **글자 그대로** 쓴다. (테스트가 문구로 찾는다)
- 오류 메시지는 무엇이 틀렸고 어떻게 고치는지 말한다.

## 접근성
- 입력 요소에는 `<label htmlFor>` 를 연결한다. 버튼은 `<button>`, 이동은 `<Link>`.
- 오류 메시지는 `aria-describedby` 로 입력과 연결한다.

## 스타일
- Tailwind 유틸리티 클래스. 다크 모드는 `dark:` 변형을 함께 쓴다.
- 반복되는 UI는 `src/components/` 로 뽑는다. 세 번 반복되기 전에는 뽑지 않는다.

## 커밋
- 기능: `feat(F009): 글 작성과 발행`
- 하네스: `harness(H001): ...`, 문서: `docs: ...`, 버그: `fix(F009): ...`
- 한 커밋에 기능 하나. 관계없는 변경을 섞지 않는다.
