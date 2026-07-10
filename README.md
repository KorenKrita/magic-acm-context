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

1. Extension registers all tools (MC's ctx_* + ACM's acm_*) via platform ExtensionAPI
2. `before_agent_start` injects unified system prompt: MC guidance + ACM discipline
3. No skill file needed — all behavioral guidance is always in context

### System Prompt Structure

```
## Magic Context
├── Long-term partner frame
├── ctx_reduce mechanics
├── ctx_note / ctx_memory / ctx_search / ctx_expand guidance
└── Reduction triggers

## Context Management (ACM)
├── Core decision vocabulary (working set, boundary, handoff, chain)
├── Fold gate (boundary named, NEXT executable, raw recoverable)
├── Checkpoint discipline and semantic anchor naming
├── Boundary-first fold discipline and task-end no-saving fallback
├── Handoff contract (7 slots) and after-travel ordering
└── Embedded playbook (decision tree, filled handoffs, recovery edge cases)
```

### Collaboration Model

- ACM defines the structural backbone (checkpoints at boundaries, travel when needed)
- MC fills the gaps between checkpoints (reduce spent outputs, search history, persist knowledge)
- Most checkpoint intervals are maintained by reduce alone; travel only at real boundaries
