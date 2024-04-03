const GlastoProxy = require("./GlastoProxy")
const logger = require("./log")
const Tab = require("./tab")

class Puppets {
  tabs: Tab[]
  proxies: (typeof GlastoProxy)[]
  url: string
  refreshRateInMs: number
  registrationPageInnerText: string
  paused: boolean
  similarityThreshold: number
  lastHighScorer: number

  constructor(
    url: string,
    rateLimitPerMinute: number,
    registrationPageInnerText: string,
    proxies: (typeof GlastoProxy)[]
  ) {
    this.tabs = []
    this.url = url
    this.refreshRateInMs = (60 / rateLimitPerMinute) * 1000
    this.registrationPageInnerText = registrationPageInnerText
    this.paused = false
    this.similarityThreshold = 80
    this.lastHighScorer = -1
    this.proxies = proxies
  }

  setPaused(paused: boolean) {
    if (paused) {
      logger.info(
        "Pausing operation. Tabs wills finish their current page load."
      )
    } else {
      logger.info("Resuming operation.")
    }

    this.paused = paused
  }

  getPaused() {
    return this.paused
  }

  async initializeTabs(tabQuantity: number) {
    this.tabs = []

    for (let i = 0; i < tabQuantity; i++) {
      const tab =
        i === 0 ? new Tab(this.url) : new Tab(this.url, proxies[i - 1])

      await tab.initialiseTab()
      this.tabs.push(tab)
    }
  }

  async restartTab(tabIndex: number) {
    await this.tabs[tabIndex].close()
    this.tabs[tabIndex] = new Tab(this.url)
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

    // How could this be improved?
    for (let i = 0; i < desiredTextTokens.length; i++) {
      if (retrievedTextTokens.includes(desiredTextTokens[i])) {
        countOfMatchingWords++
      }
    }

    return (countOfMatchingWords / desiredTextTokens.length) * 100
  }

  async getHighestScoringTabIndex() {
    // Get the tab with highest score. Return the first found if multiple exist with same score
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

  // TODO: Tidy method
  async loadPagesAtRate() {
    while (true) {
      for (let i = 0; i < this.tabs.length; i++) {
        while (this.paused === true) {
          await this.sleep(10)
        }

        // Don't reload the page we think is most similar, unless it's score is 0 (which it starts off with)
        if (
          i != (await this.getHighestScoringTabIndex()) ||
          this.tabs[i].getSimilarityScore() === -1
        ) {
          if (this.tabs[i].getReady() === true) {
            logger.info({
              tab: i,
              message: `Loading page`,
            })

            this.tabs[i]
              .loadPage()
              .then(async () => {
                logger.info({
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

                    logger.info({
                      tab: i,
                      message: `${similarityScore.toFixed(2)}% similarity found`,
                    })

                    // Hard coded this pause as results from the coach tickets run showed the page we want has a similarity score of 91
                    if (similarityScore > this.similarityThreshold) {
                      this.paused = true
                      logger.info({
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
                logger.error({
                  tab: i,
                  message: error,
                })

                this.tabs[i].setReady(true)
              })

            // Wait until enough time has passed before loading next tab so we don't break the rate limit
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
            // I've added a sleep here as when there are no pages ready it will freeze up
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

module.exports = Puppets
