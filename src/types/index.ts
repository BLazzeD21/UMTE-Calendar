export type DateDetails = {
	day: number;
	month: number;
	year: number;
};

export type SubjectDetails = {
	name: string;
	lecturer: string;
	type: string;
	webinarLink: string;
};

export interface ScheduleEntry {
	classNumber: string;
	dayOfWeek: string;
	date: DateDetails;
	startTime: string;
	endTime: string;
	place: string;
	subject: SubjectDetails;
}

export type ClassSchedule = ScheduleEntry[] | [];

export interface ScheduleParserOptions {
	username: string;
	password: string;
	headless?: boolean;
}

export interface CalendarGenerationOptions {
	schedule: ClassSchedule;
}

export interface EventData {
	start: Date;
	end: Date;
	description?: string;
	summary: string;
	url?: string;
	id: string;
	location?: string;
}

export type URLDetails = {
	params: {
		VALUE: "URI";
	};
	val: string;
};

export interface CalendarEvent {
	id: string;
	type: "VEVENT";
	summary: string;
	start: Date;
	end: Date;
	location: string;
	description: string;
	url?: URLDetails | string;
}
