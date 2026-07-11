import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ACM_CORE, ACM_CORE_MARKER } from "./generated-guidance";
import {
	CLOSING_SECTION,
	FOREWORD_SECTION,
	MAGIC_CONTEXT_FOREWORD_MARKER,
	MAGIC_CONTEXT_TAIL_MARKER,
	applyProcessedPromptToSegments,
	composeIntegratedPromptSegments,
} from "./prompt";

const repositoryRoot = fileURLToPath(new URL("../../../../", import.meta.url));

describe("single-owner ACM prompt composition", () => {
	test("adds canonical CORE exactly once even when Magic Context injection is disabled", () => {
		const first = composeIntegratedPromptSegments(["base"], null);
		const second = composeIntegratedPromptSegments(first, null);
		expect(first).toEqual(["base", `${ACM_CORE_MARKER}\n${ACM_CORE}`]);
		expect(second).toEqual(first);
	});

	test("wraps canonical CORE while preserving unrelated segment boundaries", () => {
		const input = ["base", "other-before", "other-after"];
		const composed = composeIntegratedPromptSegments(
			input,
			"## Magic Context\nMC guidance",
		);
		expect(composed).toEqual([
			"base",
			"other-before",
			"other-after",
			`${MAGIC_CONTEXT_FOREWORD_MARKER}\n${FOREWORD_SECTION}`,
			`${ACM_CORE_MARKER}\n${ACM_CORE}`,
			`${MAGIC_CONTEXT_TAIL_MARKER}\n## Magic Context\nMC guidance\n\n${CLOSING_SECTION}`,
		]);
		expect(
			composeIntegratedPromptSegments(composed, "## Magic Context\nMC guidance"),
		).toEqual(composed);
		for (const segment of input) expect(composed).toContain(segment);
		expect(composed.join("\n").split(ACM_CORE_MARKER)).toHaveLength(2);
	});

	test("applies sticky-date processing without flattening segments", () => {
		const segments = [
			"base",
			"Today's date: 2026-07-12",
			`${ACM_CORE_MARKER}\n${ACM_CORE}`,
		];
		const processed = segments.join("\n").replace(
			"Today's date: 2026-07-12",
			"Today's date: 2026-07-11",
		);
		expect(applyProcessedPromptToSegments(segments, processed)).toEqual([
			"base",
			"Today's date: 2026-07-11",
			`${ACM_CORE_MARKER}\n${ACM_CORE}`,
		]);
		expect(() =>
			applyProcessedPromptToSegments(segments, `${processed}\nunexpected`),
		).toThrow("changed segment structure");
	});
});

describe("consumer ACM ownership", () => {
	test("registers one prompt owner while disabling canonical prompt registration", () => {
		const source = readFileSync(new URL("../index.ts", import.meta.url), "utf8");
		expect(source.match(/pi\.on\("before_agent_start"/g)).toHaveLength(1);
		expect(source).toContain("registerACMExtension(pi, { promptInjection: false })");
		expect(source).toContain("composeIntegratedPromptSegments");
	});

	test("scheduled OMP sync uses only the canonical manifest publisher", () => {
		const workflow = readFileSync(
			`${repositoryRoot}/.github/workflows/sync-mc.yml`,
			"utf8",
		);
		expect(workflow).not.toContain("scripts/sync-acm.sh");
		expect(workflow).not.toContain("inject-acm.mjs");
		expect(workflow).toContain("/tmp/omp-context/scripts/sync-acm.mjs");
		expect(workflow).toContain("--verify-only");
		expect(readFileSync(`${repositoryRoot}/scripts/omp-integration.patch`, "utf8"))
			.toContain("registerACMExtension(pi, { promptInjection: false })");
	});
});
