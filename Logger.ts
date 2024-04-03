const winston = require("winston")

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
    new winston.transports.File({ filename: "glasto.log" }),
  ],
})
