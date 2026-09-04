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
	cleanupRule: "0 3 1 * *", // 03:00 on the 1st of every month
	backupRetentionDays: 30,
	messageMaxLength: 2000,
	sendAttempts: 3,
	sendRetryDelay: 2000,
	groupIdPattern: /^[a-zA-Z0-9_-]+$/,
	adminIdPattern: /^\d+$/,
};

export const getCalendarUrl = (groupId: string): string | undefined => {
	const baseUrl = process.env.CALENDAR_BASE_URL?.trim();

	if (!baseUrl) {
		return undefined;
	}

	const origin = /^https?:\/\//i.test(baseUrl) ? baseUrl : `https://${baseUrl}`;

	return `${origin.replace(/\/+$/, "")}/${groupId}.ics`;
};

export const getApiRoot = (): string | undefined => {
	const apiRoot = process.env.TELEGRAM_API_ROOT?.trim();

	if (!apiRoot) {
		return undefined;
	}

	const origin = /^https?:\/\//i.test(apiRoot) ? apiRoot : `https://${apiRoot}`;

	return origin.replace(/\/+$/, "");
};

export const getAdminId = (): string | undefined => {
	const adminId = process.env.TELEGRAM_ADMIN_ID?.trim();

	if (!adminId || !CONFIG.adminIdPattern.test(adminId)) {
		return undefined;
	}

	return adminId;
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
