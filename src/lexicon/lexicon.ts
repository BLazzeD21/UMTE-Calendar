export const lexicon = {
	startMessage:
		'Привет!👋🏻 Я бот для <b>рассылки уведомлений о изменении расписания</b> на портале <a href="https://umeos.ru/my/">umeos</a>.',

	replyMessage:
		"<u>Я не умею отвечать на сообщения</u>. Всё, что я могу — это <b>присылать уведомления об изменении расписания</b> в топик чата, где я состою 😕. \n\n<tg-spoiler>Если хочешь проверить расписание — зайди на портал университета.</tg-spoiler>",

	message: (body: string) => {
		return `<b>📣 В вашем расписании произошли изменения!</b>\n\n${body}\n\n📅 <b><a href="https://umeos.ru/my/">umeos</a> • <a href="https://umeos.blazzed.tech/calendar.ics">календарь (ics)</a></b>`;
	},

	lengthExceeded: "<i>Изменения очень большие. Посмотрите расписание!</i>\n",

	addedByDate: "✅ Появились новые пары:",
	removedByDate: "❌ Пары отменены:",
	changedByDate: "🔄 Изменено:",
	withoutDate: "без даты",

	log: {
		/* proxy */
		proxyDisabled: "Bot: The bot will be launched without using a proxy",
		externalIp: (type: string, ip: string) => {
			return `External IP via ${type}: ${ip}`;
		},
		failedFetchExternalIp: (error: unknown) => {
			return `Failed to fetch external IP: ${error}`;
		},

		/* bot */
		launchingWithoutBot: "Bot: launching without a bot...",
		botStarting: "Bot: Starting...",
		botErrorStarting: "Bot: Error starting the bot",
		sendMessageAttemptFailed: (attempt: number, error: unknown) => {
			return `sendMessage attempt ${attempt} failed: ${error}`;
		},

		/* messages */
		messageSentSuccessfully: "Bot: The message has been sent successfully",
		errorSendingMessage: "Bot: Error sending message",

		/* env */
		missingEnvVars: "Missing environment variables. Exiting...",

		/* schedule */
		noScheduleData: "No schedule data found. Exiting...",
		errorGeneratingCalendar: "Error generating calendar.",

		/* calendar */
		generatingNewCalendar: "No existing calendar found. Generating new calendar...",
		existingCalendarNotFound: "Existing calendar not found. Skipping update...",
		existingCalendarTransform: "Existing calendar file found. Transform...",

		currentCalendarSaved: (name: string) => {
			return `The current calendar has been saved: ${name}`;
		},

		previousCalendarSaved: (name: string) => {
			return `The previous calendar has been saved: ${name}`;
		},

		backupFailed: "Backup failed",

		newCalendarEvents: (count: number) => {
			return `New calendar events: ${count}`;
		},

		newCalendarCreated: "New calendar successfully created!",

		noEventsFound: "There are no events.",

		calendarStats: (oldEvents: number, newEvents: number, totalEvents: number) => {
			return `Old events: ${oldEvents} | New events: ${newEvents} | Total events: ${totalEvents}`;
		},

		updateSkipped: "No changes detected, update skipped",
		successfullyUpdated: "Calendar successfully updated!",
	},

	daysOfWeek: ["В воскресенье", "В понедельник", "Во вторник", "В среду", "В четверг", "В пятницу", "В субботу"],

	months: [
		"января",
		"февраля",
		"марта",
		"апреля",
		"мая",
		"июня",
		"июля",
		"августа",
		"сентября",
		"октября",
		"ноября",
		"декабря",
	],
};
