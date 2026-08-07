import path from "path";

import { GroupPaths } from "@/types";

const ROOT_DIR = process.cwd();
const BACKUP_ACTUAL_NAME = "ActualCalendar.ics";

export const CONFIG = {
	dirs: {
		calendar: path.join(ROOT_DIR, "calendar"),
		backup: path.join(ROOT_DIR, "backup"),
	},
	files: {
		groups: path.join(ROOT_DIR, "groups.json"),
	},
	schedulerDelay: 60 * 60 * 1000, // 1 hour
	schedulerRule: "0 * * * *",
	messageMaxLength: 2000,
	sendAttempts: 3,
	sendRetryDelay: 2000,
	groupIdPattern: /^[a-zA-Z0-9_-]+$/,
};

export const getGroupPaths = (groupId: string): GroupPaths => {
	const backupDir = path.join(CONFIG.dirs.backup, groupId);

	return {
		calendar: path.join(CONFIG.dirs.calendar, `${groupId}.ics`),
		backupDir: backupDir,
		backupActual: {
			name: BACKUP_ACTUAL_NAME,
			path: path.join(backupDir, BACKUP_ACTUAL_NAME),
		},
	};
};
