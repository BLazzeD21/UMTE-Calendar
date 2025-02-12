import ical, { ICalCalendar, ICalCalendarMethod, ICalAlarmType } from "ical-generator";

import { colors } from "../utils/colors.js";

import { ScheduleItem, GenerateCalendarProps } from "src/types/index.js";

export const generateCalendar = async ({ schedule }: GenerateCalendarProps) => {
  console.log(
    `${colors.blue}Creating a new iCalendar instance...${colors.reset}`
  );

  const calendar: ICalCalendar = ical({
    name: "UMTE",
    description: "Class Schedule",
    method: ICalCalendarMethod.PUBLISH,
    timezone: "Europe/Moscow",
  });

  schedule.forEach(async (scheduleItem: ScheduleItem) => {
    console.log(`${colors.cyan}Processing event:${colors.reset}`, scheduleItem);

    const { classNumber, date, startTime, endTime, place, subject } =
      scheduleItem;

    const day = +date.day;
    const month = +date.month - 1;
    const year = +date.year;

    const [startTimeMins, startTimeHours] = startTime.split(":").map(Number);
    const [endTimeMins, endTimeHours] = endTime.split(":").map(Number);

    console.log(
      `${colors.yellow}Parsing event date: ${day}.${month}.${year}${colors.reset}`
    );

    const startDate = new Date(year, month, day, startTimeMins, startTimeHours);
    const endDate = new Date(year, month, day, endTimeMins, endTimeHours);

    console.log(`${colors.green}Event start time: ${startDate}${colors.reset}`);
    console.log(`${colors.green}Event end time: ${endDate}${colors.reset}`);

    const description = `Lecturer: ${subject.lecturer}\nClass type: ${subject.type}\nLocation: ${place}`;

    const summary = `${classNumber}. ${subject.name}`;
    const url = subject.webinarLink || null;

    const uid = `${classNumber}-${subject.name}-${date.year}${date.month}${date.day}@umte`;

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
      console.log(
        `${colors.cyan}Webinar link detected. Setting reminder 30 minutes before.${colors.reset}`
      );
      icalEvent.createAlarm({ 
        type: ICalAlarmType.display,
        trigger: 30 * 60
       });
    } else {
      console.log(
        `${colors.yellow}No webinar link. Setting reminder 2 hours before.${colors.reset}`
      );
      icalEvent.createAlarm({ 
        type: ICalAlarmType.display,
        trigger: 120 * 60
       });
    }

    console.log(
      `${colors.blue}Adding additional reminder 5 minutes before the event.${colors.reset}`
    );
    
    icalEvent.createAlarm({ 
      type: ICalAlarmType.display,
      trigger: 5 * 60
     });
  });

  console.log(`${colors.green}Calendar generation completed!${colors.reset}`);
  return calendar;
};
