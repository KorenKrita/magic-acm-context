import { describe, expect, it } from "bun:test";
import { fixOrphanedToolUse } from "./tools";

const text = (value: string) => [{ type: "text", text: value }];
const toolCall = (id: string) => ({
	type: "toolCall",
	id,
	name: "bash",
	arguments: {},
});

describe("fixOrphanedToolUse", () => {
	it("removes a function call output whose call_id has no preceding tool call", () => {
		const messages = [
			{ role: "user", content: text("continue") },
			{
				role: "toolResult",
				toolCallId: "call_YWh6pS6GP3m24vypMGlZkZi7",
				toolName: "bash",
				content: text("orphaned output"),
			},
		];

		fixOrphanedToolUse(messages);

		expect(messages).toEqual([{ role: "user", content: text("continue") }]);
	});

	it("removes results for error assistants that Pi omits from the API request", () => {
		const messages = [
			{
				role: "assistant",
				stopReason: "error",
				content: [toolCall("call_error")],
			},
			{
				role: "toolResult",
				toolCallId: "call_error",
				toolName: "bash",
				content: text("output"),
			},
		];

		fixOrphanedToolUse(messages);

		expect(messages).toHaveLength(1);
		expect(messages[0]?.role).toBe("assistant");
	});

	it("synthesizes an error result when a surviving tool call lost its output", () => {
		const messages = [
			{
				role: "assistant",
				stopReason: "toolUse",
				content: [toolCall("call_missing_output")],
			},
		];

		fixOrphanedToolUse(messages);

		expect(messages).toHaveLength(2);
		expect(messages[1]).toMatchObject({
			role: "toolResult",
			toolCallId: "call_missing_output",
			toolName: "bash",
			isError: true,
		});
	});
});
