import { describe, expect, it, vi } from "vitest";
import { renderOutline } from "../renderOutline";
import { parseHeadings } from "../../parsing/headings";

// Regression: typing into a heading must not tear down the floating outline.
// Heading ids are slug-derived, so every keystroke changes both text and id;
// renderOutline must reconcile the existing DOM in place rather than rebuild it.
describe("typing a heading does not rebuild the outline DOM", () => {
	it("reuses the same <a> element when only one char is typed", () => {
		const container = document.createElement("ul");

		renderOutline(container, parseHeadings("# Hell\n## Sub"), new Set([1, 2]), vi.fn());
		const linkBefore = container.querySelector("a");

		renderOutline(container, parseHeadings("# Hello\n## Sub"), new Set([1, 2]), vi.fn());
		const linkAfter = container.querySelector("a");

		expect(linkAfter).toBe(linkBefore);
		expect(linkAfter?.textContent).toBe("Hello");
		expect(linkAfter?.dataset.headingId).toBe("h1-hello");
	});

	it("preserves state classes (is-active) on reused elements across a keystroke", () => {
		const container = document.createElement("ul");

		renderOutline(container, parseHeadings("# Intro\n# Body"), new Set([1]), vi.fn());
		const second = container.querySelectorAll("a")[1]!;
		second.classList.add("is-active");

		// Type into the *first* heading; the second heading's element must persist.
		renderOutline(container, parseHeadings("# Introx\n# Body"), new Set([1]), vi.fn());
		const secondAfter = container.querySelectorAll("a")[1]!;

		expect(secondAfter).toBe(second);
		expect(secondAfter.classList.contains("is-active")).toBe(true);
	});

	it("reuses the contextual list element across a keystroke", () => {
		const container = document.createElement("ul");

		const before = renderOutline(container, parseHeadings("# Parent\n## Kid"), new Set([1]), vi.fn());
		const listBefore = before.nodeByHeadingId.get("h1-parent")?.contextualListEl;
		expect(listBefore).not.toBeNull();

		const after = renderOutline(container, parseHeadings("# Parentx\n## Kid"), new Set([1]), vi.fn());
		const listAfter = after.nodeByHeadingId.get("h1-parentx")?.contextualListEl;

		expect(listAfter).toBe(listBefore);
	});

	it("rebuilds structure when headings are added or removed", () => {
		const container = document.createElement("ul");

		renderOutline(container, parseHeadings("# A\n# B"), new Set([1]), vi.fn());
		expect(container.querySelectorAll(":scope > li")).toHaveLength(2);

		renderOutline(container, parseHeadings("# A"), new Set([1]), vi.fn());
		expect(container.querySelectorAll(":scope > li")).toHaveLength(1);
		expect(container.querySelector("a")?.textContent).toBe("A");

		renderOutline(container, parseHeadings("# A\n## A1\n# C"), new Set([1, 2]), vi.fn());
		expect(container.querySelectorAll(":scope > li")).toHaveLength(2);
		expect(container.querySelectorAll("li > ul > li")).toHaveLength(1);
	});
});
