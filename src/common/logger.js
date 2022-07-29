const pkg = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
require('dotenv').config();

const { createLogger, format, transports } = pkg;

const { combine, timestamp, label, printf, colorize, json } = format;

const myFormat = printf(({ level, message, stack, label, timestamp }) => {
  let errorString = `${timestamp} [${label}] ${level}: ${JSON.stringify(message)}`;
  if (stack) {
    errorString += `\nSTACK:\n${stack}`;
  }
  return errorString;
});

module.exports = (data) => {
  const transportsConfig = !data.notSplit ? [
    data.path ? new DailyRotateFile({
      filename: '%DATE%.log',
      dirname: `logs/${data.path}`,
      datePattern: '/MM/DD',
    }) : new transports.File({ filename: 'logs/rest.log' }),
    new transports.File({ filename: 'logs/errors.log', level: 'error' }),
  ] : [
    new transports.File({ filename: 'logs/all-transactions.log' }),
    new transports.File({ filename: 'logs/errors.log', level: 'error' }),
  ];

  const loggerInstance = createLogger({
    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
    format: combine(
      colorize(),
      json(),
      label({ label: data.label ? data.label : 'NONE' }),
      timestamp(),
      myFormat,
    ),
    transports: transportsConfig,
  });

  if (process.env.NODE_ENV !== 'production') {
    loggerInstance.add(new transports.Console({
      handleExceptions: true,
    }));
  }

  if (process.env.DISABLE_LOGGER === 'yes') {
    loggerInstance.silent = true;
  }

  return loggerInstance;
};
