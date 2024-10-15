import { Browser, BrowserContextOptions, Page } from "playwright"
import { chromium } from "playwright-extra"
import * as UserAgent from "user-agents"
import { BrowserProxy } from "./BrowserProxy"
import { Logger } from "./Logger"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const stealth = require("puppeteer-extra-plugin-stealth")()
chromium.use(stealth)

const timezones = [
  "America/New_York",
  "Europe/London",
  "Asia/Tokyo",
  // Add more timezones as needed
]

const languages = [
  "en-US",
  "en-GB",
  "ja-JP",
  // Add more languages as needed
]

const geolocations = [
  { latitude: 40.7128, longitude: -74.006 }, // New York
  { latitude: 51.5074, longitude: -0.1278 }, // London
  { latitude: 35.6895, longitude: 139.6917 }, // Tokyo
  // Add more geolocations as needed
]

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

    const userAgent = new UserAgent().toString()

    const contextOptions: BrowserContextOptions = {
      viewport: {
        width: Math.floor(Math.random() * (1920 - 800 + 1)) + 800,
        height: Math.floor(Math.random() * (1080 - 600 + 1)) + 600,
      },
      userAgent,
      timezoneId: timezones[Math.floor(Math.random() * timezones.length)],
      locale: languages[Math.floor(Math.random() * languages.length)],
    }

    Logger.info(contextOptions)

    if (this.browserProxy) {
      contextOptions.httpCredentials = {
        username: this.browserProxy.username,
        password: this.browserProxy.password,
      }
    }

    const context = await this.browser.newContext(contextOptions)
    const pages = context.pages()
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
