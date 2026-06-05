import tseslint from 'typescript-eslint';
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: [
						'eslint.config.js',
						'manifest.json',
					]
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json']
			},
		},
	},
	{
		files: ["scripts/**/*.mjs", "*.mjs"],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		// The obsidianmd recommended config registers its type-aware rules with no
		// `files` restriction, so they also run on non-TS files that have no TS parser
		// service and crash. Scope those rules off non-TS files; they remain active on .ts.
		files: ["**/*.json", "**/*.mjs", "**/*.cjs", "**/*.js", "**/*.jsx"],
		rules: {
			"obsidianmd/no-unsupported-api": "off",
			"obsidianmd/no-plugin-as-component": "off",
			"obsidianmd/no-view-references-in-plugin": "off",
			"obsidianmd/prefer-instanceof": "off",
			"obsidianmd/prefer-file-manager-trash-file": "off",
		},
	},
	{
		// Tests run under jsdom, which has no Obsidian `activeDocument` global.
		files: ["**/*.test.ts", "**/__tests__/**"],
		rules: {
			"obsidianmd/prefer-active-doc": "off",
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"eslint.config.js",
		"version-bump.mjs",
		"versions.json",
		"main.js",
		"vitest.config.ts",
		"vitest.setup.ts",
		// Generated, runtime, or tooling files — not part of the plugin source.
		"package-lock.json",
		"tsconfig.json",
		"data.json",
		"manifest.json",
		".claude/**",
		"scripts/**",
		"ralph/**",
		".scratch/**",
	]),
);
