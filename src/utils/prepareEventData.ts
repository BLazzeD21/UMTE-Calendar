import { PrepareEventDataResponse, ScheduleItem } from "../types/index.js";

import { colors } from "./colors.js";

export const prepareEventData = ({ scheduleItem }: { scheduleItem: ScheduleItem }): PrepareEventDataResponse => {
	const { classNumber, date, startTime, endTime, place, subject } = scheduleItem;

	const day = +date.day;

	const month = +date.month - 1;
	const year = +date.year;

	console.log(`${colors.yellow}Preparing event date: ${day}.${month}.${year}${colors.reset}`);

	const [startTimeMins, startTimeHours] = startTime.split(":").map(Number);
	const [endTimeMins, endTimeHours] = endTime.split(":").map(Number);

	const startDate = new Date(year, month, day, startTimeMins, startTimeHours);
	const endDate = new Date(year, month, day, endTimeMins, endTimeHours);

	const description = `Lecturer: ${subject.lecturer}\nClass type: ${subject.type}\nLocation: ${place}`;

	const summary = `${classNumber}. ${subject.name}`;
	const url = subject.webinarLink || null;

	const uid = `${classNumber}-${subject.name}-${date.year}${date.month}${date.day}@umte`;

	return { startDate, endDate, description, summary, url, uid, place };
};
