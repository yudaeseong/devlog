---
name: harness-status
description: 하네스 지표(완료 기능, 첫 검증 통과율, 훅 차단 횟수, 추가된 규칙)를 보여주고 README 수치를 갱신한다.
disable-model-invocation: true
---

# 하네스 현황과 지표

1. `npm run progress` 로 진행 현황을 확인한다.
2. `npm run metrics` 로 지표를 확인한다.
3. 지표에서 눈에 띄는 점을 세 줄 이내로 해석한다.
   - 예: 검증 실패가 특정 단계(lint, e2e 등)에 몰려 있으면, 그 단계를 앞당기는 하네스 개선을 제안
   - 예: 같은 훅 규칙이 여러 번 막았다면, 문서에 그 규칙이 잘 보이는지 확인 제안
4. 사용자가 원하면 `npm run metrics -- --readme` 로 README 의 지표 표를 갱신하고 커밋한다: `docs: 하네스 지표 갱신`
