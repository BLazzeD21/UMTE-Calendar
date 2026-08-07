import ical, { ICalCalendar, ICalCalendarMethod } from "ical-generator";

import { getCurrentCalendarEvents } from "@/scripts";

import { getNewEvents, getOldEvents, setCalendarEvents } from "@/utils";

import { ClassSchedule, GroupLogger } from "@/types";

import { lexicon } from "@/lexicon";

export const getUpdatedCalendar = async (
	calendarFile: string,
	schedule: ClassSchedule,
	log: GroupLogger,
): Promise<ICalCalendar | null> => {
	log.info(lexicon.log.existingCalendarTransform);

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
		log.warn(lexicon.log.noEventsFound);
		return null;
	}

	calendar.clear();

	await setCalendarEvents(oldCalendarEvents, newCalendarEvents, calendar);

	const [oldEventsLength, parsedEventsLength] = [oldCalendarEvents.length, newCalendarEvents.length];
	const totalEventsLength = calendar.length();

	log.info(lexicon.log.calendarStats(oldEventsLength, parsedEventsLength, totalEventsLength));

	return calendar;
};
