import ical from "ical-generator";

export const generateCalendar = async (schedule) => {
  const calendar = ical({ name: "UMTE", description: "Расписание занятий" });

  schedule.forEach(async (event) => {
    const day = String(event.date.day).padStart(2, "0");
    const month = String(event.date.month - 1).padStart(2, "0");
    const year = event.date.year;

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

    const description = `Преподаватель: ${event.subject.lecturer}\nТип занятия: ${event.subject.type}\nАудитория: ${event.place}`;

    const summary = `${event.class}. ${event.subject.subject}`;

    const url = event.subject.webinarLink || null;

    const icalEvent = calendar.createEvent({
      start: startDate,
      end: endDate,
      summary: summary,
      description: description,
      location: event.place,
      url: url,
    });

    if (url !== null) {
      icalEvent.createAlarm({ trigger: -30 * 60 });
    } else {
      icalEvent.createAlarm({ trigger: -120 * 60 });
    }

    icalEvent.createAlarm({ trigger: -5 * 60 });
  });

  return calendar;
};
