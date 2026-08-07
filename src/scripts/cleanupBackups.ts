import { promises } from "fs";
import path from "path";

import { CONFIG } from "@/config";

import { GroupLogger, GroupPaths } from "@/types";

import { lexicon } from "@/lexicon";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const cleanupBackups = async (paths: GroupPaths, log: GroupLogger): Promise<void> => {
	const expiresBefore = Date.now() - CONFIG.backupRetentionDays * DAY_IN_MS;

	try {
		const entries = await promises.readdir(paths.backupDir, { withFileTypes: true });

		const files: { path: string; mtimeMs: number }[] = [];

		for (const entry of entries) {
			if (!entry.isFile() || !entry.name.endsWith(".ics") || entry.name === paths.backupActual.name) {
				continue;
			}

			const filePath = path.join(paths.backupDir, entry.name);
			const { mtimeMs } = await promises.stat(filePath);

			files.push({ path: filePath, mtimeMs: mtimeMs });
		}

		if (files.length <= 1) {
			return;
		}

		files.sort((a, b) => b.mtimeMs - a.mtimeMs);

		const expired = files.slice(1).filter((file) => file.mtimeMs < expiresBefore);

		for (const file of expired) {
			await promises.unlink(file.path);
		}

		if (expired.length) {
			log.info(lexicon.log.backupsRemoved(expired.length, CONFIG.backupRetentionDays));
		}
	} catch (error) {
		if (error?.code === "ENOENT") {
			return;
		}

		log.warn(lexicon.log.backupCleanupFailed(error));
	}
};
