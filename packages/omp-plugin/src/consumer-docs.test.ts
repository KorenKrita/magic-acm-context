import { describe, expect, test } from "bun:test";

const repoFile = (path: string) => Bun.file(new URL(path, import.meta.url)).text();

describe("consumer ACM maintainer documentation", () => {
  test("documents canonical ownership, sole sync authority, exact support, verification, and host limits", async () => {
    const readme = await repoFile("../../../README.md");

    for (const fact of [
      "https://github.com/KorenKrita/omp-context",
      "sole canonical ACM implementation and guidance source",
      "bun run sync:acm",
      "scheduled workflow publishes OMP ACM only through canonical",
      "16.4.2",
      "bun run --cwd packages/omp-plugin verify:acm",
      "acm-provenance.json",
      "agent.state.messages",
      "does not roll back files, processes, browser state, commits, or remote side effects",
    ]) {
      expect(readme).toContain(fact);
    }
    expect(readme).not.toContain("No skill file needed");
    expect(readme).toContain("advanced Skill");
  });

  test("keeps the published plugin README on the exact OMP contract", async () => {
    const readme = await repoFile("../README.md");

    expect(readme).toContain("`@oh-my-pi/pi-coding-agent@16.4.2`");
    expect(readme).toContain("bun run verify:acm");
    expect(readme).toContain("acm-provenance.json");
    expect(readme).toContain("one consumer-owned hook");
    expect(readme).not.toContain("@oh-my-pi/pi-coding-agent@^16");
    expect(readme).not.toContain("OMP v16+");
  });
});
