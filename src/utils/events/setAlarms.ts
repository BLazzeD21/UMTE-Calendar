import { ICalAlarmType, ICalEvent } from "ical-generator";

export const setAlarms = (url: string, icalEvent: ICalEvent) => {
	if (url !== null) {
		icalEvent.createAlarm({
			type: ICalAlarmType.display,
			trigger: 30 * 60,
		});
	} else {
		icalEvent.createAlarm({
			type: ICalAlarmType.display,
			trigger: 120 * 60,
		});
	}

	icalEvent.createAlarm({
		type: ICalAlarmType.display,
		trigger: 5 * 60,
	});
};
