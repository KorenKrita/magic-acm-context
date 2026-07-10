import { describe, expect, it } from "bun:test";
import { visibleWidth } from "@earendil-works/pi-tui";
import { buildContextUsageBreakdown, registerContextCommand } from "./context";

type Handler = (args: string, ctx: unknown) => Promise<void>;

function createPi() {
	const handlers = new Map<string, Handler>();
	return {
		handlers,
		pi: {
			registerCommand(name: string, options: { handler: Handler }) {
				handlers.set(name, options.handler);
			},
			getActiveTools: () => ["ctx_search"],
			getAllTools: () => [
				{
					name: "ctx_search",
					description: "Search context",
					parameters: { type: "object" },
				},
				{
					name: "inactive_tool",
					description: "Not sent to the model",
					parameters: { type: "object" },
				},
			],
		},
	};
}

function createContext() {
	return {
		hasUI: true,
		sessionManager: {
			getBranch: () => [
				{
					type: "message",
					message: { role: "user", content: "User message".repeat(20) },
				},
				{
					type: "message",
					message: {
						role: "assistant",
						content: [
							{ type: "text", text: "Assistant response".repeat(20) },
							{
								type: "toolCall",
								name: "ctx_search",
								arguments: { query: "history" },
							},
						],
					},
				},
				{
					type: "message",
					message: {
						role: "toolResult",
						content: [{ type: "text", text: "Search result".repeat(20) }],
					},
				},
			],
		},
		getSystemPrompt: () => "System prompt".repeat(20),
		getContextUsage: () => ({
			tokens: 500,
			contextWindow: 1_000,
			percent: 50,
		}),
	};
}

describe("/context command", () => {
	it("builds a calibrated breakdown using only active tool definitions", () => {
		const { pi } = createPi();
		const breakdown = buildContextUsageBreakdown(
			pi as never,
			createContext() as never,
			{ tokens: 500, contextWindow: 1_000, percent: 50 },
		);

		expect(breakdown).not.toBeNull();
		expect(breakdown?.categories.map((category) => category.label)).toEqual([
			"System Prompt",
			"System Tools",
			"Tool Call",
			"Messages",
			"Available",
		]);
		expect(
			breakdown?.categories.find((category) => category.label === "Available")
				?.value,
		).toBe(500);
	});

	it("registers the command and renders a width-safe interactive overlay", async () => {
		const { pi, handlers } = createPi();
		const rendered: string[][] = [];
		let closed = false;
		let overlayOptions: unknown;
		registerContextCommand(pi as never);
		const ctx = {
			...createContext(),
			ui: {
				notify() {},
				async custom(factory: unknown, options: unknown) {
					overlayOptions = options;
					const component = (
						factory as (
							tui: unknown,
							theme: {
								fg: (_color: string, text: string) => string;
								bold: (text: string) => string;
							},
							keybindings: unknown,
							done: (value: undefined) => void,
						) => {
							render: (width: number) => string[];
							handleInput: (data: string) => void;
						}
					)(
						{},
						{ fg: (_color, text) => text, bold: (text) => text },
						{},
						() => {
							closed = true;
						},
					);
					rendered.push(component.render(48));
					component.handleInput("x");
				},
			},
		};

		await handlers.get("context")?.("", ctx);

		expect(overlayOptions).toMatchObject({
			overlay: true,
			overlayOptions: { anchor: "center", width: 66 },
		});
		const lines = rendered.flat();
		expect(lines.join("\n")).toContain("Context Usage");
		expect(lines.join("\n")).toContain("System Prompt");
		expect(lines.every((line) => visibleWidth(line) <= 48)).toBe(true);
		expect(closed).toBe(true);
	});

	it("warns instead of opening a custom component outside TUI mode", async () => {
		const { pi, handlers } = createPi();
		const notifications: string[] = [];
		let customCalled = false;
		registerContextCommand(pi as never);
		const ctx = {
			...createContext(),
			hasUI: false,
			ui: {
				notify(message: string) {
					notifications.push(message);
				},
				async custom() {
					customCalled = true;
				},
			},
		};

		await handlers.get("context")?.("", ctx);

		expect(customCalled).toBe(false);
		expect(notifications).toEqual([
			"/context is available only in interactive TUI mode.",
		]);
	});
});
