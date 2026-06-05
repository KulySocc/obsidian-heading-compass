# Heading Compass

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

## Installation

### From Community plugins

1. Open **Settings → Community plugins** and turn off Restricted mode
2. Select **Browse**, search for **Heading Compass**, and install it
3. Enable **Heading Compass**

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/KulySocc/obsidian-heading-compass/releases/latest)
2. Copy them into `<Vault>/.obsidian/plugins/heading-compass/`
3. Reload Obsidian and enable **Heading Compass** in **Settings → Community plugins**

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
