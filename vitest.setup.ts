// Obsidian injects `activeDocument` as a global (the document of the focused
// window, for popout support). Tests run under jsdom, which only provides
// `document`, so alias it here for code that renders via `activeDocument`.
(globalThis as unknown as { activeDocument: Document }).activeDocument =
	globalThis.document;
