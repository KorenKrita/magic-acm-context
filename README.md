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
├── Core concepts (working set, boundary, handoff, chain)
├── Fold gate (3 conditions)
├── Checkpoint discipline
├── Fold discipline (boundary → target table)
├── Handoff contract (7 slots)
├── Target selection rules
└── Boundary playbook
```

### Collaboration Model

- ACM defines the structural backbone (checkpoints at boundaries, travel when needed)
- MC fills the gaps between checkpoints (reduce spent outputs, search history, persist knowledge)
- Most checkpoint intervals are maintained by reduce alone; travel only at real boundaries
