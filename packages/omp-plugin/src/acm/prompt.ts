import { ensureAcmCoreSegment } from "./prompt-registration";
import { ACM_CORE_MARKER } from "./generated-guidance";

export const MAGIC_CONTEXT_FOREWORD_MARKER =
	"<!-- MAGIC-ACM-CONTEXT:FOREWORD:v1 -->";
export const MAGIC_CONTEXT_TAIL_MARKER = "<!-- MAGIC-ACM-CONTEXT:TAIL:v1 -->";

export const FOREWORD_SECTION = `# Magic-Acm-Context

## Foreword

Two systems manage context in parallel: ACM owns conversation-tree structure, while Magic Context owns fine-grained content hygiene. They compose without sharing state or replacing one another.

ACM checkpoints and folds completed work into recoverable branches. Magic Context marks spent outputs for later reduction inside the surviving branch. Structure limits long-lived history; hygiene keeps that history lean.

Apply each system through its own tools and guidance. A change in one system does not undo files, processes, browser state, remote effects, or the other system's state.`;

export const CLOSING_SECTION = `## Closing

Use ACM for semantic boundaries and Magic Context for spent individual outputs. Preserve the current action's exact working detail; archive or reduce only material that action no longer needs.`;

/** The single consumer-owned prompt composition seam. */
export function composeIntegratedPromptSegments(
	segments: readonly string[],
	magicContextSection: string | null,
): string[] {
	const composed = ensureAcmCoreSegment([...segments]);
	if (magicContextSection === null) return composed;

	if (!composed.some((segment) => segment.includes(MAGIC_CONTEXT_FOREWORD_MARKER))) {
		const acmIndex = composed.findIndex((segment) =>
			segment.includes(ACM_CORE_MARKER),
		);
		composed.splice(
			acmIndex,
			0,
			`${MAGIC_CONTEXT_FOREWORD_MARKER}\n${FOREWORD_SECTION}`,
		);
	}

	if (!composed.some((segment) => segment.includes(MAGIC_CONTEXT_TAIL_MARKER))) {
		const acmIndex = composed.findIndex((segment) =>
			segment.includes(ACM_CORE_MARKER),
		);
		composed.splice(
			acmIndex + 1,
			0,
			`${MAGIC_CONTEXT_TAIL_MARKER}\n${magicContextSection}\n\n${CLOSING_SECTION}`,
		);
	}
	return composed;
}

/** Preserve segment boundaries when cache processing freezes only the sticky date. */
export function applyProcessedPromptToSegments(
	segments: readonly string[],
	processedPrompt: string,
): string[] {
	const originalPrompt = segments.join("\n");
	if (processedPrompt === originalPrompt) return [...segments];
	const datePattern = /Today's date: .+/;
	const originalDate = originalPrompt.match(datePattern)?.[0];
	const processedDate = processedPrompt.match(datePattern)?.[0];
	if (!originalDate || !processedDate) {
		throw new Error("Prompt cache processing changed content outside the sticky date");
	}
	const updated = segments.map((segment) => segment.replace(originalDate, processedDate));
	if (updated.join("\n") !== processedPrompt) {
		throw new Error("Prompt cache processing changed segment structure");
	}
	return updated;
}
