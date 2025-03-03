import ical from "node-ical";

import { CalendarEvent, URLDetails } from "@/types";

export const getCurrentCalendarEvents = (calendarData: string): CalendarEvent[] => {
	let events: CalendarEvent[] = [];

	const parsedData = ical.parseICS(calendarData);

	for (const key in parsedData) {
		const event = parsedData[key];

		if (event.type === "VEVENT") {
			let url: URLDetails | string | undefined = undefined;

			if (event.url) {
				if (typeof event.url === "object") {
					url = event.url;
				} else {
					url = event.url.toString();
				}
			}

			events.push({
				type: "VEVENT",
				id: event.uid || "",
				summary: event.summary || "",
				start: event.start || undefined,
				end: event.end || undefined,
				location: event.location || "",
				description: event.description || "",
				url: url || "",
			});
		}
	}

	return events;
};
