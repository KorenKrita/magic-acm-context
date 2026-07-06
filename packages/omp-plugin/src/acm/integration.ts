/**
 * ACM integration into the MC omp-plugin.
 *
 * This file shows the integration points where ACM is stitched into
 * the existing MC extension. In the final build, these would be edits
 * to the MC omp-plugin's index.ts and system-prompt.ts.
 */

import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent/extensibility/extensions/types";
import { ACM_PROMPT_SECTION } from "./prompt";

// ─── Integration Point 1: System Prompt ───────────────────────
//
// In system-prompt.ts's buildMagicContextBlock(), append ACM section:
//
//   const mcBlock = buildMagicContextSection(...);
//   return mcBlock + "\n\n" + ACM_PROMPT_SECTION;
//
// This makes the unified prompt: MC guidance + ACM discipline.

export function appendACMToSystemPrompt(mcBlock: string | null): string | null {
    if (mcBlock === null) return ACM_PROMPT_SECTION;
    return `${mcBlock}\n\n${ACM_PROMPT_SECTION}`;
}

// ─── Integration Point 2: Tool Registration ──────────────────
//
// In index.ts, after registerMagicContextTools(pi, opts):
//
//   import { registerACMTools } from "./acm/tools";
//   registerACMTools(pi);
//
// The ACM tools (acm_checkpoint, acm_timeline, acm_travel) are
// registered alongside MC tools (ctx_reduce, ctx_search, etc.).

// ─── Integration Point 3: before_provider_request ─────────────
//
// ACM tools need strict: false on their JSON schema to allow
// optional parameters. This is already handled in the existing
// omp-context code (the before_provider_request hook).
//
// In index.ts's existing before_provider_request handler, add
// ACM tool names to the set:
//
//   const acmToolNames = new Set(["acm_checkpoint", "acm_timeline", "acm_travel"]);
//   // ... existing MC tool handling ...
//   // Add: if acmToolNames.has(toolName) → set strict: false
