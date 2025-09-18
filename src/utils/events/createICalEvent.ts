import { ICalCalendar } from "ical-generator";

import { setAlarms } from "@/utils";

export const createICalEvent = (
	eventData: {
		id: string;
		start: Date;
		end: Date;
		summary: string;
		description?: string;
		location?: string;
		url?: string;
	},
	calendar: ICalCalendar,
) => {
	const { id, start, end, summary, description, location, url } = eventData;
	const icalEvent = calendar.createEvent({
		id,
		start,
		end,
		summary,
		description,
		location,
		url,
	});

	setAlarms(icalEvent);
};
