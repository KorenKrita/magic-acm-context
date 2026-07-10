import type {
	ExtensionAPI,
	ExtensionCommandContext,
	Theme,
} from "@earendil-works/pi-coding-agent";
import {
	type Component,
	truncateToWidth,
	visibleWidth,
} from "@earendil-works/pi-tui";

type ThemeColor = Parameters<Theme["fg"]>[0];

interface ContextUsage {
	tokens?: number | null;
	contextWindow?: number | null;
	percent?: number | null;
}

interface ContextPart {
	type?: string;
	text?: string;
	[key: string]: unknown;
}

interface ContextBranchEntry {
	type?: string;
	summary?: string;
	message?: {
		role?: string;
		content?: string | ContextPart[];
		command?: string;
	};
}

interface ContextCategory {
	label: string;
	value: number;
	color: ThemeColor;
}

export interface ContextUsageBreakdown {
	total: number;
	limit: number;
	percent: number;
	categories: ContextCategory[];
}

function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

function safeStringify(value: unknown): string {
	try {
		return JSON.stringify(value) ?? "";
	} catch {
		return "";
	}
}

function formatTokens(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
	return String(value);
}

export function buildContextUsageBreakdown(
	pi: ExtensionAPI,
	ctx: ExtensionCommandContext,
	usage: ContextUsage,
): ContextUsageBreakdown | null {
	const total = usage.tokens;
	const limit = usage.contextWindow;
	const percent = usage.percent;
	if (
		typeof total !== "number" ||
		typeof limit !== "number" ||
		typeof percent !== "number" ||
		limit <= 0
	) {
		return null;
	}

	let messageTokensRaw = 0;
	let toolCallTokensRaw = 0;
	let toolResultTokensRaw = 0;
	const branch = (ctx.sessionManager.getBranch?.() ??
		[]) as ContextBranchEntry[];

	for (const entry of branch) {
		if (entry.type === "message" && entry.message) {
			const message = entry.message;
			if (message.role === "user" || message.role === "assistant") {
				if (typeof message.content === "string") {
					messageTokensRaw += estimateTokens(message.content);
				} else if (Array.isArray(message.content)) {
					for (const part of message.content) {
						if (part.type === "text" && typeof part.text === "string") {
							messageTokensRaw += estimateTokens(part.text);
						} else if (
							message.role === "assistant" &&
							part.type === "toolCall"
						) {
							toolCallTokensRaw += estimateTokens(safeStringify(part));
						}
					}
				}
			} else if (
				message.role === "toolResult" &&
				Array.isArray(message.content)
			) {
				for (const part of message.content) {
					if (part.type === "text" && typeof part.text === "string") {
						toolResultTokensRaw += estimateTokens(part.text);
					}
				}
			} else if (message.role === "bashExecution") {
				toolCallTokensRaw += estimateTokens(message.command ?? "");
			}
		} else if (entry.type === "branch_summary" || entry.type === "compaction") {
			messageTokensRaw += estimateTokens(entry.summary ?? "");
		}
	}

	const systemTokensRaw = estimateTokens(ctx.getSystemPrompt());
	const activeToolNames = new Set(pi.getActiveTools());
	const activeToolDefinitions = pi
		.getAllTools()
		.filter((tool) => activeToolNames.has(tool.name));
	const toolDefinitionTokensRaw = estimateTokens(
		safeStringify(activeToolDefinitions),
	);
	const rawTotal =
		systemTokensRaw +
		toolDefinitionTokensRaw +
		messageTokensRaw +
		toolCallTokensRaw +
		toolResultTokensRaw;
	const ratio = rawTotal > 0 ? total / rawTotal : 1;
	const systemTokens = Math.round(systemTokensRaw * ratio);
	const toolDefinitionTokens = Math.round(toolDefinitionTokensRaw * ratio);
	const messageTokens = Math.round(messageTokensRaw * ratio);
	const toolCallTokens = Math.round(toolCallTokensRaw * ratio);
	const toolResultTokens = Math.round(toolResultTokensRaw * ratio);
	const attributedTokens =
		systemTokens +
		toolDefinitionTokens +
		messageTokens +
		toolCallTokens +
		toolResultTokens;

	const categories: ContextCategory[] = [
		{ label: "System Prompt", value: systemTokens, color: "muted" },
		{ label: "System Tools", value: toolDefinitionTokens, color: "dim" },
		{
			label: "Tool Call",
			value: toolCallTokens + toolResultTokens,
			color: "success",
		},
		{ label: "Messages", value: messageTokens, color: "accent" },
	];
	const otherTokens = Math.max(0, total - attributedTokens);
	if (otherTokens > 10) {
		categories.push({ label: "Other", value: otherTokens, color: "dim" });
	}
	categories.push({
		label: "Available",
		value: Math.max(0, limit - total),
		color: "borderMuted",
	});

	return { total, limit, percent, categories };
}

class ContextUsageComponent implements Component {
	constructor(
		private readonly breakdown: ContextUsageBreakdown,
		private readonly theme: Theme,
		private readonly done: (value: undefined) => void,
	) {}

	handleInput(): void {
		this.done(undefined);
	}

	invalidate(): void {}

	render(width: number): string[] {
		const safeWidth = Math.max(20, width);
		const innerWidth = safeWidth - 4;
		const border = (text: string) => this.theme.fg("accent", text);
		const side = border("│");
		const line = (content = "") => {
			const truncated = truncateToWidth(content, innerWidth, "…");
			const padding = " ".repeat(
				Math.max(0, innerWidth - visibleWidth(truncated)),
			);
			return `${side} ${truncated}${padding} ${side}`;
		};
		const lines = [
			border(`╭${"─".repeat(safeWidth - 2)}╮`),
			line(this.theme.fg("accent", this.theme.bold("Context Usage"))),
			line(),
		];

		const grid = this.renderGrid();
		const details = this.renderDetails();
		const rowCount = Math.max(grid.length, details.length);
		for (let index = 0; index < rowCount; index++) {
			const left = (grid[index] ?? "").padEnd(20);
			lines.push(line(`  ${left}   ${details[index] ?? ""}`));
		}
		lines.push(line());
		lines.push(line(this.theme.fg("dim", "Press any key to close")));
		lines.push(border(`╰${"─".repeat(safeWidth - 2)}╯`));
		return lines;
	}

	private renderGrid(): string[] {
		const totalBlocks = 50;
		const blocks: Array<{ color: ThemeColor; filled: boolean }> = [];
		for (const category of this.breakdown.categories) {
			if (category.label === "Available") continue;
			let count = Math.round(
				(category.value / this.breakdown.limit) * totalBlocks,
			);
			if (count === 0 && category.value > 0) count = 1;
			for (
				let index = 0;
				index < count && blocks.length < totalBlocks;
				index++
			) {
				blocks.push({ color: category.color, filled: true });
			}
		}
		while (blocks.length < totalBlocks) {
			blocks.push({ color: "borderMuted", filled: false });
		}

		const rows: string[] = [];
		for (let row = 0; row < 5; row++) {
			let text = "";
			for (let column = 0; column < 10; column++) {
				const block = blocks[row * 10 + column];
				if (block) {
					text += this.theme.fg(block.color, block.filled ? "■ " : "□ ");
				}
			}
			rows.push(text.trimEnd());
		}
		return rows;
	}

	private renderDetails(): string[] {
		const total = this.breakdown.total;
		const limit = this.breakdown.limit;
		const title = `${this.theme.bold("Total Usage".padEnd(16))} ${this.theme.bold(
			formatTokens(total).padStart(7),
		)} ${this.theme.bold(`(${this.breakdown.percent.toFixed(1).padStart(5)}%)`)}`;
		return [
			title,
			"",
			...this.breakdown.categories.map((category) => {
				const icon = category.label === "Available" ? "□" : "■";
				const percentage = ((category.value / limit) * 100)
					.toFixed(1)
					.padStart(5);
				return `${this.theme.fg(category.color, icon)} ${category.label.padEnd(
					14,
				)} ${formatTokens(category.value).padStart(7)} (${percentage}%)`;
			}),
		];
	}
}

export function registerContextCommand(pi: ExtensionAPI): void {
	pi.registerCommand("context", {
		description: "Show context usage visualization",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify(
					"/context is available only in interactive TUI mode.",
					"warning",
				);
				return;
			}
			const usage = await ctx.getContextUsage();
			const breakdown = usage
				? buildContextUsageBreakdown(pi, ctx, usage)
				: null;
			if (!breakdown) {
				ctx.ui.notify("Context usage info not available.", "warning");
				return;
			}

			await ctx.ui.custom<undefined>(
				(_tui, theme, _keybindings, done) =>
					new ContextUsageComponent(breakdown, theme, done),
				{
					overlay: true,
					overlayOptions: { anchor: "center", width: 66 },
				},
			);
		},
	});
}
