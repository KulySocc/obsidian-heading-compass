import { describe, expect, it, vi } from "vitest";
import { renderOutline } from "../renderOutline";
import type { ParsedHeading } from "../../parsing/headings";

function makeHeading(overrides: Partial<ParsedHeading> & { level: ParsedHeading["level"] }): ParsedHeading {
	return {
		id: `h${overrides.level}-l0`,
		text: "Heading",
		line: 0,
		offset: 0,
		matchText: "heading",
		...overrides,
	};
}

function makeContainer(): HTMLUListElement {
	return document.createElement("ul");
}

describe("renderOutline", () => {
	describe("flat list", () => {
		it("populates one <li> per heading with matching link text", () => {
			const headings = [
				makeHeading({ id: "h1-l0", text: "First", level: 1 }),
				makeHeading({ id: "h1-l1", text: "Second", level: 1 }),
				makeHeading({ id: "h1-l2", text: "Third", level: 1 }),
			];
			const container = makeContainer();

			renderOutline(container, headings, new Set([1]), vi.fn());

			const items = container.querySelectorAll("li");
			expect(items).toHaveLength(3);
			const links = container.querySelectorAll("a");
			expect([...links].map((a) => a.textContent)).toEqual(["First", "Second", "Third"]);
		});
	});

	describe("mixed levels", () => {
		it("nests child items inside their parent <li>", () => {
			const headings = [
				makeHeading({ id: "h1-l0", text: "Parent", level: 1 }),
				makeHeading({ id: "h2-l1", text: "Child", level: 2 }),
			];
			const container = makeContainer();

			renderOutline(container, headings, new Set([1, 2]), vi.fn());

			const topItems = container.querySelectorAll(":scope > li");
			expect(topItems).toHaveLength(1);
			const nestedItems = container.querySelectorAll("li > ul > li");
			expect(nestedItems).toHaveLength(1);
			expect(nestedItems[0]?.querySelector("a")?.textContent).toBe("Child");
		});
	});

	describe("click callback", () => {
		it("calls onHeadingClick with the clicked heading", () => {
			const heading = makeHeading({ id: "h1-l0", text: "Click Me", level: 1 });
			const container = makeContainer();
			const onHeadingClick = vi.fn();

			const maps = renderOutline(container, [heading], new Set([1]), onHeadingClick);

			const link = maps.linkByHeadingId.get("h1-l0");
			link?.click();

			expect(onHeadingClick).toHaveBeenCalledOnce();
			expect(onHeadingClick).toHaveBeenCalledWith(heading);
		});
	});

	describe("linkByHeadingId map", () => {
		it("contains an entry for every rendered heading", () => {
			const headings = [
				makeHeading({ id: "h1-l0", text: "A", level: 1 }),
				makeHeading({ id: "h2-l1", text: "B", level: 2 }),
				makeHeading({ id: "h1-l2", text: "C", level: 1 }),
			];
			const container = makeContainer();

			const maps = renderOutline(container, headings, new Set([1, 2]), vi.fn());

			expect(maps.linkByHeadingId.size).toBe(3);
			expect(maps.linkByHeadingId.has("h1-l0")).toBe(true);
			expect(maps.linkByHeadingId.has("h2-l1")).toBe(true);
			expect(maps.linkByHeadingId.has("h1-l2")).toBe(true);
		});
	});

	describe("contextual children", () => {
		it("leaves contextualListEl null when a heading has no hidden children", () => {
			const headings = [
				makeHeading({ id: "h1-l0", text: "Lone", level: 1 }),
			];
			const container = makeContainer();

			const maps = renderOutline(container, headings, new Set([1, 2]), vi.fn());

			expect(maps.nodeByHeadingId.get("h1-l0")?.contextualListEl).toBeNull();
		});

		it("sets contextualListEl when a heading has hidden children", () => {
			const headings = [
				makeHeading({ id: "h1-l0", text: "Parent", level: 1 }),
				makeHeading({ id: "h2-l1", text: "Hidden Child", level: 2 }),
			];
			const container = makeContainer();

			const maps = renderOutline(container, headings, new Set([1]), vi.fn());

			const contextualList = maps.nodeByHeadingId.get("h1-l0")?.contextualListEl;
			expect(contextualList).not.toBeNull();
			expect(contextualList?.querySelector("a")?.textContent).toBe("Hidden Child");
		});
	});

	describe("enabled levels filtering", () => {
		it("excludes headings at disabled levels as list items but includes them as contextual children", () => {
			const headings = [
				makeHeading({ id: "h1-l0", text: "Section", level: 1 }),
				makeHeading({ id: "h2-l1", text: "Sub A", level: 2 }),
				makeHeading({ id: "h2-l2", text: "Sub B", level: 2 }),
			];
			const container = makeContainer();

			const maps = renderOutline(container, headings, new Set([1]), vi.fn());

			expect(maps.linkByHeadingId.has("h2-l1")).toBe(false);
			expect(maps.linkByHeadingId.has("h2-l2")).toBe(false);

			const contextualList = maps.nodeByHeadingId.get("h1-l0")?.contextualListEl;
			expect(contextualList).not.toBeNull();
			const contextualTexts = [...(contextualList?.querySelectorAll("a") ?? [])].map((a) => a.textContent);
			expect(contextualTexts).toEqual(["Sub A", "Sub B"]);
		});
	});
});
