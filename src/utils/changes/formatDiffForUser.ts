import { CalendarDiff, CalendarEvent } from "@/types";

import { lexicon } from "@/lexicon";

import { formatDateToRussian } from "../date/formatDateToRussian";

export function formatDiffForUser(diff: CalendarDiff): string {
	const addedByDate: Record<string, string[]> = {};
	const removedByDate: Record<string, string[]> = {};
	const changedByDate: Record<string, string[]> = {};

	const formatDate = (date?: string | Date | undefined) => (date ? formatDateToRussian(date) : lexicon.withoutDate);

	for (const event of diff.added) {
		const date = formatDate(event.start);
		if (!addedByDate[date]) addedByDate[date] = [];
		addedByDate[date].push(`➕ ${event.summary}`);
	}

	for (const event of diff.removed) {
		const date = formatDate(event.start);
		if (!removedByDate[date]) removedByDate[date] = [];
		removedByDate[date].push(`➖ ${event.summary}`);
	}

	for (const event of diff.changed) {
		const date = formatDate(event.eventDate);

		if (!changedByDate[date]) changedByDate[date] = [];

		const changes: string[] = [];
		for (const key in event.changes) {
			const change = event.changes[key as keyof CalendarEvent];
			if (change) {
				const oldValue = change.old instanceof Date ? change.old.toLocaleString() : change.old;
				const newValue = change.new instanceof Date ? change.new.toLocaleString() : change.new;
				changes.push(`   📎 <i>${oldValue} → ${newValue}</i>`);
			}
		}

		changedByDate[date].push(`${event.summary}\n${changes.join("\n")}`);
	}

	const buildBlock = (title: string, data: Record<string, string[]>) => {
		const lines: string[] = [];
		if (Object.keys(data).length === 0) return "";

		lines.push(`<b>${title}</b>`);
		for (const date of Object.keys(data).sort()) {
			lines.push(` <i>${date}</i>`);
			for (const line of data[date]) lines.push(`  ${line}`);
		}
		lines.push("");
		return lines.join("\n");
	};

	return [
		buildBlock(lexicon.addedByDate, addedByDate),
		buildBlock(lexicon.removedByDate, removedByDate),
		buildBlock(lexicon.changedByDate, changedByDate),
	]
		.filter(Boolean)
		.join("\n");
}
