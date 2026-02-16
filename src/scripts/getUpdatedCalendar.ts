import ical, { ICalCalendar, ICalCalendarMethod } from "ical-generator";

import { logger } from "@/config";

import { getCurrentCalendarEvents } from "@/scripts";

import { getNewEvents, getOldEvents, setCalendarEvents } from "@/utils";

import { ClassSchedule } from "@/types";

import { lexicon } from "@/lexicon";

export const getUpdatedCalendar = async (
	calendarFile: string,
	schedule: ClassSchedule,
): Promise<ICalCalendar | null> => {
	logger.info(lexicon.log.existingCalendarTransform);

	const todayTimestamp = new Date();
	todayTimestamp.setHours(0, 0, 0, 0);

	const calendarEvents = getCurrentCalendarEvents(calendarFile);
	const oldCalendarEvents = getOldEvents(calendarEvents, todayTimestamp);
	const newCalendarEvents = getNewEvents(schedule, todayTimestamp);

	const calendar: ICalCalendar = ical({
		name: "UMTE",
		description: "Class Schedule",
		method: ICalCalendarMethod.PUBLISH,
		timezone: "Europe/Moscow",
	});

	if (!oldCalendarEvents.length && !newCalendarEvents.length) {
		logger.warn(lexicon.log.noEventsFound);
		return null;
	}

	calendar.clear();

	await setCalendarEvents(oldCalendarEvents, newCalendarEvents, calendar);

	const [oldEventsLength, parsedEventsLength] = [oldCalendarEvents.length, newCalendarEvents.length];
	const totalEventsLength = calendar.length();

	logger.info(lexicon.log.calendarStats(oldEventsLength, parsedEventsLength, totalEventsLength));

	return calendar;
};
