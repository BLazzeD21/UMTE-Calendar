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

export type ClassSchedule = ScheduleEntry[];

export interface GroupLogger {
	info: (message: string) => void;
	warn: (message: string) => void;
	error: (message: string) => void;
}

export interface GroupConfig {
	id: string;
	name: string;
	username: string;
	password: string;
	chatId?: string;
	topicId?: string;
}

export interface GroupPaths {
	calendar: string;
	backupDir: string;
	backupActual: {
		name: string;
		path: string;
	};
}

export interface GroupContext {
	group: GroupConfig;
	paths: GroupPaths;
	log: GroupLogger;
}

export interface ScheduleParserOptions {
	username: string;
	password: string;
	headless?: boolean;
	log?: GroupLogger;
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

export interface ChangedEvent {
	UID: string;
	summary: string;
	eventDate: Date;
	changes: Partial<Record<keyof CalendarEvent, { old: string | Date | undefined; new: string | Date | undefined }>>;
}

export interface CalendarDiff {
	removed: CalendarEvent[];
	added: CalendarEvent[];
	changed: ChangedEvent[];
}

export interface MessageTarget {
	chatId: string;
	topicId?: string;
}

export interface BotGroupTarget extends MessageTarget {
	id: string;
	name: string;
}

export interface TelegramBotOptions {
	token: string;
	startMessage: string;
	replyMessage: string;
	proxyUrl?: string;
	apiRoot?: string;
	adminId?: string;
	groups?: BotGroupTarget[];
}
