import 'dotenv/config';

import { parseSchedule } from './scripts/parser.js';

const schedule = await parseSchedule(process.env.UMTE_USERNAME, process.env.UMTE_PASSWORD);

console.log(schedule);