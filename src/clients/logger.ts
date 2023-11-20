import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, _, timestamp }) => {
      return `[${timestamp}] ${level}: ${message}`;
    }),
  ),
  transports: [
    new winston.transports.File({
      filename: `./logs/${new Date().toISOString().split('T')[0]}.log`,
      level: 'error',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
    new winston.transports.Console(),
  ],
});
