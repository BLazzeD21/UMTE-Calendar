import { EventData, ScheduleEntry } from "@/types";

export const prepareEventData = ({ scheduleItem }: { scheduleItem: ScheduleEntry }): EventData => {
	const { classNumber, date, startTime, endTime, place, subject } = scheduleItem;

	const { day, year } = date;
	const month = date.month - 1;

	const [startTimeHours, startTimeMins] = startTime.split(":").map(Number);
	const [endTimeHours, endTimeMins] = endTime.split(":").map(Number);

	const start = new Date(year, month, day, startTimeHours, startTimeMins);
	const end = new Date(year, month, day, endTimeHours, endTimeMins);

	const description = `Lecturer: ${subject.lecturer}\nClass type: ${subject.type}\nLocation: ${place}`;

	const summary = `${classNumber}. ${subject.name}`;
	const url = subject.webinarLink || null;

	const id = `${classNumber}-${subject.name}-${date.year}${date.month}${date.day}@umte`;

	return { start, end, description, summary, url, id, location: place };
};
