import { Browser, BrowserContext, chromium, Page } from "playwright";

import { logger } from "@/config";

import { ClassSchedule, DateDetails, ScheduleParserOptions, SubjectDetails } from "@/types";

import { lexicon } from "@/lexicon";

export const parseSchedule = async ({
	username,
	password,
	headless = true,
	log = logger,
}: ScheduleParserOptions): Promise<ClassSchedule> => {
	let browser: Browser;
	let context: BrowserContext;

	try {
		browser = await chromium.launch({ headless: headless });
		context = await browser.newContext();
		const page: Page = await context.newPage();

		await page.goto("https://umeos.ru/login/index.php");

		await page.waitForSelector('input[name="username"]');
		await page.locator('input[name="username"]').fill(username);

		await page.waitForSelector('input[name="password"]');
		await page.locator('input[name="password"]').fill(password);

		await page.click("#loginbtn");

		try {
			await page.waitForURL("https://umeos.ru/my/", { waitUntil: "load" });
		} catch (error) {
			const loginError = await page
				.locator("#loginerrormessage")
				.first()
				.innerText()
				.catch(() => "");

			if (loginError) throw new Error(lexicon.log.loginRejected(loginError.trim()));

			throw error;
		}

		await page.goto("https://umeos.ru/blocks/umerasp/schedule.php?t=student");

		const groupName = await page.locator("#groupselect").inputValue();

		if (!groupName) throw new Error(lexicon.log.groupNotSelected);

		// the block renders the table only from its own click handler, which is bound to a
		// jQuery global that Moodle's requirejs removes whenever it wins the race, so the
		// schedule is requested straight from the endpoint that handler would have called
		const response = await page.request.post("https://umeos.ru/blocks/umerasp/json_rasper.php", {
			form: { type: "group", groupname: groupName },
		});

		if (!response.ok()) throw new Error(lexicon.log.scheduleRequestFailed(response.status()));

		const scheduleHtml = await response.text();

		await page.locator("#sched").evaluate((element, html) => (element.innerHTML = html), scheduleHtml);

		await page.waitForSelector("#sched_tabs");

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
		log.error(lexicon.log.parseFailed(error));
		return [];
	} finally {
		if (context) {
			await context.close();
		}

		if (browser) {
			await browser.close();
		}
	}
};
