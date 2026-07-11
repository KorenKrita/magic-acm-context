# magic-acm-context

Magic Context + ACM (Active Context Management) unified extension for pi and omp.

## Architecture

- **ACM** (primary) — structural context management via checkpoint/travel/fold
- **MC** (auxiliary) — content-level housekeeping: reduce, search, memory, note, expand

### Packages

| Package | Description |
|---------|-------------|
| `packages/plugin` | MC core (shared, platform-agnostic) |
| `packages/pi-plugin` | Pi extension: MC pi adapter + ACM pi tools + unified prompt |
| `packages/omp-plugin` | OMP extension: MC omp adapter + ACM omp tools + unified prompt |

### How it works

1. The extension registers Magic Context's `ctx_*` tools and canonical ACM's `acm_*` tools through the OMP ExtensionAPI.
2. The consumer registers exactly one `before_agent_start` prompt owner. Canonical ACM prompt registration is disabled; the consumer calls `ensureAcmCoreSegment`, then composes Magic Context-owned segments without flattening unrelated segment boundaries.
3. The OMP package ships an advanced Skill for non-obvious target selection, archive round trips, and exceptional recovery. Normal-path guidance remains in CORE rather than being duplicated in the Skill or this README.

### System Prompt Structure

```text
## Magic Context
├── Long-term partner frame
├── ctx_reduce mechanics
├── ctx_note / ctx_memory / ctx_search / ctx_expand guidance
└── Reduction triggers

## Context Management (ACM)
├── Generated always-on CORE from the canonical source
├── Generated tool descriptions, result cues, and recovery guidance
└── Model-invoked advanced Skill with three focused references
```

### Collaboration Model

- ACM owns structural context operations and the session-tree boundary.
- Magic Context owns content-level reduction, history search, notes, and durable memory.
- The integrated wrapper composes those systems; it does not fork the ACM contract.

## Canonical ACM maintenance

[`omp-context`](https://github.com/KorenKrita/omp-context) is the **sole canonical ACM implementation and guidance source**. This repository is a consumer. The scheduled workflow publishes OMP ACM only through canonical `scripts/sync-acm.mjs`; the old OMP copier/injector authority has been removed. A checked consumer-owned `scripts/omp-integration.patch` restores only the integration seam after Magic Context upstream sync and fails closed when upstream no longer matches.

Run synchronization from an `omp-context` checkout:

```bash
bun run sync:acm -- \
  --canonical-root /path/to/omp-context \
  --consumer-root /path/to/magic-acm-context
```

Use `--verify-only` to prove every mapped artifact and the generated provenance stamp match without writing. Publication stages and independently validates every output, then uses a rollback journal so a failure cannot leave a partial ACM surface. The command performs no Git operations; review and commit each repository separately.

## Exact OMP support

The integrated OMP plugin supports exactly OMP `16.4.5`. Its `@oh-my-pi/pi-coding-agent`, `@oh-my-pi/pi-agent-core`, `@oh-my-pi/pi-ai`, and `@oh-my-pi/pi-tui` peer and development versions must move atomically. There is no compatibility range or multi-version shim.

Candidate upgrades are first exercised by the synchronized isolated host fixture. The fixture installs its own frozen lock, builds ACM source inside the fixture package, and proves all runtime OMP imports resolve from that package before running real SessionManager and captured extension-handler tests.

## Verification

After synchronization, run:

```bash
bun run --cwd packages/omp-plugin verify:acm
bun run --cwd packages/omp-plugin typecheck
bun run --cwd packages/omp-plugin test
bun run --cwd packages/omp-plugin build
```

`verify:acm` is non-mutating. It checks generated guidance, exact package/fixture versions, the isolated real-host suite, and `acm-provenance.json` hashes for the complete synchronized surface.

The generator must be idempotent, sync verification must report no writes, the real-host fixture must resolve only its pinned OMP packages, and the built plugin's default export must remain callable.

## Host limitations

- OMP `16.4.5` does not expose an atomic tree-navigation/state-sync API to ordinary tool contexts. Typed mutation ports inspect the actual label journal and resulting leaf, return `not_applied` / `applied` / `indeterminate`, and schedule context refresh whenever branch mutation occurred or cannot be excluded.
- `branchWithSummary()` updates the session tree without directly replacing host-owned `agent.state.messages`; the extension rebuilds provider context through the public `context` event instead of mutating private agent state.
- Native pre-prompt compaction may inspect stale host-owned messages once after travel. The plugin does not cancel or replace native compaction.
- Travel changes the session tree and future model context. It **does not roll back files, processes, browser state, commits, or remote side effects**.
