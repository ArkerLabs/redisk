import * as winston from 'winston';
import { loggerConfig } from './logger.config';

function initializeLogger() {
  winston.addColors(loggerConfig.colors);
  const logger = (module.exports = winston.createLogger({
    levels: loggerConfig.levels,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.label({ label: '[my-label]' }),
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
  }));

  return logger;
}

const logger = initializeLogger();
export default logger;
