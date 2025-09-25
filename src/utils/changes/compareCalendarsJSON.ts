import { getCurrentCalendarEvents } from "@/scripts";

import { CalendarDiff, CalendarEvent, ChangedEvent } from "@/types";

export function compareCalendarsJSON(icsOld: string, icsNew: string): string {
	const oldEventsArray = getCurrentCalendarEvents(icsOld);
	const newEventsArray = getCurrentCalendarEvents(icsNew);

	const oldEvents: Record<string, CalendarEvent> = {};
	const newEvents: Record<string, CalendarEvent> = {};

	oldEventsArray.forEach((event) => (oldEvents[event.id] = event));
	newEventsArray.forEach((event) => (newEvents[event.id] = event));

	const removed: CalendarEvent[] = [];
	const added: CalendarEvent[] = [];
	const changed: ChangedEvent[] = [];

	for (const id in oldEvents) {
		if (!(id in newEvents)) removed.push(oldEvents[id]);
	}

	for (const id in newEvents) {
		if (!(id in oldEvents)) added.push(newEvents[id]);
	}

	for (const id in oldEvents) {
		if (id in newEvents) {
			const oldEvent = oldEvents[id];
			const newEvent = newEvents[id];

			const diffs: Partial<
				Record<keyof CalendarEvent, { old: string | Date | undefined; new: string | Date | undefined }>
			> = {};

			for (const key of Object.keys(oldEvent) as (keyof CalendarEvent)[]) {
				if (key === "url") continue;

				const oldValue = oldEvent[key];
				const newValue = newEvent[key];

				if (key === "description" && typeof oldValue === "string" && typeof newValue === "string") {
					const parseField = (desc: string, field: string) => {
						const match = desc.match(new RegExp(`${field}:\\s*(.*)`));
						return match ? match[1].trim() : undefined;
					};

					const lecturerOld = parseField(oldValue, "Lecturer");
					const lecturerNew = parseField(newValue, "Lecturer");

					if (lecturerOld !== lecturerNew) {
						diffs["lecturer"] = diffs["lecturer"] || { old: "", new: "" };
						diffs["lecturer"].old += lecturerOld ? lecturerOld : "";
						diffs["lecturer"].new += lecturerNew ? lecturerNew : "";
					}

					const classTypeOld = parseField(oldValue, "Class type");
					const classTypeNew = parseField(newValue, "Class type");

					if (classTypeOld !== classTypeNew) {
						diffs["classType"] = diffs["classType"] || { old: "", new: "" };
						diffs["classType"].old += classTypeOld ? classTypeOld : "";
						diffs["classType"].new += classTypeNew ? classTypeNew : "";
					}

					continue;
				}

				if (oldValue instanceof Date && newValue instanceof Date) {
					if (oldValue.getTime() !== newValue.getTime()) {
						diffs[key] = { old: oldValue, new: newValue };
					}
				} else if (oldValue !== newValue) {
					diffs[key] = { old: oldValue as string | Date, new: newValue as string | Date };
				}
			}

			if (Object.keys(diffs).length > 0) {
				changed.push({
					UID: id,
					summary: newEvent.summary,
					changes: diffs,
					eventDate: newEvent.start || oldEvent.start,
				});
			}
		}
	}

	const calendarDiff: CalendarDiff = { removed, added, changed };
	return JSON.stringify(calendarDiff, null, 2);
}
