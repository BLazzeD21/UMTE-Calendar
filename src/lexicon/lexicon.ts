export const lexicon = {
	startMessage:
		'Привет!👋🏻 Я бот для <b>рассылки уведомлений о изменении расписания</b> на портале <a href="https://umeos.ru/my/">umeos</a>.',

	replyMessage:
		"<u>Я не умею отвечать на сообщения</u>. Всё, что я могу — это <b>присылать уведомления об изменении расписания</b> в топик чата, где я состою 😕. \n\n<tg-spoiler>Если хочешь проверить расписание — зайди на портал университета.</tg-spoiler>",

	message: (body: string, calendarUrl?: string) => {
		const portalLink = '<a href="https://umeos.ru/my/">umeos</a>';
		const links = calendarUrl ? `${portalLink} • <a href="${calendarUrl}">календарь (ics)</a>` : portalLink;

		return `<b>📣 В вашем расписании произошли изменения!</b>\n\n${body}\n\n📅 <b>${links}</b>`;
	},

	lengthExceeded: "<i>Изменения очень большие. Посмотрите расписание!</i>\n",

	addedByDate: "✅ Появились новые пары:",
	removedByDate: "❌ Пары отменены:",
	changedByDate: "🔄 Изменено:",
	withoutDate: "без даты",

	admin: {
		noTargets: "Ни у одной группы не указан <code>chatId</code> — отправлять некуда.",
		testStarted: (count: number) => {
			return `🧪 Отправляю тестовое сообщение в <b>${count}</b> чат(ов)...`;
		},
		testMessage:
			"🧪 <b>Тестовое сообщение</b>\n\nЕсли вы его видите, уведомления об изменении расписания доходят до этого чата.",
		sendUsage:
			"Отправьте команду вместе с текстом сообщения:\n<code>/send Завтра пар не будет</code>\n\nПосле этого можно будет выбрать, в какой чат его отправить.",
		sendChooseTarget: (message: string) => {
			return `Куда отправить сообщение?\n\n${message}`;
		},
		sendToAllButton: "📣 Во все чаты",
		sendCancelButton: "❌ Отмена",
		invalidMarkup: "Не удалось разобрать разметку сообщения. Проверьте HTML-теги и отправьте команду ещё раз.",
		sendCancelled: "Отправка отменена.",
		sendExpired: "Текст сообщения не найден — отправьте команду <code>/send</code> ещё раз.",
		unknownTarget: "Такой группы больше нет в конфигурации.",
		reportLine: (name: string, delivered: boolean) => {
			return `${delivered ? "✅" : "❌"} ${name}`;
		},
		report: (lines: string[]) => {
			return `<b>Результат отправки:</b>\n\n${lines.join("\n")}`;
		},
	},

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
		apiRootOverridden: (apiRoot: string) => {
			return `Bot: Using a custom Bot API endpoint: ${apiRoot}`;
		},
		botStarting: "Bot: Starting...",
		adminEnabled: (adminId: string) => {
			return `Bot: Admin commands enabled for ${adminId}`;
		},
		adminDisabled: "Bot: TELEGRAM_ADMIN_ID is not set, admin commands are disabled",
		adminCommand: (command: string, adminId: string) => {
			return `Bot: Admin ${adminId} ran /${command}`;
		},
		botHandlerFailed: (error: unknown) => {
			return `Bot: Handler failed: ${error}`;
		},
		botErrorStarting: "Bot: Error starting the bot",
		sendMessageAttemptFailed: (attempt: number, error: unknown) => {
			return `sendMessage attempt ${attempt} failed: ${error}`;
		},

		/* messages */
		messageSentSuccessfully: "Bot: The message has been sent successfully",
		errorSendingMessage: (attempts: number) => {
			return `Bot: Error sending message, giving up after ${attempts} attempts`;
		},

		/* groups */
		groupsFileMissing: "groups.json not found, falling back to a single group from .env",
		groupsFileUnreadable: (error: unknown) => {
			return `Unable to read groups.json: ${error}`;
		},
		groupsFileNotArray: "groups.json must contain an array of groups",
		groupSkippedBadId: (index: number) => {
			return `groups.json[${index}] skipped: "id" is required and may contain only latin letters, digits, "-" and "_"`;
		},
		groupSkippedDuplicateId: (index: number, id: string) => {
			return `groups.json[${index}] skipped: duplicate id "${id}"`;
		},
		groupSkippedNoCredentials: (index: number, id: string) => {
			return `groups.json[${index}] skipped: group "${id}" has no username or password`;
		},
		groupWithoutChat: (name: string) => {
			return `Group "${name}" has no chatId, notifications for it are disabled`;
		},
		noGroupsConfigured: "No groups configured. Exiting...",
		calendarsHeader: "Calendars will be available at:",
		calendarLocation: (name: string, location: string) => {
			return `${name} -> ${location}`;
		},
		calendarBaseUrlMissing: "CALENDAR_BASE_URL is not set, notifications will be sent without a calendar link",
		groupsLoaded: (count: number) => {
			return `Groups configured: ${count}`;
		},
		groupFailed: (name: string, error: unknown) => {
			return `Group "${name}" failed: ${error}`;
		},
		cycleStarted: (count: number) => {
			return `Starting update cycle for ${count} group(s)...`;
		},
		cycleFinished: "Update cycle finished",
		fatalError: (error: unknown) => {
			return `Fatal error: ${error}`;
		},

		/* env */
		missingEnvVars: "Missing environment variables. Exiting...",

		/* files */
		fileReadFailed: (filePath: string, error: unknown) => {
			return `Unable to read file ${filePath}: ${error}`;
		},

		/* schedule */
		parseFailed: (error: unknown) => {
			return `An error occurred while parsing the schedule: ${error}`;
		},
		noScheduleData: "No schedule data found. Skipping group...",
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

		backupsRemoved: (count: number, days: number) => {
			return `Removed ${count} backup(s) older than ${days} days`;
		},

		backupCleanupFailed: (error: unknown) => {
			return `Backup cleanup failed: ${error}`;
		},

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
