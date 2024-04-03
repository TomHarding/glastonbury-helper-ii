const winston = require("winston")

const LOG_FILENAME = "glasto.log"

export const Logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.printf((info) => {
      return JSON.stringify({
        timestamp: info.timestamp,
        level: info.level,
        tab: info.tab,
        message: info.message,
      })
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: LOG_FILENAME }),
  ],
})
