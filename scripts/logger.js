const path = require('node:path');

/**
 * @typedef {import('pino').Logger} PinoLogger
 */

const pino = require('pino');
const fs = require('node:fs')
const logFilePath = path.join(__dirname, '..', 'data', 'app.log')
fs.truncate(logFilePath, 0, () => {
  console.log(`[LOGGER] Truncated log file`);
})

const fileTransport = pino.transport({
  target: 'pino/file',
  options: { destination: logFilePath },
});

let pinoLogger;

if (process.env.NODE_ENV === 'development') {
  pinoLogger = pino(
    {
      level: 'info',
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
  );
  
} else {
  pinoLogger = pino(
    {
      level: 'info',
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    fileTransport
  );
  
}

/**
 * @type {PinoLogger}
 */
const logger = pinoLogger;

module.exports = logger;