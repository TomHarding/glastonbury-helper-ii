const puppeteer = require("puppeteer")
const puppeteerExtra = require("puppeteer-extra")
const pluginStealth = require("puppeteer-extra-plugin-stealth")

import { BrowserProxy } from "./BrowserProxy"
import { Logger } from "./Logger"

puppeteerExtra.use(pluginStealth())

export class Tab {
  url: string
  disableImages: boolean
  browserProxy: BrowserProxy | null
  browser: typeof puppeteer.Browser
  page: typeof puppeteer.Page
  similarityScore: number
  ready: boolean
  startTime: number

  constructor(
    url: string,
    disableImages: boolean,
    browserProxy: BrowserProxy = null
  ) {
    this.url = url
    this.disableImages = disableImages
    this.browserProxy = browserProxy
    this.browser = null
    this.page = null
    this.similarityScore = -1
    this.ready = false
    this.startTime = 0
  }

  getReady() {
    return this.ready
  }

  setReady(ready: boolean) {
    this.ready = ready
  }

  getSimilarityScore() {
    return this.similarityScore
  }

  getStartTime() {
    return this.startTime
  }

  setSimilarityScore(similarityScore: number) {
    this.similarityScore = similarityScore
  }

  async bringToFront() {
    await this.page.bringToFront()
  }

  async initialiseTab() {
    Logger.info("Spawning new tab")

    const args = [
      "--disable-gpu",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ]

    if (this.browserProxy) {
      Logger.info(
        `Using proxy: ${this.browserProxy.ip}:${this.browserProxy.port}`
      )
      args.push(
        `--proxy-server=${this.browserProxy.ip}:${this.browserProxy.port}`
      )
    }

    this.browser = await puppeteerExtra.launch({
      headless: false,
      args: args,
    })

    const pages = await this.browser.pages()

    this.page = pages.pop()
    this.ready = true
  }

  async close() {
    await this.browser.close()
    return await this.page.close()
  }

  async loadPage() {
    this.startTime = Date.now()
    this.setReady(false)

    Logger.info("Navigating to page")

    if (this.browserProxy) {
      await this.page.authenticate({
        username: this.browserProxy.username,
        password: this.browserProxy.password,
      })
    }

    if (this.disableImages) {
      await this.page.setRequestInterception(true)

      this.page.on("request", (req) => {
        if (req.interceptResolutionState().action === "already-handled") {
          return
        }

        if (req.resourceType() === "image") {
          return req.abort()
        }

        req.continue()
      })
    }

    return await this.page.goto(this.url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    })
  }

  async getInnerHtmlTextOfAllElements() {
    let innerHtmlTextOfAllElements = ""
    const options = await this.page.$$("body *")

    for (const option of options) {
      const label = await this.page.evaluate((el) => el.innerText, option)

      if (label !== undefined && label.length > 0) {
        innerHtmlTextOfAllElements += label.trim() + " "
      }
    }

    return innerHtmlTextOfAllElements
  }
}
