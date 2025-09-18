import { normalizeICS } from "@/utils";

export const compareICSFiles = (calendar: string, actualCalendar: string) => {
	const calendarNormalized = normalizeICS(calendar);
	const actualCalendarNormalized = normalizeICS(actualCalendar);

	return calendarNormalized === actualCalendarNormalized;
};
