export type DateType = {
  day: string;
  month: string;
  year: string;
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
