# 마이그레이션

- 파일 이름: `NNNN_설명.sql` (예: `0001_users.sql`). 번호 순서대로 한 번만 적용된다.
- **이미 커밋된 마이그레이션 파일은 수정하지 않는다.** 바꿔야 하면 새 파일을 추가한다.
- 적용: `npm run db:migrate` (`npm run dev`, `npm run build` 전에 자동 실행)
