# minAppVersion set to 1.5.7

We raised `minAppVersion` from `0.15.0` to `1.5.7` because heading parsing uses `getFrontMatterInfo` (added in Obsidian 1.5.7), and navigation uses `Workspace.setActiveLeaf` (0.16.3) and `Workspace.openLinkText` (0.16.0). The `obsidianmd/no-unsupported-api` lint rule flags these against a lower baseline.

## Considered options

- **Bump to 1.5.7 (chosen).** Exact minimum that covers all three APIs — maximum install reach for the features we use. 1.5.7 shipped in Feb 2024, so the audience cost is negligible.
- **Keep ~0.16.3 and hand-roll frontmatter parsing.** Rejected: replacing `getFrontMatterInfo` with our own parser adds code and edge-case bug risk (fenced blocks, `---` inside content) for marginally wider reach.
- **Pick a newer baseline (e.g. 1.13.0).** Rejected: costs reach with no current benefit. Note: the declarative settings API (`getSettingDefinitions`, which deprecates `display()`) needs 1.13.0 — if we ever adopt it, that would justify revisiting this number.
