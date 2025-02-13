import ical, { ICalCalendar, ICalCalendarMethod } from "ical-generator";

import { colors } from "../utils/colors.js";
import { prepareEventData } from "../utils/prepareEventData.js";

import { ScheduleItem, GenerateCalendarProps } from "../types/index.js";
import { log } from "../utils/log.js";

import { setAlarms } from "../utils/events/setAlarms.js";

export const generateCalendar = async ({ schedule }: GenerateCalendarProps) => {
	log("Creating a new iCalendar instance", colors.blue);

	const calendar: ICalCalendar = ical({
		name: "UMTE",
		description: "Class Schedule",
		method: ICalCalendarMethod.PUBLISH,
		timezone: "Europe/Moscow",
	});

	schedule.forEach(async (scheduleItem: ScheduleItem) => {
		const { startDate, endDate, description, summary, url, uid, place } = prepareEventData({ scheduleItem });

		const icalEvent = calendar.createEvent({
			id: uid,
			start: startDate,
			end: endDate,
			summary: summary,
			description: description,
			location: place,
			url: url,
		});

		setAlarms(url, icalEvent);
	});

	return calendar;
};
