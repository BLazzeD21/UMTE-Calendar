import { chromium, Browser, Page } from "playwright";

import { DateType, ParseScheduleProps, Schedule, SubjectType } from "../types/index.js";

import { colors } from "../utils/colors.js";
import { log } from "../utils/log.js";

export const parseSchedule = async ({ username, password, headless = true }: ParseScheduleProps): Promise<Schedule> => {
	let browser: Browser;

	try {
		log("Launching browser...", colors.blue);
		browser = await chromium.launch({ headless: headless });
		const page: Page = await browser.newPage();

		log("Navigating to the login page...", colors.cyan);
		await page.goto("https://umeos.ru/login/index.php");
		await page.waitForTimeout(500);

		log("Filling in the username...", colors.yellow);
		await page.waitForSelector('input[name="username"]');
		await page.locator('input[name="username"]').fill(username);
		await page.waitForTimeout(1000);

		log("Filling in the password...", colors.yellow);
		await page.waitForSelector('input[name="password"]');
		await page.locator('input[name="password"]').fill(password);
		await page.waitForTimeout(1000);

		log("Clicking the login button...", colors.blue);
		await page.click("#loginbtn", { delay: 1500 });

		log("Waiting for successful login...", colors.cyan);
		await page.waitForURL("https://umeos.ru/my/", { waitUntil: "load" });

		await page.waitForTimeout(1000);

		log("Navigating to the schedule page...", colors.cyan);
		await page.goto("https://umeos.ru/blocks/umerasp/schedule.php?t=student");

		log("Waiting for schedule table to load...", colors.yellow);
		await page.waitForSelector("#sched_tabs");
		await page.waitForTimeout(1000);

		log("Extracting schedule data...", colors.blue);
		const schedule = await page.$$eval("tbody tr", (rows: HTMLElement[]) => {
			let currentDate: string;

			return rows
				.map((row, index) => {
					const date = row.querySelectorAll("th");
					const cells = row.querySelectorAll("td");

					if (date.length === 1) {
						currentDate = date[0].innerText.trim() || "";
					}

					if (cells.length === 4 && index > 0) {
						console.log("\x1b[36mProcessing a schedule row...\x1b[0m");
						const classNumber = cells[0].innerText.trim();
						const time = cells[1].innerText.trim().split("-");
						const [startTime, endTime] = time;

						const dateSplit = currentDate.split(" ");
						const dayOfWeek = dateSplit[0].trim();

						const [day, month, year] = dateSplit[1].trim().split(".").map(Number);
						const date: DateType = { day, month, year };

						const place = cells[2].innerText.trim();

						const subjectCell = cells[3];
						const subjectText = subjectCell.innerHTML.trim();
						const [subjectName, subjectLecturer] = subjectText.split("<br>").map((part) => part.trim());

						const types =
							Array.from(subjectCell.querySelectorAll(".badge")).map((badge: HTMLElement) => badge.innerText.trim()) ||
							[];

						const type = types.length === 1 ? types[0] : types.join(", ");

						const subjectDetails: SubjectType = {
							name: subjectName || "",
							lecturer: subjectLecturer || "",
							type: type,
							webinarLink: subjectCell.querySelector("a")?.href || "",
						};

						return {
							classNumber: classNumber,
							dayOfWeek: dayOfWeek,
							date: date,
							startTime: startTime,
							endTime: endTime,
							place: place,
							subject: subjectDetails,
						};
					}
					return null;
				})
				.filter((schedule) => schedule !== null);
		});

		log("Schedule successfully extracted!", colors.green);
		return schedule;
	} catch (error) {
		log(`An error occurred: ${error}`, colors.red);
		return [];
	} finally {
		log("Closing browser...", colors.blue);
		if (browser) {
			await browser.close();
		}
	}
};
