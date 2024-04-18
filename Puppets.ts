import { BrowserProxy } from "./BrowserProxy"
import { Logger } from "./Logger"
import { ProxyConfig } from "./ProxyConfig"
import { Tab } from "./Tab"

export class Puppets {
  tabs: Tab[]
  browserProxies: BrowserProxy[]
  url: string
  enableProxies: boolean
  disableImages: boolean
  refreshRateInMs: number
  registrationPageInnerText: string
  paused: boolean
  similarityThreshold: number
  lastHighScorer: number

  constructor(
    url: string,
    enableProxies: boolean = false,
    disableImages: boolean = false,
    rateLimitPerMinute: number,
    registrationPageInnerText: string
  ) {
    this.tabs = []
    this.url = url
    this.enableProxies = enableProxies
    this.disableImages = disableImages
    this.refreshRateInMs = (60 / rateLimitPerMinute) * 1000
    this.registrationPageInnerText = registrationPageInnerText
    this.paused = false
    this.similarityThreshold = 80
    this.lastHighScorer = -1

    if (this.enableProxies) {
      this.browserProxies = ProxyConfig()
    }
  }

  setPaused(paused: boolean) {
    if (paused) {
      Logger.info(
        "Pausing operation. Tabs will finish their current page load."
      )
    } else {
      Logger.info("Resuming operation.")
    }

    this.paused = paused
  }

  getPaused() {
    return this.paused
  }

  async initializeTabs(tabQuantity: number) {
    this.tabs = []

    for (let i = 0; i < tabQuantity; i++) {
      let tab: Tab

      if (this.enableProxies) {
        tab = new Tab(this.url, this.disableImages, this.browserProxies[i])
      } else {
        tab = new Tab(this.url, this.disableImages)
      }

      await tab.initialiseTab()
      this.tabs.push(tab)
    }
  }

  async restartTab(tabIndex: number) {
    await this.tabs[tabIndex].close()
    this.tabs[tabIndex] = new Tab(this.url, this.disableImages)
    await this.tabs[tabIndex].initialiseTab()
  }

  async closeTabs() {
    for (let i = 0; i < this.tabs.length; i++) {
      await this.tabs[i].close()
    }
  }

  calculateSimilarity(retrievedText: string, desiredText: string) {
    const retrievedTextTokens = retrievedText
      .replace(/(\r\n|\n|\r)/gm, "")
      .toLowerCase()
      .split(" ")
    const desiredTextTokens = desiredText
      .replace(/(\r\n|\n|\r)/gm, "")
      .toLowerCase()
      .split(" ")
    let countOfMatchingWords = 0

    for (let i = 0; i < desiredTextTokens.length; i++) {
      if (retrievedTextTokens.includes(desiredTextTokens[i])) {
        countOfMatchingWords++
      }
    }

    return (countOfMatchingWords / desiredTextTokens.length) * 100
  }

  async getHighestScoringTabIndex() {
    let highestScorer: number = 0

    for (let i = 0; i < this.tabs.length; i++) {
      if (highestScorer === null) {
        highestScorer = i
        continue
      }

      if (
        this.tabs[i].getSimilarityScore() >
        this.tabs[highestScorer].getSimilarityScore()
      ) {
        highestScorer = i
      }
    }

    return highestScorer
  }

  async loadPagesAtRate() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      for (let i = 0; i < this.tabs.length; i++) {
        while (this.paused === true) {
          await this.sleep(10)
        }

        if (
          i != (await this.getHighestScoringTabIndex()) ||
          this.tabs[i].getSimilarityScore() === -1
        ) {
          if (this.tabs[i].getReady() === true) {
            Logger.info({
              tab: i,
              message: `Loading page`,
            })

            this.tabs[i]
              .loadPage()
              .then(async () => {
                Logger.info({
                  tab: i,
                  message: `Loaded page in ${Date.now() - this.tabs[i].getStartTime()}ms`,
                })

                await this.tabs[i]
                  .getInnerHtmlTextOfAllElements()
                  .then(async (pageInnerHtmlText: string) => {
                    const similarityScore = this.calculateSimilarity(
                      pageInnerHtmlText,
                      this.registrationPageInnerText
                    )

                    this.tabs[i].setSimilarityScore(similarityScore)

                    Logger.info({
                      tab: i,
                      message: `${similarityScore.toFixed(2)}% similarity found`,
                    })

                    if (similarityScore > this.similarityThreshold) {
                      this.paused = true

                      Logger.info({
                        tab: i,
                        message: `Paused operation as page with > ${this.similarityThreshold}% found`,
                      })
                    }

                    const highestScoringTab =
                      await this.getHighestScoringTabIndex()

                    if (highestScoringTab != this.lastHighScorer) {
                      this.lastHighScorer = highestScoringTab
                      await this.tabs[highestScoringTab].bringToFront()
                    }

                    this.tabs[i].setReady(true)
                  })
              })
              .catch(async (error) => {
                Logger.error({
                  tab: i,
                  message: error,
                })

                this.tabs[i].setReady(true)
              })

            const finishTime = Date.now()
            if (
              finishTime - this.tabs[i].getStartTime() <
              this.refreshRateInMs
            ) {
              await this.sleep(
                this.refreshRateInMs -
                  (finishTime - this.tabs[i].getStartTime())
              )
            }
          } else {
            await this.sleep(10)
          }
        }
      }
    }
  }

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
