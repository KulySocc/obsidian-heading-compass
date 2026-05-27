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
	container.replaceChildren();

	if (headings.length === 0) {
		return maps;
	}

	const firstLevel = headings[0]!.level;
	const levelStack: Array<{ level: number; list: HTMLUListElement; lastItem: HTMLLIElement | null }> = [
		{ level: firstLevel, list: container, lastItem: null },
	];

	for (const heading of headings) {
		while (levelStack.length > 1 && heading.level < levelStack[levelStack.length - 1]!.level) {
			levelStack.pop();
		}

		let target = levelStack[levelStack.length - 1]!;
		if (heading.level < target.level && levelStack.length === 1) {
			target.level = heading.level;
		}

		while (target.level < heading.level) {
			if (!target.lastItem) {
				break;
			}
			const nestedList = document.createElement("ul");
			target.lastItem.appendChild(nestedList);
			target = { level: target.level + 1, list: nestedList, lastItem: null };
			levelStack.push(target);
		}

		const li = document.createElement("li");
		const link = document.createElement("a");
		link.className = "outline-plus-floating-outline__link";
		link.dataset.headingId = heading.id;
		link.href = "#";
		link.textContent = heading.text;
		link.title = heading.text;
		link.addEventListener("click", (event) => {
			event.preventDefault();
			onHeadingClick(heading);
		});

		li.appendChild(link);
		maps.linkByHeadingId.set(heading.id, link);
		maps.nodeByHeadingId.set(heading.id, {
			heading,
			itemEl: li,
			linkEl: link,
			contextualListEl: null,
		});
		target.list.appendChild(li);
		target.lastItem = li;
	}

	for (const [, node] of maps.nodeByHeadingId) {
		const children = getDirectHiddenChildren(node.heading, allHeadings, enabledLevels);
		if (children.length === 0) {
			continue;
		}

		const list = document.createElement("ul");
		list.className = "outline-plus-floating-outline__contextual-list";
		list.setAttribute("aria-hidden", "true");

		for (const child of children) {
			const item = document.createElement("li");
			item.className = "outline-plus-floating-outline__contextual-item";

			const link = document.createElement("a");
			link.className = "outline-plus-floating-outline__link outline-plus-floating-outline__link--contextual";
			link.dataset.headingId = child.id;
			link.href = "#";
			link.textContent = child.text;
			link.title = child.text;
			link.addEventListener("click", (event) => {
				event.preventDefault();
				onHeadingClick(child);
			});

			item.appendChild(link);
			list.appendChild(item);
			maps.contextualLinkByHeadingId.set(child.id, link);
		}

		node.itemEl.appendChild(list);
		node.contextualListEl = list;
	}

	return maps;
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
