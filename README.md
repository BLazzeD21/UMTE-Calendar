![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![Playwright](https://img.shields.io/badge/-playwright-%232EAD33?style=for-the-badge&logo=playwright&logoColor=white) ![Nginx](https://img.shields.io/badge/nginx-%23009639.svg?style=for-the-badge&logo=nginx&logoColor=white) ![PM2](https://img.shields.io/badge/PM2-24036f?style=for-the-badge&logo=pm2) ![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)

# 💻 Transferring the UMTE schedule to an `ics` calendar

## Script installation instructions

### 1. Cloning a repository

The script will require a VPS or VDS server with a minimum version of **Ubuntu 20.04.6 LTS** for stable operation of the program.
After authorization on the server, clone the repository to the `/home` directory.

Install git:

```bash
sudo apt update && sudo apt upgrade
sudo apt install -y git
```

You can confirm that you have installed Git correctly by running the following command and checking that you receive relevant output.

```bash
git --version
```

Go to your home directory and clone the repository:

```bash
cd /home
git clone https://github.com/BLazzeD21/UMTE-Calendar.git
```

### 2. Installing dependencies

Check the version of _node.js_ installed on the server:

```bash
node -v
```

If the version below _v18.20.6_ or _node.js_ is not installed, then you need to install:

```bash
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Installing project dependencies and playwright:

```bash
cd UMTE-Calendar/
npm i && npx playwright install && npx playwright install-deps
```

In the **UMTE-Calendar** directory you need to create a `groups.json` file describing every group you want to track.
Each group is scraped with its own umeos.ru account. Use `groups.template.json` as a starting point:

```bash
cp groups.template.json groups.json
```

```json
[
	{
		"id": "calendar",
		"name": "ИСП-21",
		"username": "1623320",
		"password": "password",
		"chatId": "-3910194759",
		"topicId": "12321",
		"calendarUrl": "https://yourdomain.com/calendar.ics"
	},
	{
		"id": "ivt-22",
		"name": "ИВТ-22",
		"username": "1623321",
		"password": "password",
		"chatId": "-3910194760"
	}
]
```

| Field         | Required | Description                                                                                          |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `id`          | yes      | Latin letters, digits, `-` and `_` only. Names the generated `calendar/<id>.ics` and `backup/<id>/`. |
| `name`        | no       | Human-readable label used in logs. Defaults to `id`.                                                 |
| `username`    | yes      | umeos.ru login for this group.                                                                       |
| `password`    | yes      | umeos.ru password for this group.                                                                    |
| `chatId`      | no       | Telegram chat to notify. Without it the group is generated but never announced.                      |
| `topicId`     | no       | Telegram topic inside `chatId`.                                                                      |
| `calendarUrl` | no       | Public `.ics` URL, added as a link to the notification message.                                      |

> [!IMPORTANT]
> `groups.json` holds credentials and is gitignored — never commit it.

Groups are processed sequentially, one browser session per group, and a failing group does not stop the others.

> [!NOTE]
> If `groups.json` is absent, the service falls back to a single group built from `UMTE_USERNAME`, `UMTE_PASSWORD`,
> `CHAT_ID` and `TOPIC_ID` in `.env`, using the id `calendar`. This keeps older single-group installations working, but
> `groups.json` is the supported way to configure the service.

#### Upgrading from a single-group installation

Keep `"id": "calendar"` for your existing group — the generated file stays `calendar/calendar.ics`, so the nginx
symlink and the subscription URL keep working. Backups now live in a per-group directory, so move the old one once:

```bash
mkdir -p backup/calendar && mv backup/ActualCalendar.ics backup/calendar/ActualCalendar.ics
```

Skipping this is harmless — a fresh `ActualCalendar.ics` is created on the next run and the old flat backup files are
simply left alone.

Once moved into `backup/calendar/`, the old backups fall under the retention policy below and are swept automatically.
Anything you leave directly in `backup/` is never touched and can be deleted by hand.

#### Backup retention

Each group keeps its rotated backups in `backup/<id>/`. Once a month the service sweeps them and deletes everything
older than **30 days**, with two exceptions that are always kept: `ActualCalendar.ics` (the live copy) and the most
recent rotated backup, so a group never ends up with no history at all.

Both settings live in `src/config/config.ts` — `backupRetentionDays` for the window and `cleanupRule` for the schedule
(`0 3 1 * *`, 03:00 on the 1st of every month). The sweep does not run at startup, so on a fresh install the first one
happens on the 1st.

### 2. Start an app

Using pm2 to run the script. PM2 is a daemon process manager that will help you manage and keep your application online.

The latest PM2 version is installable with NPM:

```bash
npm install pm2@latest -g
```

#### Starting and Managing Processes

| **Action**         | **Description**                                                                                                                                                        | **Command**                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Start Process**  | Run the application named `UTME-schedule` using the desired number of CPU cores specifying them after `-i`, if you want to use all cores use `max` instead of a number | `npm run start`                                                                         |
|                    | Script in `package.json`:                                                                                                                                              | `"start": "npm run build && pm2 start build/index.js --name UMTE-schedule --time -i 1"` |
| **Stop Process**   | Stop the running process                                                                                                                                               | `npm run stop`                                                                          |
|                    | Script in `package.json`:                                                                                                                                              | `"stop": "pm2 stop UMTE-schedule"`                                                      |
| **Reload Process** | Reload the process without downtime                                                                                                                                    | `npm run reload`                                                                        |
|                    | Script in `package.json`:                                                                                                                                              | `"reload": "pm2 reload UMTE-schedule"`                                                  |
| **Delete Process** | Remove the process from PM2                                                                                                                                            | `npm run delete`                                                                        |
|                    | Script in `package.json`:                                                                                                                                              | `"delete": "pm2 delete UMTE-schedule"`                                                  |

#### Monitoring Processes

| **Action**               | **Description**                                     | **Command**                  |
| ------------------------ | --------------------------------------------------- | ---------------------------- |
| **List Processes**       | Display all running processes                       | `pm2 list`                   |
| **Detailed Information** | Show detailed information about the process         | `pm2 describe UMTE-schedule` |
| **Real-Time Monitoring** | Monitor system resources and processes in real-time | `pm2 monit`                  |

#### Viewing Logs

| **Action**            | **Description**                  | **Command**              |
| --------------------- | -------------------------------- | ------------------------ |
| **View All Logs**     | Show all logs                    | `pm2 logs`               |
| **View Process Logs** | View logs for a specific process | `pm2 logs UMTE-schedule` |
| **View Errors**       | Show only error logs             | `pm2 logs --err`         |
| **Clear Logs**        | Clear all logs                   | `pm2 flush`              |

#### Auto Start on Server Reboot

| **Action**            | **Description**                                  | **Command**   |
| --------------------- | ------------------------------------------------ | ------------- |
| **Enable Auto Start** | Set up auto start for processes on server reboot | `pm2 startup` |
| **Save Process List** | Save the current process list for auto start     | `pm2 save`    |

#### Updating Processes After Code Changes

| **Action**                | **Description**                       | **Command**                |
| ------------------------- | ------------------------------------- | -------------------------- |
| **Reload Single Process** | Reload the process after code changes | `pm2 reload UMTE-schedule` |
| **Reload All Processes**  | Reload all running processes          | `pm2 reload all`           |

Now let's run the script:

```bash
npm run start
```

After running the script, one `<id>.ics` file per configured group will appear in the `/UMTE-Calendar/calendar` directory — for the example above, `calendar.ics` and `ivt-22.ics`. Each one contains a calendar that can be used for various purposes.

### 3. Configuring `nginx`

First, install nginx:

```bash
sudo apt install -y nginx
```

Create a symbolic link to the `.ics` file in a directory accessible to nginx. Run the following command:

```bash
sudo ln -s /home/UMTE-Calendar/calendar/calendar.ics /var/www/html/calendar.ics
```

Repeat this for every group, using its `id` as the file name:

```bash
sudo ln -s /home/UMTE-Calendar/calendar/ivt-22.ics /var/www/html/ivt-22.ics
```

Open the nginx configuration file for editing:

`sudo nano /etc/nginx/sites-available/default`

To serve then `calendar.ics` file, you need to modify the configuration:

```bash
server {
    listen 80;
    server_name yourdomain.com;  # Replace with your domain or IP address

    location /calendar.ics {
        root /var/www/html;
        autoindex on;
    }
}
```

Explanation of the configuration:

- `listen 80;`: Tells nginx to listen on port 80 (HTTP).
- `server_name yourdomain.com;`: Replace _yourdomain.com_ with your actual domain or IP address.
- `location /calendar.ics { ... }`: This block tells nginx how to handle requests for the file `calendar.ics`.
- `root /var/www/html;`: This specifies the root directory where nginx will look for files. Since we created a symbolic link earlier, nginx will find the file `calendar.ics` here.
- `autoindex on;`: Enables directory listing, allowing you to see files in the directory if needed.

After making the changes, you need to save the file and exit nano:

- Press `Ctrl + O` to save the file.
- Press `Enter` to confirm the file name.
- Press `Ctrl + X` to exit the editor.

After modifying the configuration file, you must restart nginx to apply the changes:

```bash
sudo systemctl restart nginx
```

### 4. Check File Serving with curl

To check if nginx is serving the `calendar.ics` file, use the curl command. Replace `yourdomain.com` with your domain or IP address:

```bash
curl -o - -I http://yourdomain.com/calendar.ics
```

If the file is being served correctly, you will see this response. If the file isn't accessible, double-check that nginx is running, the configuration is correct, and that the file exists at `/var/www/html/calendar.ics`.

```bash
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
```

Now, the file `calendar.ics` should be available at `http://yourdomain.com/calendar.ics`.

### 5. Ensure secure connection via **https**

If you want to secure Nginx with Let's Encrypt, follow these [instructions](/Let's-Encrypt.md).

### 6. Schedule change notifications via Telegram bot

The Telegram bot is disabled by default. To enable notifications, create a bot using [@BotFather](https://telegram.me/BotFather). You will receive a token to access the HTTP Telegram API. You will also need the **CHAT_ID** where the bot's messages will be sent, or the **CHAT_ID** and **TOPIC_ID** if you have topics enabled in the group.

The token is shared by every group and lives in `.env`:

```bash
TELEGRAM_BOT_TOKEN=Token from BotFather
```

The destination is per group and lives in `groups.json`, so each group can be announced in its own chat:

```json
{
	"id": "ivt-22",
	"name": "ИВТ-22",
	"username": "1623321",
	"password": "password",
	"chatId": "Telegram chat ID",
	"topicId": "Telegram chat topic ID"
}
```

If you don't have any topics in your chat, don't add **topicId**. A group without **chatId** still gets its `.ics`
file generated, it is just never announced.

> [!IMPORTANT]
> In order for the bot to be able to send messages to the specified chat ID, it must be added to this chat.

After filling in `.env`, `groups.json` and adding the **bot** to the chats, the bot will work correctly and send messages _every time the schedule changes_.

### 6. Using a Socks proxy for a Telegram bot

To run the bot with `SocksProxyAgent`, you need to add `PROXY_URL` to `.env` in the format shown below:

```bash
PROXY_URL=socks5://login:password@host:port
```

Then, when the application is launched and the agent is successfully checked, the following information message will be displayed:

```bash
00:17:55 [info]: External IP via proxy: <proxy_ip>
00:17:55 [info]: Bot: Starting...
```

If you do not fill in the `PROXY_URL` or the test connection fails, the following will be displayed:

```bash
# Error will be displayed if the test connection is not successful.
00:19:44 [error]: Failed to fetch external IP: Error: Socks5 proxy rejected connection - NotAllowed
00:19:44 [info]: Bot: The bot will be launched without using a proxy
```
