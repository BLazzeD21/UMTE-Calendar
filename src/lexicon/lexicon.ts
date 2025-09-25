export const lexicon = {
	startMessage:
		'Привет!👋🏻 Я бот для <b>рассылки уведомлений о изменении расписания</b> на портале <a href="https://umeos.ru/my/">umeos</a>.',
	replyMessage:
		"<u>Я не умею отвечать на сообщения</u>. Всё, что я могу — это <b>присылать уведомления об изменении расписания</b> в топик чата, где я состою 😕. \n\n<tg-spoiler>Если хочешь проверить расписание — зайди на портал университета.</tg-spoiler>",
	message: (body: string) => {
		const now = new Date();
		const options: Intl.DateTimeFormatOptions = {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		};
		const formattedDate = now.toLocaleDateString("ru-RU", options);

		const messageText = `<b>📣 Изменение в расписании ${formattedDate}!</b>\n\n${body}\n<b><a href="https://umeos.ru/my/">umeos</a> • <a href="https://umeos.blazzed.tech/calendar.ics">подписаться на календарь (ics)</a></b>`;

		return messageText;
	},
	lengthExceeded: "<i>Изменения очень большие. Посмотрите расписание!</i>",
	addedByDate: "✅ Добавлено",
	removedByDate: "❌ Отменено",
	changedByDate: "✏️ Изменено",
	withoutDate: "без даты",
};
