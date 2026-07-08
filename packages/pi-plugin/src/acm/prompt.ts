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

### Leading words

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

Call \`acm_travel\` at these stable boundaries by default. Skip only when the fold preview shows almost no saving.

#### Task end

The final answer should be written from the handoff, not the trail. At task end, fold before answering:

\`\`\`javascript
acm_travel({
  target: "<task-chain-start>",
  backupCurrentHeadAs: "<task>-done",
  summary: "<handoff>"
});
\`\`\`

Then answer from the handoff branch. If a \`-done\` checkpoint already bookmarks the raw path, name it in the handoff's \`Recover\` slot.

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

Name the boundary first, then choose the target:

- Burst → pre-burst anchor or last clean node before the output.
- Phase → the phase's \`-start\`.
- Failed direction → where the attempt began, or the last \`-done\` milestone behind it.
- Batch item → the method anchor that should survive item-to-item.
- Task chain → earliest \`-start\` of the semantic chain being compressed, not the earliest start in the whole conversation.
- Missing anchor → \`acm_timeline\`, pick the last clean node ID before the boundary, then travel to that node.

Older anchors can be better targets when the handoff can carry the state. A newer anchor is not automatically better.

### After travel

You are on the handoff branch. Execute \`NEXT\`, then checkpoint the next phase before its first action. Disk and external systems were not rolled back; inspect them directly when in doubt. If a handoff dropped detail, re-fetch from \`Evidence\` first, then recover from \`Archive\` by traveling to the backup or off-path node.

### Mechanics

- Checkpoint names are unique across the tree and case-sensitive; one node may hold multiple aliases.
- Omitting checkpoint \`target\` auto-anchors the nearest meaningful USER/AI turn near HEAD; passing a node ID anchors any past node retroactively.
- \`acm_timeline\` mode precedence: \`list_checkpoints\` > \`search\` > \`full_tree\` > active path. Never conclude an anchor is missing from a truncated \`full_tree\`.
- Travel can shrink or grow context: traveling to a later or off-path target can restore raw history. Read the reported usage and structural effect.
- Judge fill level by reported usage, never by file bytes or lines read.
- If runtime auto-compacts, a \`pre-compact-<timestamp>\` checkpoint is created automatically.

### Boundary playbook

#### Burst boundary

A burst is a temporary expansion: big read, broad search, log fetch, large diff, subagent, or any tool output you could not bound before calling it.

**Signal**: you have extracted the finding, paths, commands, errors, or IDs needed for the next action.

**Target**: the pre-burst checkpoint. If missing, use \`acm_timeline\` and choose the last clean node ID before the burst.

**Handoff owns**: extract, evidence pointer, NEXT.

**Failure mode**: keeping raw output live after the extract is stable.

#### Phase boundary

A phase boundary appears when the next action uses the phase result, not the raw path that produced it.

**Signal**: investigation becomes implementation; implementation becomes validation; diagnosis becomes fix; reading becomes answer.

**Target**: the phase \`-start\`.

**Handoff owns**: conclusion, decision, next phase.

**Failure mode**: waiting for a new user message even though the next phase has already begun.

#### Failed-direction boundary

A failed direction is a branch whose raw trail should not pollute the next attempt.

**Signal**: an approach failed, a hypothesis was falsified, a design direction was rejected, or a path was superseded.

**Target**: the attempt start or last milestone.

**Handoff owns**: what failed, why, what survives.

**Failure mode**: continuing with a dead trail in the working set because it was expensive to produce.

#### Batch boundary

Batch work accumulates hidden context debt because each item feels small.

**Signal**: one item is complete and more remain.

**Target**: the method anchor: the point after the reusable method is known and before item-specific noise begins.

**Handoff owns**: tally, method refinements, next item.

**Failure mode**: judging each fold by small immediate savings. Batch folds compound.

#### Task-chain boundary

**Signal**: the final answer is next; or a new user request arrives over finished work.

**Target**: the earliest \`-start\` of the semantic chain being compressed.

**Handoff owns**: final state, answer material, recovery pointer.

**Failure mode**: anchor gravity toward the most recent task or phase anchor. Fold by boundary, not proximity.

#### None of these fit

Use the fold gate: Boundary named. NEXT executable. Raw recoverable. If any gate fails, keep the context live and checkpoint the next stable point.`;

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
