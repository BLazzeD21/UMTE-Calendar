import ical, { ICalCalendar, ICalCalendarMethod, ICalAlarmType } from "ical-generator";

import { colors } from "../utils/colors.js";
import { prepareEventData } from "../utils/prepareEventData.js";

import { ScheduleItem, GenerateCalendarProps } from "src/types/index.js";

export const generateCalendar = async ({ schedule }: GenerateCalendarProps) => {
	console.log(`${colors.blue}Creating a new iCalendar instance...${colors.reset}`);

	const calendar: ICalCalendar = ical({
		name: "UMTE",
		description: "Class Schedule",
		method: ICalCalendarMethod.PUBLISH,
		timezone: "Europe/Moscow",
	});

	schedule.forEach(async (scheduleItem: ScheduleItem) => {
		console.log(`${colors.cyan}Processing event:${colors.reset}`, scheduleItem);

		const { startDate, endDate, description, summary, url, uid, place } = prepareEventData({ scheduleItem });

		console.log(`${colors.green}Event start time: ${startDate}${colors.reset}`);
		console.log(`${colors.green}Event end time: ${endDate}${colors.reset}`);

		console.log(`${colors.blue}Creating iCalendar event...${colors.reset}`);
		const icalEvent = calendar.createEvent({
			id: uid,
			start: startDate,
			end: endDate,
			summary: summary,
			description: description,
			location: place,
			url: url,
		});

		if (url !== null) {
			console.log(`${colors.cyan}Webinar link detected. Setting reminder 30 minutes before.${colors.reset}`);
			icalEvent.createAlarm({
				type: ICalAlarmType.display,
				trigger: 30 * 60,
			});
		} else {
			console.log(`${colors.yellow}No webinar link. Setting reminder 2 hours before.${colors.reset}`);
			icalEvent.createAlarm({
				type: ICalAlarmType.display,
				trigger: 120 * 60,
			});
		}

		console.log(`${colors.blue}Adding additional reminder 5 minutes before the event.${colors.reset}`);

		icalEvent.createAlarm({
			type: ICalAlarmType.display,
			trigger: 5 * 60,
		});
	});

	console.log(`${colors.green}Calendar generation completed!${colors.reset}`);
	return calendar;
};
