import ical from "node-ical";

import { CalendarEvent, URLDetails } from "@/types";

export const getCurrentCalendarEvents = (calendarData: string): CalendarEvent[] => {
	const events: CalendarEvent[] = [];

	const parsedData = ical.sync.parseICS(calendarData);

	for (const key in parsedData) {
		const event = parsedData[key];

		if (event.type === "VEVENT") {
			let url = "";

			if (event.url) {
				url = typeof event.url === "object" ? (event.url as URLDetails).val : event.url.toString();
			}

			events.push({
				type: "VEVENT",
				id: event.uid || "",
				summary: event.summary || "",
				start: event.start || undefined,
				end: event.end || undefined,
				location: event.location || "",
				description: event.description || "",
				url,
			});
		}
	}

	return events;
};
