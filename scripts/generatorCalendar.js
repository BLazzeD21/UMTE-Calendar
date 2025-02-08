import ical from "ical-generator";

import { colors } from "../utils/colors.js";

export const generateCalendar = async (schedule) => {
  console.log(
    `${colors.blue}Creating a new iCalendar instance...${colors.reset}`
  );
  const calendar = ical({
    name: "UMTE",
    description: "Class Schedule",
    method: "PUBLISH",
    timezone: "Europe/Moscow",
  });

  schedule.forEach(async (event) => {
    console.log(`${colors.cyan}Processing event:${colors.reset}`, event);

    const day = String(event.date.day).padStart(2, "0");
    const month = String(event.date.month - 1).padStart(2, "0");
    const year = event.date.year;

    console.log(
      `${colors.yellow}Parsing event date: ${day}.${month}.${year}${colors.reset}`
    );

    const startDate = new Date(
      year,
      month,
      day,
      event.startTime.split(":")[0],
      event.startTime.split(":")[1]
    );
    const endDate = new Date(
      year,
      month,
      day,
      event.endTime.split(":")[0],
      event.endTime.split(":")[1]
    );

    console.log(`${colors.green}Event start time: ${startDate}${colors.reset}`);
    console.log(`${colors.green}Event end time: ${endDate}${colors.reset}`);

    const description = `Lecturer: ${event.subject.lecturer}\nClass type: ${event.subject.type}\nLocation: ${event.place}`;
    const summary = `${event.class}. ${event.subject.subject}`;
    const url = event.subject.webinarLink || null;

    const uid = `${event.class}-${event.subject.subject}-${event.date.year}${event.date.month}${event.date.day}@umte`;

    console.log(`${colors.blue}Creating iCalendar event...${colors.reset}`);
    const icalEvent = calendar.createEvent({
      uid: uid,
      start: startDate,
      end: endDate,
      summary: summary,
      description: description,
      location: event.place,
      url: url,
    });

    if (url !== null) {
      console.log(
        `${colors.cyan}Webinar link detected. Setting reminder 30 minutes before.${colors.reset}`
      );
      icalEvent.createAlarm({ trigger: -30 * 60 });
    } else {
      console.log(
        `${colors.yellow}No webinar link. Setting reminder 2 hours before.${colors.reset}`
      );
      icalEvent.createAlarm({ trigger: -120 * 60 });
    }

    console.log(
      `${colors.blue}Adding additional reminder 5 minutes before the event.${colors.reset}`
    );
    icalEvent.createAlarm({ trigger: -5 * 60 });
  });

  console.log(`${colors.green}Calendar generation completed!${colors.reset}`);
  return calendar;
};
