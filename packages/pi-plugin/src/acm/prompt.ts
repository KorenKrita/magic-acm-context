/**
 * Unified Magic-Acm-Context prompt injection.
 *
 * Structure (all ## sections under one # heading):
 *   # Magic-Acm-Context
 *   ## Foreword          — ACM+MC relationship, leading words, mental model
 *   ## Context Management (ACM) — full ACM discipline (structure)
 *   ## Magic Context     — MC guidance block (hygiene) [injected externally]
 *   ## Closing           — reinforcement of parallel operation
 *
 * The MC section is built by buildMagicContextSection() and spliced between
 * ACM and Closing at injection time. This file owns everything else.
 */

// ── Foreword ──────────────────────────────────────────────────────────────

export const FOREWORD_SECTION = `# Magic-Acm-Context

## Foreword

Two systems manage your context in parallel — one owns **structure**, the other owns **hygiene**. They run concurrently, never conflict, and together keep your working set lean without losing recoverability.

**Structure** (ACM) — coarse-grain, tree-level decisions. Checkpoints mark recoverable positions; travel folds entire phases, tasks, or failed directions out of the working set into an archived branch. Structure sets the ceiling: without it, no amount of fine-grain cleanup prevents context from growing unbounded.

**Hygiene** (Magic Context) — fine-grain, content-level maintenance. Tagging marks individual tool outputs as spent; the runtime compresses or removes them when space is needed. Hygiene optimizes below the ceiling: between structural folds, it keeps the surviving content lightweight and current.

ACM is primary. A session that only does hygiene accumulates finished work indefinitely — the working set bloats with completed phases that no tag-level cleanup can remove. A session that only does structure still benefits because each fold naturally discards the noise inside. Both together compound: structure removes large done blocks, hygiene thins what remains.

Unbounded context does not mean unmanaged context. You will not be truncated — but your working set should contain only material the next action needs. Structure decides what stays in the set; hygiene decides how clean it is.

Follow both systems' guidance as written. They are parallel by design: ACM folds at boundaries, Magic Context reduces between them. No coordination is required — doing each correctly is sufficient.`;

// ── ACM Section ───────────────────────────────────────────────────────────

export const ACM_SECTION = `## Context Management (ACM)

A context window is a **working set**: the live material needed for the next action.

Keep the working set live. Compress everything else into a recoverable **handoff** at stable **boundaries**. Manage it yourself, mid-task, without being asked and without asking permission.

Use this discipline continuously in multi-step work: before bursts or risks, at phase, attempt, batch, and task-chain boundaries, and before final answers or task switches.

### Leading words

Use these words consistently; they are the skill's decision vocabulary.

**Working set** — context the next action will directly reason over. Keep exact detail live while it is still needed.

**Boundary** — the semantic edge of the work being compressed: a burst, phase, failed direction, batch item, or task chain. Boundary is the travel decision.

**Handoff** — the executable state left after travel. It is an index, not a store: put raw detail in the archive, external state in the world, and only resumable state in the handoff.

**Archive** — the raw path preserved off-branch by travel, plus any backup checkpoint that points to it. Folded history is archived, never deleted.

**Chain** — continuous work serving one user goal. Follow-up fixes, refinements, and phase shifts stay in the chain; a new unrelated user goal starts a new chain.

**Burst** — temporary context expansion: big reads, broad searches, logs, large diffs, subagents, or any output whose size you could not bound before calling it.

**Anchor gravity** — the pull of the nearest checkpoint. It often feels correct because it is close. Resist it by naming the boundary first.

### Fold gate

Fold only when all three are true:

- **Boundary named** — you can say what is being compressed: burst, phase, failed direction, batch item, or task chain.
- **NEXT executable** — the handoff contains one immediate next action. If you cannot write one executable NEXT, keep the context live.
- **Raw recoverable** — details not copied into the handoff are archived or pointed to by checkpoint, node ID, file path, command, URL, or other recovery pointer.

No boundary, no travel target. No executable NEXT, no fold.

### Tools

- \`acm_checkpoint\` — create recoverability by labeling a conversation node. Free: no branch, no summary, no context change.
- \`acm_travel\` — fold history into a handoff by traveling to an anchor or raw node ID. The old path becomes the archive.
- \`acm_timeline\` — inspect the tree, checkpoint labels, node IDs, usage, and fold candidates.

### Anchors

Use fixed suffixes; the name encodes future use:

- \`<name>-start\` — the beginning of a boundary you may later compress: task chain, phase, burst, or risky attempt.
- \`<name>-done\` — a milestone/archive pointer after results are in hand. It is a retreat point for later work and a recovery bookmark for raw history before it.
- \`<name>-paused\` — unfinished work you will return to.

A fold target must sit before the boundary you are compressing. Anchors are conveniences, not prerequisites: \`acm_travel\` and \`acm_checkpoint\` accept raw node IDs from \`acm_timeline\`.

### Checkpoint discipline

Checkpoint at these events. It is free, and missing recoverability is the failure mode:

- New task chain or user request starts.
- A phase's first action is about to run.
- A burst is about to happen: big read, broad search, log fetch, subagent, large diff.
- A risky, destructive, or hard-to-redo step is about to run.
- A milestone lands: conclusion written, decision made, root cause confirmed, test passed.
- Work is paused for another front.

Checkpoint creates recoverability. It is not a fold.

### Fold discipline

Fold by boundary, not proximity. The nearest anchor is only a candidate.

| Boundary | Signal | Target |
|---|---|---|
| Burst | output is distilled into an extract | pre-burst anchor or last clean node |
| Phase | next action uses the conclusion, not the raw trail | phase start |
| Failed direction | an attempt is judged dead or superseded | attempt start or last milestone |
| Batch item | item finished and more remain | method or batch anchor |
| Task chain | final answer next, or new request over finished work | semantic chain start |

Call \`acm_travel\` at these stable boundaries by default. The boundary establishes whether folding is semantically appropriate; the preview only measures the likely saving. **Preview measures; boundary decides.**

#### Task end

A task-chain boundary is semantically foldable by default. Inspect the fold preview before answering:

- If it shows meaningful structural saving, fold to the semantic task-chain start:

\`\`\`javascript
acm_travel({
  target: "<task-chain-start>",
  backupCurrentHeadAs: "<task>-done",
  summary: "<handoff>"
});
\`\`\`

  Then answer from the handoff branch, not the archived trail.
- If it shows almost no saving, checkpoint \`<task>-done\` and answer directly without traveling.

If a \`-done\` checkpoint already bookmarks the raw path, name it in the handoff's \`Recover\` slot.

Task-end context management is complete when either a meaningful fold has landed or the no-saving fallback has created a unique \`-done\` checkpoint. Give the answer from the surviving branch.

#### New request over unfolded work

If a new user request arrives over finished work that was not folded, fold before starting. Target the finished semantic chain start, not the most recent anchor. Use \`root\` only when several unrelated finished chains have stacked up and the handoff can carry one capsule per chain. Quote the new request verbatim in the handoff because it sits after the target and will leave context.

### Handoff contract

The handoff is your working state after travel. Fill every slot; write \`none\` rather than deleting a slot:

\`\`\`text
Goal: <current goal; quote a new triggering user request verbatim>
State: <what is true now; conclusions, decisions, status, key numbers/errors/IDs>
Evidence: <paths, commands, URLs, node IDs, checkpoint names, commits, test outputs to recover detail>
External: <files changed, processes started/stopped, browser/remote/ticket side effects; travel does not undo these>
Exclusions: <dead ends and directions not to repeat, with why>
Recover: <backup label, checkpoint, node ID, or pointer to the archived raw path>
NEXT: <one executable next action>
\`\`\`

Pointers over dumps. Copy raw values only when small, volatile, or needed immediately.

\`Evidence\` points to facts you can re-fetch: files, commands, URLs, commits, errors, node IDs. \`Recover\` points to the archived raw conversation path: backup label, checkpoint, or node ID.

### Target selection

Use the boundary table, then verify that the target sits before the material being compressed. Older semantic anchors can be better than newer ones. If no anchor fits, use \`acm_timeline\` to find the last clean node before the boundary and travel to that raw node ID.

### After travel

You are on the handoff branch. Read the tool result before continuing: confirm the reported structural effect and context refresh or synchronization status. If \`NEXT\` is the first action of a new phase, checkpoint that phase before executing \`NEXT\`; otherwise execute \`NEXT\` directly.

Disk and external systems were not rolled back; inspect them directly when in doubt. If a handoff dropped detail, re-fetch from \`Evidence\` first, then recover from \`Archive\` by following the round-trip procedure in the playbook.

### Mechanics

- Checkpoint names are unique across the tree and case-sensitive; one node may hold multiple aliases. If a semantic name already exists, preserve its base and add the smallest useful scope, ordinal, or date, such as \`parser-fix-api-v2-start\`. Generic names like \`checkpoint-1\` carry no recovery meaning.
- Omitting checkpoint \`target\` auto-anchors the nearest meaningful USER/AI turn near HEAD; passing a node ID anchors any past node retroactively.
- \`acm_timeline\` mode precedence: \`list_checkpoints\` > \`search\` > \`full_tree\` > active path. Treat a truncated \`full_tree\` as incomplete; use \`list_checkpoints\` or \`search\` to verify whether an anchor exists.
- Travel can shrink or grow context: traveling to a later or off-path target can restore raw history. Read the reported usage and structural effect.
- Judge fill level by reported usage; file bytes and line counts are not context usage.
- If runtime auto-compacts, a \`pre-compact-<timestamp>\` checkpoint is created automatically.

### Boundary playbook

Read this before acting when target selection is non-obvious, fronts are interleaved, an anchor is missing, archived detail must be recovered, task-end travel would save almost nothing, or a checkpoint name collides. The core rules above own the discipline; this embedded playbook adds decisions and worked examples.

#### Decision tree

Ask in order:

1. Does \`NEXT\` still need the raw detail? Keep it live; checkpoint if useful.
2. Is the final answer next, or did a new request arrive after finished work? **Task chain.**
3. Was temporary output distilled into findings, paths, errors, or IDs? **Burst.**
4. Was an attempt rejected, falsified, or superseded? **Failed direction.**
5. Is one repeatable item done while more remain? **Batch item.**
6. Will \`NEXT\` use a conclusion rather than its trail? **Phase.**
7. None fit? Keep the context live and checkpoint the next stable point.

Before travel: name the boundary, choose a target before it, reject anchors from the wrong front, and confirm one executable \`NEXT\`. Nearest and earliest anchors are candidates, not defaults. **Preview measures; boundary decides.**

#### Filled handoffs

Each example demonstrates information density and fact placement; adapt its shape to the current boundary.

##### Burst → implementation

\`\`\`text
Goal: Fix excessive CPU use while preserving the sidebar.
State: Profiling confirmed hidden tabs keep rendering and retain workers; implementation is next.
Evidence: src/sidebar/session-manager.ts; artifacts/sidebar-profile.json; \`bun test sidebar\`.
External: No files changed; profiler stopped.
Exclusions: Preserve the sidebar; disabling or killing it violates the goal.
Recover: checkpoint sidebar-profile-start; raw profiling trail is archived.
NEXT: Checkpoint sidebar-lifecycle-fix-start, then inspect tab disposal in src/sidebar/session-manager.ts.
\`\`\`

Travel to \`sidebar-profile-start\`. Because \`NEXT\` starts a phase, checkpoint it before inspecting the file.

##### Failed direction → next attempt

\`\`\`text
Goal: Stop duplicate API requests after session restore.
State: Disabling the response cache did not change request count; duplication occurs before cache lookup.
Evidence: logs/restore-debug.log; test restore-replay shows two dispatch calls.
External: Debug logging remains enabled in config/local.json.
Exclusions: Cache invalidation is ruled out; both requests enter dispatch independently.
Recover: cache-hypothesis-start; backup cache-hypothesis-done.
NEXT: Checkpoint dispatch-replay-start, then trace callers of dispatchRestoredRequest.
\`\`\`

Travel to \`cache-hypothesis-start\`. Put the rejected approach in \`Exclusions\`, and surviving facts in \`State\` and \`Evidence\`.

##### Batch item → reusable method

\`\`\`text
Goal: Migrate twelve provider fixtures to the normalized schema.
State: Items 1-4 pass; eight remain. Method: rename model_id, normalize headers, run the fixture test.
Evidence: fixtures/providers/a.json through d.json; \`bun test provider-fixtures\`.
External: Four fixture files changed; no remote changes.
Exclusions: Provider C uses the standard parser; a stale snapshot caused its failure.
Recover: checkpoint migration-method-ready.
NEXT: Migrate fixtures/providers/e.json with the established method.
\`\`\`

Travel to \`migration-method-ready\`. Preserve the tally and method, not item-specific exploration.

##### Finished chain → new request

\`\`\`text
Goal: Release fix complete. New request: "Add a dry-run mode to the migration command."
State: Validation passed and v2.4.1 was pushed; migration work has not started.
Evidence: commit 1a2b3c4; \`bun test\`; tag v2.4.1.
External: Commit and tag pushed to origin.
Exclusions: The version-detection workaround remains rejected.
Recover: backup release-fix-done.
NEXT: Checkpoint migration-dry-run-start, then inspect the migration command entry point.
\`\`\`

Travel to \`release-fix-start\` with \`backupCurrentHeadAs: "release-fix-done"\`. Quote the triggering request because its turn leaves context.

#### Interleaved fronts

1. List active, parked, and completed fronts.
2. Compress one named front at a time.
3. Choose that front's pre-boundary anchor or raw node, even when another front has a newer checkpoint.
4. Use an older anchor or \`root\` only when the handoff can carry a small capsule for every surviving front.
5. Give parked fronts state and recovery pointers, but keep one global \`NEXT\`.

\`\`\`text
State: Active — auth retry. Parked — release notes awaiting CI. Done — provider audit.
Evidence: Auth: src/auth/retry.ts. Release: run 4182. Audit: docs/provider-audit.md.
Recover: auth-trace-done; release-notes-paused; provider-audit-done.
NEXT: Add the bounded retry guard in src/auth/retry.ts.
\`\`\`

#### Missing anchor

1. If orientation is poor, checkpoint the current meaningful turn as an archive pointer.
2. Call \`acm_timeline\`; on large trees prefer \`list_checkpoints\` or \`search\` before \`full_tree\`.
3. Find the last clean node before the named boundary.
4. Confirm it is outside the material being folded.
5. Travel to that raw node ID with the handoff.

The target is the last clean node outside the boundary; a labeled node inside the burst, phase, or failed attempt is invalid.

#### Recover archived detail and return

Recovery is a round trip:

1. Checkpoint the summary branch as \`<front>-resume\`.
2. Travel to the archive pointer with a temporary handoff whose \`NEXT\` is the exact lookup.
3. Extract only the needed value, wording, error, or reasoning.
4. Travel back to \`<front>-resume\` with that extract and its evidence pointer.
5. Confirm structural effect and refresh/sync status; resume the original \`NEXT\`.

\`\`\`javascript
acm_checkpoint({ name: "parser-fix-resume" });
acm_travel({ target: "parser-investigation-done", summary: "<lookup handoff>" });
// Recover: Unexpected token at byte 418.
acm_travel({ target: "parser-fix-resume", summary: "<resume handoff carrying byte 418>" });
\`\`\`

Return to \`<front>-resume\` before unrelated implementation. Stay on the archive branch only when intentionally abandoning the summary branch.

#### Task end with almost no saving

If the final answer is next and preview shows almost no saving, create a unique \`<task>-done\` checkpoint and answer directly. If saving is meaningful, use task-end travel with \`backupCurrentHeadAs\` and answer from the handoff branch.

#### Checkpoint name collision

Names are tree-wide, unique, and case-sensitive. Search existing names, preserve the semantic base, then add the smallest useful scope, ordinal, or date:

\`\`\`text
parser-fix-api-v2-start
release-validation-20260710-start
sidebar-power-investigation-2-start
\`\`\`

Generic names such as \`checkpoint-1\`, \`new-start\`, or \`temp-done\` carry no recovery meaning.

#### Failure patterns

- **Anchor gravity** — choosing the nearest checkpoint before naming the boundary.
- **Preview authority** — allowing estimated saving to define the boundary.
- **Premature fold** — removing detail still needed by \`NEXT\`.
- **Placeholder handoff** — writing field labels instead of conclusions and pointers.
- **Competing NEXTs** — assigning several fronts immediate actions.
- **Archive drift** — recovering detail, then accidentally continuing on the archive branch.
- **Task-end no-op** — traveling when a done checkpoint preserves the same working set.`;

// ── Closing ───────────────────────────────────────────────────────────────

export const CLOSING_SECTION = `## Closing

Structure and hygiene are parallel, not sequential. You do not finish one before starting the other — checkpoint and fold at boundaries (structure), tag and reduce between them (hygiene). Both run continuously throughout every task.

When in doubt: if the completed work is a phase or larger, it is a structural fold. If it is a single tool output you already used, it is hygiene. Act on whichever applies; both is often correct.`;

// ── Unified builder ───────────────────────────────────────────────────────

/**
 * Assemble the complete Magic-Acm-Context prompt section.
 *
 * @param mcSection - The Magic Context guidance block produced by
 *   buildMagicContextSection(). Spliced between ACM and Closing.
 * @returns The full unified prompt string.
 */
export function buildUnifiedPromptSection(mcSection: string): string {
	return `${FOREWORD_SECTION}\n\n${ACM_SECTION}\n\n${mcSection}\n\n${CLOSING_SECTION}`;
}

/**
 * @deprecated Use buildUnifiedPromptSection() instead. Retained for
 * compatibility during migration of the omp-plugin package.
 */
export const ACM_PROMPT_SECTION = ACM_SECTION;
