import * as winston from 'winston';
import { loggerConfig } from './logger.config';

const logger = winston.createLogger({
  levels: loggerConfig.levels,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.label({ label: '[REDISK]' }),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(
      info => `${info.timestamp} ${info.level}: ${info.message}`
    )
  ),
  transports: [
    new winston.transports.Console({ level: process.env.LOG_LEVEL })
  ],
  level: !process.env.REDISK_LOG_LEVEL ? 'warn' : process.env.REDISK_LOG_LEVEL
});

export default logger;
