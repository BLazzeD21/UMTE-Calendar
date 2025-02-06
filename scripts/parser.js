import { chromium } from "playwright";
import 'dotenv/config';

(async () => {
  try {
    const browser = await chromium.launch({ headless: false });

    const page = await browser.newPage();

    await page.goto("https://umeos.ru/login/index.php");

    await page.waitForTimeout(500);
    await page.locator('input[name="username"]').fill(process.env.UMTE_USERNAME);
    await page.waitForTimeout(1000);
    await page.locator('input[name="password"]').fill(process.env.UMTE_PASSWORD);
    await page.waitForTimeout(1000);

    await page.click("#loginbtn", { delay: 1500 });
    await page.waitForURL("https://umeos.ru/my/", { waitUntil: "load" });

    await page.waitForTimeout(1000);
    await page.goto("https://umeos.ru/blocks/umerasp/schedule.php?t=student");

    await page.waitForSelector("#sched_tabs");
    await page.waitForTimeout(1000);

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
            const classNumber = cells[0].innerText.trim();
            const time = cells[1].innerText.trim().split("-");
            const startTime = time[0];
            const endTime = time[1];

            const dateSplit = currentDate.split(" ");
            const dayOfWeek = dateSplit[0].trim();
            const dateOfSubject = dateSplit[1].trim();

            const place = cells[2].innerText.trim();

            const subjectCell = cells[3];
            const subjectText = subjectCell.innerHTML.trim();

            const subjectParts = subjectText
              .split("<br>")
              .map((part) => part.trim());

            const type =
              Array.from(subjectCell.querySelectorAll(".badge")).map((badge) =>
                badge.innerText.trim()
              ) || [];

            const subjectDetails = {
              subject: subjectParts[0].trim(),
              lecturer: subjectParts[1].trim(),
              type: type,
              webinarLink: subjectCell.querySelector("a")
                ? subjectCell.querySelector("a").href
                : "",
            };

            return {
              class: classNumber,
              dayOfWeek: dayOfWeek,
              date: dateOfSubject,
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

    console.log(schedule);
  } catch (error) {
    console.error("An error occurred:", error);
  }
})();
