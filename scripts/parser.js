import { chromium } from "playwright";

import { colors } from "../utils/colors.js";

export const parseSchedule = async (username, password, headless = true) => {
  let browser;
  try {
    console.log(`${colors.blue}Launching browser...${colors.reset}`);
    browser = await chromium.launch({ headless: headless });
    const page = await browser.newPage();

    console.log(`${colors.cyan}Navigating to the login page...${colors.reset}`);
    await page.goto("https://umeos.ru/login/index.php");
    await page.waitForTimeout(500);

    console.log(`${colors.yellow}Filling in the username...${colors.reset}`);
    await page.locator('input[name="username"]').fill(username);
    await page.waitForTimeout(1000);

    console.log(`${colors.yellow}Filling in the password...${colors.reset}`);
    await page.locator('input[name="password"]').fill(password);
    await page.waitForTimeout(1000);

    console.log(`${colors.blue}Clicking the login button...${colors.reset}`);
    await page.click("#loginbtn", { delay: 1500 });

    console.log(`${colors.cyan}Waiting for successful login...${colors.reset}`);
    await page.waitForURL("https://umeos.ru/my/", { waitUntil: "load" });

    await page.waitForTimeout(1000);

    console.log(`${colors.cyan}Navigating to the schedule page...${colors.reset}`);
    await page.goto("https://umeos.ru/blocks/umerasp/schedule.php?t=student");

    console.log(`${colors.yellow}Waiting for schedule table to load...${colors.reset}`);
    await page.waitForSelector("#sched_tabs");
    await page.waitForTimeout(1000);

    console.log(`${colors.blue}Extracting schedule data...${colors.reset}`);
    const schedule = await page.$$eval("tbody tr", (rows) => {
      let currentDate;
      return rows
        .map((row, index) => {
          const date = row.querySelectorAll("th");
          const cells = row.querySelectorAll("td");

          if (date.length === 1) {
            currentDate = date[0].innerText.trim() || "";
          }

          if (cells.length === 4 && index > 0) {
            console.log("\x1b[36mProcessing a schedule row...\x1b[0m"); // Cyan color for row processing
            const classNumber = cells[0].innerText.trim();
            const time = cells[1].innerText.trim().split("-");
            const startTime = time[0];
            const endTime = time[1];

            const dateSplit = currentDate.split(" ");
            const dayOfWeek = dateSplit[0].trim();
            const dateOfSubject = dateSplit[1].trim().split(".");
            const day = dateOfSubject[0];
            const month = dateOfSubject[1];
            const year = dateOfSubject[2];

            const date = { day, month, year };
            const place = cells[2].innerText.trim();
            const subjectCell = cells[3];
            const subjectText = subjectCell.innerHTML.trim();
            const subjectParts = subjectText
              .split("<br>")
              .map((part) => part.trim());

            const types =
              Array.from(subjectCell.querySelectorAll(".badge")).map((badge) =>
                badge.innerText.trim()
              ) || [];

            const type = types.length === 1 ? types[0] : types.join(", ");

            const subjectDetails = {
              subject: subjectParts[0]?.trim() || "",
              lecturer: subjectParts[1]?.trim() || "",
              type: type,
              webinarLink: subjectCell.querySelector("a")?.href || "",
            };

            return {
              class: classNumber,
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

    console.log(`${colors.green}Schedule successfully extracted!${colors.reset}`);
    return schedule;
  } catch (error) {
    console.error(`${colors.red}An error occurred: ${error}${colors.reset}`);
    return [];
  } finally {
    console.log(`${colors.blue}Closing browser...${colors.reset}`);
    if (browser) {
      await browser.close();
    }
  }
};
