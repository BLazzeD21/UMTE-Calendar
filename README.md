![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![Playwright](https://img.shields.io/badge/-playwright-%232EAD33?style=for-the-badge&logo=playwright&logoColor=white) ![Nginx](https://img.shields.io/badge/nginx-%23009639.svg?style=for-the-badge&logo=nginx&logoColor=white) ![PM2](https://img.shields.io/badge/PM2-24036f?style=for-the-badge&logo=pm2) ![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)

# 💻 Transferring the UTME schedule to an `ics` calendar

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

In the **UMTE-Calendar** directory you need to create a `.env` file containing the credentials for umeos.ru

```bash
UMTE_USERNAME=username
UMTE_PASSWORD=password
```

### 2. Start an app

Using pm2 to run the script. PM2 is a daemon process manager that will help you manage and keep your application online.

The latest PM2 version is installable with NPM:

```bash
npm install pm2@latest -g
```

#### Starting and Managing Processes

| **Action**         | **Description**                                                                           | **Command**                            |
| ------------------ | ----------------------------------------------------------------------------------------- | -------------------------------------- |
| **Start Process**  | Run the application named `UTME-schedule` using the desired number of CPU cores specifying them after `-i`, if you want to use all cores use `max` instead of a number                           | `npm run start`                        |
|                    | Script in `package.json`:                                                                 | `"start": "npm run build && pm2 start build/index.js --name UMTE-schedule --time -i 1"`                                       |
| **Stop Process**   | Stop the running process                                                                  | `npm run stop`                         |
|                    | Script in `package.json`:                                                                 | `"stop": "pm2 stop UMTE-schedule"`     |
| **Reload Process** | Reload the process without downtime                                                       | `npm run reload`                       |
|                    | Script in `package.json`:                                                                 | `"reload": "pm2 reload UMTE-schedule"` |
| **Delete Process** | Remove the process from PM2                                                               | `npm run delete`                       |
|                    | Script in `package.json`:                                                                 | `"delete": "pm2 delete UMTE-schedule"` |

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


After running the script, a `calendar.ics` file will appear in the `/UMTE-Calendar/calendar` directory, which will contain a calendar that can be used for various purposes.

### 3. Configuring `nginx`

First, install nginx:

```bash
sudo apt install -y nginx
```

Create a symbolic link to the `calendar.ics` file in a directory accessible to nginx. Run the following command:

```bash
sudo ln -s /home/UMTE-Calendar/calendar/calendar.ics /var/www/html/calendar.ics
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
