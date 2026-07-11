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

/**
 * Compose Magic Context-owned prompt segments around the canonical ACM CORE.
 * Existing segments are copied byte-for-byte and retain their relative order.
 */
export function composeMagicContextSegments(
	segments: readonly string[],
	magicContextSection: string,
): string[] {
	const composed = [...segments];

	if (
		!composed.some((segment) => segment.includes(MAGIC_CONTEXT_FOREWORD_MARKER))
	) {
		const acmIndex = composed.findIndex((segment) =>
			segment.includes(ACM_CORE_MARKER),
		);
		const insertionIndex = acmIndex >= 0 ? acmIndex : composed.length;
		composed.splice(
			insertionIndex,
			0,
			`${MAGIC_CONTEXT_FOREWORD_MARKER}\n${FOREWORD_SECTION}`,
		);
	}

	if (!composed.some((segment) => segment.includes(MAGIC_CONTEXT_TAIL_MARKER))) {
		const acmIndex = composed.findIndex((segment) =>
			segment.includes(ACM_CORE_MARKER),
		);
		const insertionIndex = acmIndex >= 0 ? acmIndex + 1 : composed.length;
		composed.splice(
			insertionIndex,
			0,
			`${MAGIC_CONTEXT_TAIL_MARKER}\n${magicContextSection}\n\n${CLOSING_SECTION}`,
		);
	}

	return composed;
}
