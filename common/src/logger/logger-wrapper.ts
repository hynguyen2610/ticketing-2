// lib/logger.ts
import { createLogger, format, transports } from 'winston';
import moment from 'moment-timezone';

const logFormatter = format.printf(({ timestamp, level, message }) => {
  const bangkokTime = moment.tz(timestamp, 'Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
  return `${bangkokTime} [${level}]: ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    logFormatter
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/app.log' }),
  ],
});

// Ensure logs directory exists
import fs from 'fs';
const logDirectory = 'logs';
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

export default logger;
