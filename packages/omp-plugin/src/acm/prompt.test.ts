import { describe, expect, test } from "bun:test";
import { ACM_SECTION } from "./prompt";

describe("ACM prompt contract", () => {
	test("uses the boundary-first task-end and after-travel rules", () => {
		expect(ACM_SECTION).toContain("Preview measures; boundary decides.");
		expect(ACM_SECTION).toContain(
			"If it shows almost no saving, checkpoint `<task>-done` and answer directly without traveling.",
		);
		expect(ACM_SECTION).toContain(
			"checkpoint that phase before executing `NEXT`",
		);
		expect(ACM_SECTION).not.toContain(
			"Execute `NEXT`, then checkpoint the next phase",
		);
	});

	test("embeds the new playbook instead of relying on a skill-relative link", () => {
		expect(ACM_SECTION).toContain("#### Decision tree");
		expect(ACM_SECTION).toContain("#### Filled handoffs");
		expect(ACM_SECTION).toContain("#### Recover archived detail and return");
		expect(ACM_SECTION).toContain("#### Checkpoint name collision");
		expect(ACM_SECTION).not.toContain("references/playbook.md");
	});
});
