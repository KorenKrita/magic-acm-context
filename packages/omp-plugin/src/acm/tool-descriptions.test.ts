import { describe, expect, test } from "bun:test";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent/extensibility/extensions/types";
import { z } from "zod";
import { ACM_CORE, TOOL_DESCRIPTIONS } from "./generated-guidance";
import registerACMExtension from "./tools";

interface RegisteredTool {
	name: string;
	description: string;
}

describe("ACM tool description contract", () => {
	test("registers the canonical generated guidance for every ACM tool", () => {
		const registered: RegisteredTool[] = [];
		const pi = {
			zod: z,
			on() {},
			registerTool(tool: unknown) {
				if (
					typeof tool === "object" &&
					tool !== null &&
					"name" in tool &&
					typeof tool.name === "string" &&
					"description" in tool &&
					typeof tool.description === "string"
				) {
					registered.push({ name: tool.name, description: tool.description });
				}
			},
		};
		// The fixture supplies the narrow ExtensionAPI surface exercised during registration.
		registerACMExtension(pi as unknown as ExtensionAPI);

		expect(Object.fromEntries(registered.map((tool) => [tool.name, tool.description]))).toEqual({
			acm_checkpoint: TOOL_DESCRIPTIONS.checkpoint,
			acm_timeline: TOOL_DESCRIPTIONS.timeline,
			acm_travel: TOOL_DESCRIPTIONS.travel,
		});
		for (const tool of registered) {
			expect(tool.description.length).toBeLessThan(900);
			expect(tool.description).not.toContain(ACM_CORE);
		}
	});
});
