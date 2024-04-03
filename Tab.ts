const GlastoProxy = require("./GlastoProxy")
const puppeteer = require("puppeteer-extra")
const pluginStealth = require("puppeteer-extra-plugin-stealth")
const logger = require("./log")

puppeteer.use(pluginStealth())

class Tab {
  url: string
  proxy: typeof GlastoProxy | null
  browser: any
  page: any
  similarityScore: number
  ready: boolean
  startTime: number

  constructor(url: string, proxy: typeof GlastoProxy = null) {
    this.url = url
    this.proxy = proxy
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
    logger.info("Spawning new tab")

    const args = [
      "--disable-gpu",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ]

    if (this.proxy) {
      logger.info(`Using proxy: ${this.proxy.ip}:${this.proxy.port}`)
      args.push(`--proxy-server=${this.proxy.ip}:${this.proxy.port}`)
    }

    this.browser = await puppeteer.launch({
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

    logger.info("Navigating to page")

    if (this.proxy) {
      await this.page.authenticate({
        username: this.proxy.username,
        password: this.proxy.password,
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

module.exports = Tab
