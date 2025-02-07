import "dotenv/config";
import fs from "fs";

import { parseSchedule } from "./scripts/parser.js";
import { generateCalendar } from "./scripts/generatorCalendar.js";

const schedule = await parseSchedule(
  process.env.UMTE_USERNAME,
  process.env.UMTE_PASSWORD
);

if (schedule.length) {
  fs.writeFileSync(
    "calendar/schedule.json",
    JSON.stringify(schedule, null, 4),
    "utf-8"
  );
  
  const calendar = await generateCalendar(schedule);
  fs.writeFileSync("calendar/calendar.ics", calendar.toString(), "utf-8");
}




