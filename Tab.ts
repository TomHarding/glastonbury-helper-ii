import { Browser, Page } from "playwright"
import { chromium } from "playwright-extra"
import { BrowserProxy } from "./BrowserProxy"
import { Logger } from "./Logger"

const stealth = require("puppeteer-extra-plugin-stealth")()
chromium.use(stealth)

export class Tab {
  url: string
  disableImages: boolean
  browserProxy: BrowserProxy | null
  browser: Browser
  page: Page
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

    this.browser = await chromium.launch({
      headless: false,
      args: args,
    })

    const context = await this.browser.newContext()
    const pages = await context.pages()
    this.page = pages.length ? pages[0] : await context.newPage() // Create new page if no pages are open
    this.ready = true
  }

  async close() {
    await this.page.close()
    return await this.browser.close()
  }

  async loadPage() {
    this.startTime = Date.now()
    this.setReady(false)

    Logger.info("Navigating to page")

    if (this.browserProxy) {
      await this.page.context().setHTTPCredentials({
        username: this.browserProxy.username,
        password: this.browserProxy.password,
      })
    }

    if (this.disableImages) {
      await this.page.route("**/*", (route) => {
        const request = route.request()
        if (request.resourceType() === "image") {
          route.abort()
        } else {
          route.continue()
        }
      })
    }

    return await this.page.goto(this.url, {
      waitUntil: "networkidle",
      timeout: 30000,
    })
  }

  async getInnerHtmlTextOfAllElements() {
    let innerHtmlTextOfAllElements = ""
    const elements = await this.page.$$("body *")

    for (const element of elements) {
      const label = await this.page.evaluate(
        (el) => (el as HTMLElement).innerText,
        element
      )

      if (label && label.length > 0) {
        innerHtmlTextOfAllElements += label.trim() + " "
      }
    }

    return innerHtmlTextOfAllElements
  }
}
