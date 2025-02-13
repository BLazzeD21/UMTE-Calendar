export type DateType = {
	day: number;
	month: number;
	year: number;
};

export type SubjectType = {
	name: string;
	lecturer: string;
	type: string;
	webinarLink: string;
};

export interface ScheduleItem {
	classNumber: string;
	dayOfWeek: string;
	date: DateType;
	startTime: string;
	endTime: string;
	place: string;
	subject: SubjectType;
}

export type Schedule = ScheduleItem[] | [];

export interface ParseScheduleProps {
	username: string;
	password: string;
	headless?: boolean;
}

export interface GenerateCalendarProps {
	schedule: Schedule;
}

export interface PrepareEventDataResponse {
	startDate: Date;
	endDate: Date;
	description: string;
	summary: string;
	url: string;
	uid: string;
	place: string;
}

export type URL = {
	params: {
		VALUE: "URI";
	};
	val: string;
};

export interface ICalEvent {
	uid: string;
	type: "VEVENT";
	summary: string;
	start: Date;
	end: Date;
	location: string;
	description: string;
	url?: URL | string;
}
