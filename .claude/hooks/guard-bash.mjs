// PreToolUse (Bash)
// 강제 push, hard reset, 검사 건너뛰기, 셸로 feature_list.json 고치기 같은 우회를 막는다.
import { checkBashCommand } from "../../scripts/harness/lib/guards.mjs";
import { block, readInput } from "./lib.mjs";

const input = await readInput();
const command = input.tool_input?.command;
if (!command) process.exit(0);

const verdict = checkBashCommand(command, { maintenance: process.env.HARNESS_MAINTENANCE === "1" });
if (!verdict.allow) block({ hook: "guard-bash", rule: verdict.rule, reason: verdict.reason, input });
process.exit(0);
