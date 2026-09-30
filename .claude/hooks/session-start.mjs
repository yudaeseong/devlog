// SessionStart
// 새 세션이 시작되거나 컨텍스트가 압축되면 현재 진행 상황을 에이전트에게 알려준다.
// (에이전트는 이전 세션을 기억하지 못하므로, 파일에 남긴 기록으로 이어서 일한다)
import { progressText } from "../../scripts/harness/progress.mjs";

try {
  console.log(progressText());
} catch (e) {
  console.log(`하네스 현황을 읽지 못했어요: ${e.message}`);
}
process.exit(0);
