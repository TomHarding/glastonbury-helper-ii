#!/usr/bin/env node

import * as fs from "fs"
import { emitKeypressEvents } from "readline"
import { promisify } from "util"
import { argv } from "yargs"
import { Logger } from "./Logger"
import { Puppets } from "./Puppets"

const readFile = promisify(fs.readFile)
process.setMaxListeners(Infinity)

const parseArgs = () => {
  if (!argv["site"] || !argv["rate-limit"] || !argv["max-tabs"]) {
    Logger.info(
      'Usage:\nnode main.js --site="localhost:3000" --rate-limit=60 --max-tabs=10'
    )
    process.exit(0)
  }
  return argv
}

const readFileAsString = async (filePath: string) => {
  try {
    return await readFile(filePath, "utf8")
  } catch (error) {
    Logger.error(`Error reading file: ${error.message}`)
    throw error
  }
}

const getRegistrationPageInnerText = async () => {
  return await readFileAsString("resources/live.txt")
}

const setupKeyPressHandler = (tabs: Puppets) => {
  emitKeypressEvents(process.stdin)
  process.stdin.setRawMode(true)
  process.stdin.resume()

  process.stdin.on("keypress", (str, key) => {
    if (key.ctrl && key.name === "c") {
      tabs
        .closeTabs()
        .then(() => process.exit(0))
        .catch((error) => {
          Logger.error(`Error closing tabs: ${error.message}`)
          process.exit(1)
        })
    } else if (key.name === "return") {
      tabs.setPaused(!tabs.getPaused())
    }
  })
}

const run = async () => {
  parseArgs()
  const registrationPageInnerText = await getRegistrationPageInnerText()
  const tabs = new Puppets(
    argv["site"],
    argv["enable-proxies"],
    argv["disable-images"],
    argv["rate-limit"],
    registrationPageInnerText
  )

  setupKeyPressHandler(tabs)

  await tabs.initializeTabs(argv["max-tabs"])
  await tabs.loadPagesAtRate()
}

run()
