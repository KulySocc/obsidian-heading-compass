import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

async function resolveTargetDir() {
	const envDir = process.env.OBSIDIAN_VAULT_PLUGIN_DIR;
	if (envDir) return path.resolve(envDir);

	// Fall back to .env file if present
	try {
		const envFile = await fs.readFile(path.join(process.cwd(), ".env"), "utf8");
		const match = envFile.match(/^OBSIDIAN_VAULT_PLUGIN_DIR=(.+)$/m);
		if (match) return path.resolve(match[1].trim());
	} catch {
		// no .env file — that's fine
	}

	throw new Error(
		"OBSIDIAN_VAULT_PLUGIN_DIR is not set.\n" +
		"Set it in your shell or create a .env file:\n" +
		"  OBSIDIAN_VAULT_PLUGIN_DIR=/path/to/your/vault/.obsidian/plugins/outline-plus",
	);
}

const SOURCE_DIR = process.cwd();
const REQUIRED_FILES = ["main.js", "manifest.json"];
const OPTIONAL_FILES = ["styles.css"];
const PRESERVE_IN_TARGET = new Set(["data.json"]);

async function ensureReadableFile(filePath) {
	try {
		const stats = await fs.stat(filePath);
		if (!stats.isFile()) {
			throw new Error(`${filePath} is not a file.`);
		}
	} catch (error) {
		throw new Error(`Missing required artifact: ${filePath}`, { cause: error });
	}
}

async function pathExists(filePath) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function cleanTargetDirectory(targetDir) {
	const entries = await fs.readdir(targetDir, { withFileTypes: true });
	const allowed = new Set([...REQUIRED_FILES, ...OPTIONAL_FILES, ...PRESERVE_IN_TARGET]);

	await Promise.all(
		entries.map(async (entry) => {
			if (allowed.has(entry.name)) {
				return;
			}

			await fs.rm(path.join(targetDir, entry.name), { recursive: true, force: true });
		}),
	);
}

async function copyArtifacts(targetDir) {
	for (const fileName of REQUIRED_FILES) {
		await fs.copyFile(path.join(SOURCE_DIR, fileName), path.join(targetDir, fileName));
	}

	for (const fileName of OPTIONAL_FILES) {
		const sourceFile = path.join(SOURCE_DIR, fileName);
		const targetFile = path.join(targetDir, fileName);
		if (await pathExists(sourceFile)) {
			await fs.copyFile(sourceFile, targetFile);
			continue;
		}

		if (await pathExists(targetFile)) {
			await fs.rm(targetFile, { force: true });
		}
	}
}

async function deploy() {
	const targetDir = await resolveTargetDir();

	for (const fileName of REQUIRED_FILES) {
		await ensureReadableFile(path.join(SOURCE_DIR, fileName));
	}

	await fs.mkdir(targetDir, { recursive: true });
	await cleanTargetDirectory(targetDir);
	await copyArtifacts(targetDir);

	console.log(`Deployed ${[...REQUIRED_FILES, ...OPTIONAL_FILES].join(", ")} to:`);
	console.log(targetDir);
	console.log("Preserved in target (if present): data.json");
}

deploy().catch((error) => {
	console.error("Deploy failed.");
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
