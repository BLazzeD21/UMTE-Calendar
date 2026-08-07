import { existsSync, readFileSync } from "fs";

import { GroupConfig } from "@/types";

import { lexicon } from "@/lexicon";

import { CONFIG } from "./config";
import { logger } from "./logger";

const fromEnvironment = (): GroupConfig[] => {
	const { UMTE_USERNAME, UMTE_PASSWORD, CHAT_ID, TOPIC_ID } = process.env;

	if (!UMTE_USERNAME || !UMTE_PASSWORD) {
		logger.error(lexicon.log.missingEnvVars);
		return [];
	}

	return [
		{
			id: "calendar",
			name: "calendar",
			username: UMTE_USERNAME,
			password: UMTE_PASSWORD,
			chatId: CHAT_ID || undefined,
			topicId: TOPIC_ID || undefined,
		},
	];
};

const parseGroups = (raw: unknown): GroupConfig[] => {
	if (!Array.isArray(raw)) {
		logger.error(lexicon.log.groupsFileNotArray);
		return [];
	}

	const groups: GroupConfig[] = [];
	const usedIds = new Set<string>();

	raw.forEach((entry, index) => {
		const id = typeof entry?.id === "string" ? entry.id.trim() : "";

		if (!CONFIG.groupIdPattern.test(id)) {
			logger.error(lexicon.log.groupSkippedBadId(index));
			return;
		}

		if (usedIds.has(id)) {
			logger.error(lexicon.log.groupSkippedDuplicateId(index, id));
			return;
		}

		if (!entry.username || !entry.password) {
			logger.error(lexicon.log.groupSkippedNoCredentials(index, id));
			return;
		}

		usedIds.add(id);

		const group: GroupConfig = {
			id: id,
			name: entry.name ? String(entry.name) : id,
			username: String(entry.username),
			password: String(entry.password),
			chatId: entry.chatId ? String(entry.chatId) : undefined,
			topicId: entry.topicId ? String(entry.topicId) : undefined,
			calendarUrl: entry.calendarUrl ? String(entry.calendarUrl) : undefined,
		};

		if (!group.chatId) {
			logger.warn(lexicon.log.groupWithoutChat(group.name));
		}

		groups.push(group);
	});

	return groups;
};

export const loadGroups = (): GroupConfig[] => {
	if (!existsSync(CONFIG.files.groups)) {
		logger.warn(lexicon.log.groupsFileMissing);

		return fromEnvironment();
	}

	try {
		const groups = parseGroups(JSON.parse(readFileSync(CONFIG.files.groups, "utf-8")));

		if (groups.length) {
			logger.info(lexicon.log.groupsLoaded(groups.length));
		}

		return groups;
	} catch (error) {
		logger.error(lexicon.log.groupsFileUnreadable(error));

		return [];
	}
};
