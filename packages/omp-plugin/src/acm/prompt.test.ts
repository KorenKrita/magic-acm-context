import { describe, expect, test } from "bun:test";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent/extensibility/extensions/types";
import { z } from "zod";
import { ACM_CORE, ACM_CORE_MARKER } from "./generated-guidance";
import {
	CLOSING_SECTION,
	FOREWORD_SECTION,
	MAGIC_CONTEXT_FOREWORD_MARKER,
	MAGIC_CONTEXT_TAIL_MARKER,
	composeMagicContextSegments,
} from "./prompt";
import registerACMExtension from "./tools";

interface BeforeAgentStartEvent {
	type: "before_agent_start";
	prompt: string;
	systemPrompt: string[];
}

type BeforeAgentStartHandler = (
	event: BeforeAgentStartEvent,
	ctx: unknown,
) => Promise<{ systemPrompt: string[] } | undefined> | { systemPrompt: string[] } | undefined;

function captureACMHandler(): BeforeAgentStartHandler {
	const handlers: BeforeAgentStartHandler[] = [];
	const pi = {
		zod: z,
		on(name: string, handler: BeforeAgentStartHandler) {
			if (name === "before_agent_start") handlers.push(handler);
		},
		registerTool() {},
	};
	// The fixture supplies the narrow ExtensionAPI surface exercised during registration.
	registerACMExtension(pi as unknown as ExtensionAPI);
	const handler = handlers[0];
	expect(handler).toBeDefined();
	return handler!;
}

async function applyHandler(
	handler: BeforeAgentStartHandler,
	segments: string[],
): Promise<string[]> {
	const result = await handler(
		{ type: "before_agent_start", prompt: "go", systemPrompt: segments },
		{},
	);
	return result?.systemPrompt ?? segments;
}

describe("integrated ACM prompt composition", () => {
	test("keeps canonical injection composable before and after unrelated handlers", async () => {
		const acmHandler = captureACMHandler();
		const otherBefore: BeforeAgentStartHandler = (event) => ({
			systemPrompt: [...event.systemPrompt, "other-before"],
		});
		const otherAfter: BeforeAgentStartHandler = (event) => ({
			systemPrompt: [...event.systemPrompt, "other-after"],
		});

		let segments = ["base"];
		segments = await applyHandler(otherBefore, segments);
		segments = await applyHandler(acmHandler, segments);
		segments = await applyHandler(otherAfter, segments);
		segments = await applyHandler(acmHandler, segments);

		expect(segments).toEqual([
			"base",
			"other-before",
			`${ACM_CORE_MARKER}\n${ACM_CORE}`,
			"other-after",
		]);
	});

	test("wraps the canonical ACM segment with Magic Context-owned material only", () => {
		const acmSegment = `${ACM_CORE_MARKER}\n${ACM_CORE}`;
		const input = ["base", "other-before", acmSegment, "other-after"];
		const composed = composeMagicContextSegments(input, "## Magic Context\nMC guidance");

		expect(composed).toEqual([
			"base",
			"other-before",
			`${MAGIC_CONTEXT_FOREWORD_MARKER}\n${FOREWORD_SECTION}`,
			acmSegment,
			`${MAGIC_CONTEXT_TAIL_MARKER}\n## Magic Context\nMC guidance\n\n${CLOSING_SECTION}`,
			"other-after",
		]);
		expect(composeMagicContextSegments(composed, "## Magic Context\nMC guidance")).toEqual(
			composed,
		);
		for (const segment of input) expect(composed).toContain(segment);
		expect(composed.join("\n").split(ACM_CORE_MARKER)).toHaveLength(2);
	});
});
