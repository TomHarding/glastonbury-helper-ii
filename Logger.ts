import { createLogger, format, transports } from "winston"

const LOG_FILENAME = "glasto.log"

export const Logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json(),
    format.printf((info) => {
      return JSON.stringify({
        timestamp: info.timestamp,
        level: info.level,
        tab: info.tab,
        message: info.message,
      })
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: LOG_FILENAME }),
  ],
})
