import { ICalAlarmType, ICalEvent } from "ical-generator";

export const setAlarms = (icalEvent: ICalEvent): void => {
	icalEvent.createAlarm({
		type: ICalAlarmType.display,
		trigger: 30 * 60,
	});

	icalEvent.createAlarm({
		type: ICalAlarmType.display,
		trigger: 5 * 60,
	});
};
