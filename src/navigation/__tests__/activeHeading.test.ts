import { describe, expect, it } from "vitest";
import type { ParsedHeading } from "../../parsing/headings";
import type { HeadingLevel } from "../../parsing/headings";
import {
	findHeadingForLine,
	resolveActiveHeadingForLevels,
	findNearestContextualChild,
	getVisibleHeadingChain,
} from "../activeHeading";

function h(level: HeadingLevel, line: number, id?: string): ParsedHeading {
	return {
		id: id ?? `h${level}-${line}`,
		text: `Heading ${level} at ${line}`,
		level,
		line,
		offset: line * 10,
		matchText: `heading ${level} at ${line}`,
	};
}

function levels(...ns: HeadingLevel[]): Set<HeadingLevel> {
	return new Set(ns);
}

// ─── resolveActiveHeadingForLevels ───────────────────────────────────────────

describe("resolveActiveHeadingForLevels", () => {
	it("returns null for an empty heading list", () => {
		expect(resolveActiveHeadingForLevels([], 0, levels(1))).toBeNull();
	});

	it("returns null when no heading levels are enabled", () => {
		expect(resolveActiveHeadingForLevels([h(1, 0)], 0, levels())).toBeNull();
	});

	it("returns the enabled heading covering the active line", () => {
		const headings = [h(1, 0), h(2, 5), h(1, 10)];
		expect(resolveActiveHeadingForLevels(headings, 5, levels(1, 2))).toBe(headings[1]);
	});

	it("falls back to the nearest enabled ancestor when the raw heading is at a disabled level", () => {
		// H1, H2, H3 — only H1 and H2 enabled — cursor at H3
		const headings = [h(1, 0), h(2, 5), h(3, 8)];
		expect(resolveActiveHeadingForLevels(headings, 8, levels(1, 2))).toBe(headings[1]);
	});

	it("falls back to the nearest enabled heading before the active line when no ancestor matches", () => {
		// H3, H2, H3 — only H3 enabled — cursor at H2
		const headings = [h(3, 0), h(2, 5), h(3, 10)];
		expect(resolveActiveHeadingForLevels(headings, 5, levels(3))).toBe(headings[0]);
	});

	it("falls back to the first enabled heading in the document when nothing precedes the active line", () => {
		// H2, H1 — only H1 enabled — cursor at H2 (before any H1)
		const headings = [h(2, 0), h(1, 5)];
		expect(resolveActiveHeadingForLevels(headings, 0, levels(1))).toBe(headings[1]);
	});
});

// ─── findNearestContextualChild ──────────────────────────────────────────────

describe("findNearestContextualChild", () => {
	it("returns null for an empty heading list", () => {
		expect(findNearestContextualChild([], h(2, 0), levels(1))).toBeNull();
	});

	it("returns the heading itself when it is a contextual child (level disabled, level-1 enabled)", () => {
		// H1 enabled, H2 disabled → H2 is a contextual child
		const headings = [h(1, 0), h(2, 5)];
		expect(findNearestContextualChild(headings, headings[1]!, levels(1))).toBe(headings[1]);
	});

	it("returns a contextual ancestor when the given heading is not itself a contextual child", () => {
		// H1 enabled, H2 disabled (contextual child of H1), H3 disabled
		// cursor is at H3 — H3 is not a contextual child (level-1=2 is disabled), H2 is
		const headings = [h(1, 0), h(2, 5), h(3, 8)];
		expect(findNearestContextualChild(headings, headings[2]!, levels(1))).toBe(headings[1]);
	});

	it("returns null when no heading in the chain is a contextual child", () => {
		// Only H2s — none is a contextual child because level-1 (H1) is not enabled
		const headings = [h(2, 0), h(2, 5)];
		expect(findNearestContextualChild(headings, headings[1]!, levels(2))).toBeNull();
	});
});

// ─── getVisibleHeadingChain ───────────────────────────────────────────────────

describe("getVisibleHeadingChain", () => {
	it("returns an empty array when the heading is not in the list", () => {
		const headings = [h(1, 0)];
		const ghost = h(1, 99, "ghost-id");
		expect(getVisibleHeadingChain(headings, ghost, levels(1))).toEqual([]);
	});

	it("returns only the active heading when it is enabled and has no enabled ancestors", () => {
		const headings = [h(1, 0)];
		expect(getVisibleHeadingChain(headings, headings[0]!, levels(1))).toEqual([headings[0]]);
	});

	it("does not include the active heading when it is at a disabled level", () => {
		// H1 enabled, H2 disabled — cursor at H2
		const headings = [h(1, 0), h(2, 5)];
		const chain = getVisibleHeadingChain(headings, headings[1]!, levels(1));
		expect(chain).toEqual([headings[0]]);
	});

	it("returns chain of enabled ancestors from the active heading up", () => {
		// H1, H2, H3 — all enabled — cursor at H3
		const headings = [h(1, 0), h(2, 5), h(3, 8)];
		const chain = getVisibleHeadingChain(headings, headings[2]!, levels(1, 2, 3));
		expect(chain).toEqual([headings[2], headings[1], headings[0]]);
	});
});

// ─── findHeadingForLine ───────────────────────────────────────────────────────

describe("findHeadingForLine", () => {
	it("returns null for an empty heading list", () => {
		expect(findHeadingForLine([], 0)).toBeNull();
	});

	it("returns the heading whose line matches exactly", () => {
		const headings = [h(1, 0), h(2, 5), h(2, 10)];
		expect(findHeadingForLine(headings, 5)).toBe(headings[1]);
	});

	it("returns null when activeLine is before the first heading", () => {
		const headings = [h(1, 5), h(2, 10)];
		expect(findHeadingForLine(headings, 2)).toBeNull();
	});

	it("returns the last heading before activeLine when no exact match", () => {
		const headings = [h(1, 0), h(2, 5), h(1, 10)];
		expect(findHeadingForLine(headings, 7)).toBe(headings[1]);
	});
});
