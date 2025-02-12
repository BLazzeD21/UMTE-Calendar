import "dotenv/config";
import fs from "fs";
import { scheduleJob } from "node-schedule";

import { parseSchedule } from "./scripts/parser.js";
import { generateCalendar } from "./scripts/generatorCalendar.js";

import { colors } from "./utils/colors.js";

const dirname = "./calendar";

const main = async () => {
	console.log(`${colors.blue}Starting schedule parsing...${colors.reset}`);

	const schedule = await parseSchedule({
		username: process.env.UMTE_USERNAME,
		password: process.env.UMTE_PASSWORD,
	});

	if (schedule.length) {
		console.log(`${colors.green}Schedule successfully retrieved!${colors.reset}`);
	} else {
		console.error(`${colors.red}Error while getting schedule. Exiting...${colors.reset}`);
		return;
	}

	console.log(`${colors.cyan}Checking if the calendar directory exists...${colors.reset}`);
	if (!fs.existsSync(dirname)) {
		console.log(`${colors.yellow}Directory does not exist. Creating it...${colors.reset}`);
		fs.mkdirSync(dirname);
	}

	console.log(`${colors.cyan}Saving schedule data to schedule.json...${colors.reset}`);
	fs.writeFileSync("calendar/schedule.json", JSON.stringify(schedule, null, 4), "utf-8");
	console.log(`${colors.green}Data successfully written to schedule.json${colors.reset}`);

	console.log(`${colors.blue}Generating iCalendar file...${colors.reset}`);
	const calendar = await generateCalendar({ schedule });

	if (calendar) {
		console.log(`${colors.green}Calendar successfully created!${colors.reset}`);
		fs.writeFileSync("calendar/calendar.ics", calendar.toString(), "utf-8");
		console.log(`${colors.green}Data successfully written to calendar.ics${colors.reset}`);
	} else {
		console.error(`${colors.red}Error generating calendar.${colors.reset}`);
	}
};

console.log(`${colors.yellow}Starting the script...${colors.reset}`);
main();

scheduleJob("0 */3 * * *", main);
