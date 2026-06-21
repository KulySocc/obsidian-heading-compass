import { filterHeadingsByLevels, type HeadingLevel, type ParsedHeading } from "../parsing/headings";

export interface RenderedOutlineNode {
	heading: ParsedHeading;
	itemEl: HTMLLIElement;
	linkEl: HTMLAnchorElement;
	contextualListEl: HTMLUListElement | null;
}

export interface RenderedOutlineMaps {
	linkByHeadingId: Map<string, HTMLAnchorElement>;
	nodeByHeadingId: Map<string, RenderedOutlineNode>;
	contextualLinkByHeadingId: Map<string, HTMLAnchorElement>;
}

const LINK_CLASS = "outline-plus-floating-outline__link";
const CONTEXTUAL_LINK_CLASS = `${LINK_CLASS} outline-plus-floating-outline__link--contextual`;
const CONTEXTUAL_LIST_CLASS = "outline-plus-floating-outline__contextual-list";
const CONTEXTUAL_ITEM_CLASS = "outline-plus-floating-outline__contextual-item";
const CONTEXTUAL_LIST_SELECTOR = `ul.${CONTEXTUAL_LIST_CLASS}`;

// Heading IDs are slug-derived (parsing/headings.ts), so editing a heading's
// text churns both its text and its id on every keystroke. Reconciling the
// existing DOM in place — instead of replaceChildren() — keeps node identity
// stable across keystrokes, which avoids the teardown/reflow that made the
// floating outline flicker while typing. Click handlers are bound once per
// element and read the current heading from this WeakMap so reused links never
// fire a stale callback.
type LinkBinding = { heading: ParsedHeading; onClick: (heading: ParsedHeading) => void };
const linkBindings = new WeakMap<HTMLAnchorElement, LinkBinding>();

export function renderOutline(
	container: HTMLUListElement,
	allHeadings: ParsedHeading[],
	enabledLevels: Set<HeadingLevel>,
	onHeadingClick: (heading: ParsedHeading) => void,
): RenderedOutlineMaps {
	const maps: RenderedOutlineMaps = {
		linkByHeadingId: new Map(),
		nodeByHeadingId: new Map(),
		contextualLinkByHeadingId: new Map(),
	};

	const headings = filterHeadingsByLevels(allHeadings, enabledLevels);
	if (headings.length === 0) {
		container.replaceChildren();
		return maps;
	}

	const usedNestedLists = new Set<HTMLUListElement>();

	const firstLevel = headings[0]!.level;
	type Frame = { level: number; list: HTMLUListElement; cursor: number; lastItem: HTMLLIElement | null };
	const levelStack: Frame[] = [{ level: firstLevel, list: container, cursor: 0, lastItem: null }];

	for (const heading of headings) {
		while (levelStack.length > 1 && heading.level < levelStack[levelStack.length - 1]!.level) {
			const popped = levelStack.pop()!;
			trimListAfter(popped.list, popped.cursor);
		}

		let target = levelStack[levelStack.length - 1]!;
		if (heading.level < target.level && levelStack.length === 1) {
			target.level = heading.level;
		}

		while (target.level < heading.level) {
			if (!target.lastItem) {
				break;
			}
			const nestedList = reuseOrCreateNestedList(target.lastItem);
			usedNestedLists.add(nestedList);
			const frame: Frame = { level: target.level + 1, list: nestedList, cursor: 0, lastItem: null };
			levelStack.push(frame);
			target = frame;
		}

		const li = reuseOrCreateListItem(target.list, target.cursor);
		target.cursor += 1;

		const link = reuseOrCreateLink(li, LINK_CLASS);
		updateLink(link, heading);
		bindLink(link, heading, onHeadingClick);

		maps.linkByHeadingId.set(heading.id, link);
		maps.nodeByHeadingId.set(heading.id, {
			heading,
			itemEl: li,
			linkEl: link,
			contextualListEl: null,
		});

		target.lastItem = li;
	}

	while (levelStack.length > 1) {
		const popped = levelStack.pop()!;
		trimListAfter(popped.list, popped.cursor);
	}
	trimListAfter(container, levelStack[0]!.cursor);

	removeStaleNestedLists(container, usedNestedLists);

	for (const [, node] of maps.nodeByHeadingId) {
		reconcileContextualList(node, allHeadings, enabledLevels, onHeadingClick, maps);
	}

	return maps;
}

function reconcileContextualList(
	node: RenderedOutlineNode,
	allHeadings: ParsedHeading[],
	enabledLevels: Set<HeadingLevel>,
	onHeadingClick: (heading: ParsedHeading) => void,
	maps: RenderedOutlineMaps,
): void {
	const children = getDirectHiddenChildren(node.heading, allHeadings, enabledLevels);
	const existing = node.itemEl.querySelector<HTMLUListElement>(`:scope > ${CONTEXTUAL_LIST_SELECTOR}`);

	if (children.length === 0) {
		existing?.remove();
		node.contextualListEl = null;
		return;
	}

	let list = existing;
	if (!list) {
		list = activeDocument.createElement("ul");
		list.className = CONTEXTUAL_LIST_CLASS;
		list.setAttribute("aria-hidden", "true");
		node.itemEl.appendChild(list);
	}

	for (let index = 0; index < children.length; index += 1) {
		const child = children[index]!;
		const item = reuseOrCreateContextualItem(list, index);
		const link = reuseOrCreateLink(item, CONTEXTUAL_LINK_CLASS);
		updateLink(link, child);
		bindLink(link, child, onHeadingClick);
		maps.contextualLinkByHeadingId.set(child.id, link);
	}
	trimListAfter(list, children.length);

	node.contextualListEl = list;
}

function reuseOrCreateNestedList(li: HTMLLIElement): HTMLUListElement {
	const existing = li.querySelector<HTMLUListElement>(`:scope > ul:not(.${CONTEXTUAL_LIST_CLASS})`);
	if (existing) {
		return existing;
	}
	const list = activeDocument.createElement("ul");
	const contextual = li.querySelector<HTMLUListElement>(`:scope > ${CONTEXTUAL_LIST_SELECTOR}`);
	li.insertBefore(list, contextual);
	return list;
}

function reuseOrCreateListItem(list: HTMLUListElement, cursor: number): HTMLLIElement {
	const candidate = list.children[cursor];
	if (candidate instanceof HTMLLIElement) {
		return candidate;
	}
	const li = activeDocument.createElement("li");
	list.insertBefore(li, candidate ?? null);
	return li;
}

function reuseOrCreateContextualItem(list: HTMLUListElement, cursor: number): HTMLLIElement {
	const item = reuseOrCreateListItem(list, cursor);
	if (item.className !== CONTEXTUAL_ITEM_CLASS) {
		item.className = CONTEXTUAL_ITEM_CLASS;
	}
	return item;
}

function reuseOrCreateLink(parent: HTMLElement, className: string): HTMLAnchorElement {
	const first = parent.firstElementChild;
	if (first instanceof HTMLAnchorElement) {
		return first;
	}
	const link = activeDocument.createElement("a");
	link.className = className;
	link.href = "#";
	parent.insertBefore(link, parent.firstChild);
	return link;
}

// Only mutate identity/content here. State classes (is-active, is-expanded …)
// are owned by the controller and must survive element reuse, so className is
// never rewritten on an existing link.
function updateLink(link: HTMLAnchorElement, heading: ParsedHeading): void {
	if (link.dataset.headingId !== heading.id) {
		link.dataset.headingId = heading.id;
	}
	if (link.textContent !== heading.text) {
		link.textContent = heading.text;
	}
	if (link.title !== heading.text) {
		link.title = heading.text;
	}
}

function bindLink(
	link: HTMLAnchorElement,
	heading: ParsedHeading,
	onClick: (heading: ParsedHeading) => void,
): void {
	const alreadyBound = linkBindings.has(link);
	linkBindings.set(link, { heading, onClick });
	if (alreadyBound) {
		return;
	}
	link.addEventListener("click", (event) => {
		event.preventDefault();
		const binding = linkBindings.get(link);
		binding?.onClick(binding.heading);
	});
}

function trimListAfter(list: HTMLUListElement, cursor: number): void {
	while (list.children.length > cursor) {
		list.lastElementChild?.remove();
	}
}

function removeStaleNestedLists(container: HTMLUListElement, used: Set<HTMLUListElement>): void {
	const nestedLists = container.querySelectorAll<HTMLUListElement>(`ul:not(.${CONTEXTUAL_LIST_CLASS})`);
	nestedLists.forEach((list) => {
		if (!used.has(list)) {
			list.remove();
		}
	});
}

function getDirectHiddenChildren(
	parent: ParsedHeading,
	allHeadings: ParsedHeading[],
	enabledLevels: Set<HeadingLevel>,
): ParsedHeading[] {
	if (parent.level >= 6) {
		return [];
	}

	const childLevel = (parent.level + 1) as HeadingLevel;
	if (enabledLevels.has(childLevel)) {
		return [];
	}

	const parentIndex = allHeadings.findIndex((h) => h.id === parent.id);
	if (parentIndex < 0) {
		return [];
	}

	const children: ParsedHeading[] = [];
	for (let i = parentIndex + 1; i < allHeadings.length; i += 1) {
		const candidate = allHeadings[i];
		if (!candidate) continue;
		if (candidate.level <= parent.level) break;
		if (candidate.level === childLevel) children.push(candidate);
	}

	return children;
}
