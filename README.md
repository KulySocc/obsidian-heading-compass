# Outline Plus

Fast heading navigation for Obsidian with two complementary UIs:

- command palette for quick search + jump
- floating outline for always-visible structure + click navigation

## Features

- Open heading palette command: `Open heading palette` (ID: `open-heading-palette`)
- Native Obsidian modal (`FuzzySuggestModal`) with live fuzzy filtering
- Floating outline panel for the active note
- Jump to headings in both source and preview mode
- Tree-style hierarchy prefixes for readability
- Heading-level visibility toggles (`H1`-`H6`)
- Frontmatter and fenced code blocks are ignored while parsing headings
- Keyboard navigation in palette (`ArrowUp/Down`, `Option+Arrow`, `Cmd+Arrow`, `Enter`)

## Planned Features

- No additional planned features are documented yet.

## Installation

Until this plugin is available in the official plugins menu, install it manually:

- Run `npm install`
- Run `npm run build`
- Copy `main.js`, `manifest.json`, and `styles.css` to `<Vault>/.obsidian/plugins/outline-plus/`
- Reload Obsidian and enable **Outline Plus** in **Settings -> Community plugins**

## Development

```sh
npm install
npm run dev      # esbuild in watch mode
npm run deploy   # build + copy main.js/manifest.json/styles.css into your vault
npm test         # vitest
npm run lint     # eslint
```

Set `OBSIDIAN_VAULT_PLUGIN_DIR` (env or `.env`) to your vault's plugin folder for `deploy`.

## Release

```sh
npm version <patch|minor|major>
```

Builds, bumps manifests, tags, pushes, and creates the GitHub release via `gh`.
