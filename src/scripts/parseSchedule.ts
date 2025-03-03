import { Browser, chromium, Page } from "playwright";

import { log } from "@/utils";

import { ClassSchedule, DateDetails, ScheduleParserOptions, SubjectDetails } from "@/types";

export const parseSchedule = async ({
	username,
	password,
	headless = true,
}: ScheduleParserOptions): Promise<ClassSchedule> => {
	let browser: Browser;

	try {
		browser = await chromium.launch({ headless: headless });
		const page: Page = await browser.newPage();

		await page.goto("https://umeos.ru/login/index.php");
		await page.waitForTimeout(500);

		await page.waitForSelector('input[name="username"]');
		await page.locator('input[name="username"]').fill(username);
		await page.waitForTimeout(1000);

		await page.waitForSelector('input[name="password"]');
		await page.locator('input[name="password"]').fill(password);
		await page.waitForTimeout(1000);

		await page.click("#loginbtn", { delay: 1500 });

		await page.waitForURL("https://umeos.ru/my/", { waitUntil: "load" });

		await page.waitForTimeout(1000);

		await page.goto("https://umeos.ru/blocks/umerasp/schedule.php?t=student");

		await page.waitForSelector("#sched_tabs");
		await page.waitForTimeout(1000);

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
						const classNumber = cells[0].innerText.trim();
						const time = cells[1].innerText.trim().split("-");
						const [startTime, endTime] = time;

						const dateSplit = currentDate.split(" ");
						const dayOfWeek = dateSplit[0].trim();

						const [day, month, year] = dateSplit[1].trim().split(".").map(Number);
						const date: DateDetails = { day, month, year };

						const place = cells[2].innerText.trim();

						const subjectCell = cells[3];
						const subjectText = subjectCell.innerHTML.trim();
						const [subjectName, subjectLecturer] = subjectText.split("<br>").map((part) => part.trim());

						const types =
							Array.from(subjectCell.querySelectorAll(".badge")).map((badge: HTMLElement) => badge.innerText.trim()) ||
							[];

						const type = types.length === 1 ? types[0] : types.join(", ");

						const subjectDetails: SubjectDetails = {
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
		return schedule;
	} catch (error) {
		log(`An error occurred: ${error}`, "red");
		return [];
	} finally {
		if (browser) {
			await browser.close();
		}
	}
};
