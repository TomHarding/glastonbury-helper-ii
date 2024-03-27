#!/usr/bin/env node
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1]
          return t[1]
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this
        }),
      g
    )
    function verb(n) {
      return function (v) {
        return step([n, v])
      }
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.")
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t
          if (((y = 0), t)) op = [op[0] & 2, t.value]
          switch (op[0]) {
            case 0:
            case 1:
              t = op
              break
            case 4:
              _.label++
              return { value: op[1], done: false }
            case 5:
              _.label++
              y = op[1]
              op = [0]
              continue
            case 7:
              op = _.ops.pop()
              _.trys.pop()
              continue
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0
                continue
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1]
                break
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1]
                t = op
                break
              }
              if (t && _.label < t[2]) {
                _.label = t[2]
                _.ops.push(op)
                break
              }
              if (t[2]) _.ops.pop()
              _.trys.pop()
              continue
          }
          op = body.call(thisArg, _)
        } catch (e) {
          op = [6, e]
          y = 0
        } finally {
          f = t = 0
        }
      if (op[0] & 5) throw op[1]
      return { value: op[0] ? op[1] : void 0, done: true }
    }
  }
var fs = require("fs")
var puppeteer = require("puppeteer-extra")
var pluginStealth = require("puppeteer-extra-plugin-stealth")
var readline = require("readline")
var util = require("util")
var winston = require("winston")
var argv = require("yargs").argv
puppeteer.use(pluginStealth())
var readFile = util.promisify(fs.readFile)
process.setMaxListeners(Infinity)
// TODO: Separate logger into own file
var logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.printf(function (info) {
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
    new winston.transports.File({
      filename: "glasto.log",
    }),
  ],
})
/*
Excuse my node

To-do
High priority:

Low priority:
    - Extract inner text from actual glastonbury page using same method so we can match better. The 2019 glasto page exists on the selenium page.
    - Add randomness to refresh time
Other:
    - It would be nice to scale this so it's not just maxing out one device. How though? Possibly containerize and give each container its own VPN
*/
var VPN = /** @class */ (function () {
  function VPN(ip, port, username, password) {
    this.ip = ip
    this.port = port
    this.username = username
    this.password = password
  }
  return VPN
})()
var Tab = /** @class */ (function () {
  function Tab(url, proxy) {
    if (proxy === void 0) {
      proxy = null
    }
    this.url = url
    this.proxy = proxy
    this.browser = null
    this.page = null
    this.innerHtmlText = null
    this.similarityScore = -1
    this.ready = false
    this.startTime = null
  }
  Tab.prototype.getReady = function () {
    return this.ready
  }
  Tab.prototype.setReady = function (ready) {
    this.ready = ready
  }
  Tab.prototype.getSimilarityScore = function () {
    return this.similarityScore
  }
  Tab.prototype.getStartTime = function () {
    return this.startTime
  }
  Tab.prototype.setSimilarityScore = function (similarityScore) {
    this.similarityScore = similarityScore
  }
  Tab.prototype.bringToFront = function () {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, this.page.bringToFront()]
          case 1:
            _a.sent()
            return [2 /*return*/]
        }
      })
    })
  }
  Tab.prototype.initialiseTab = function () {
    return __awaiter(this, void 0, void 0, function () {
      var args, _a, pages
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            logger.info("Spawning new tab")
            args = [
              "--disable-gpu",
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
            ]
            if (this.proxy) {
              logger.info(
                "Using proxy: "
                  .concat(this.proxy.ip, ":")
                  .concat(this.proxy.port)
              )
              args.push(
                "--proxy-server="
                  .concat(this.proxy.ip, ":")
                  .concat(this.proxy.port)
              )
            }
            _a = this
            return [
              4 /*yield*/,
              puppeteer.launch({
                headless: false,
                args: args,
              }),
            ]
          case 1:
            _a.browser = _b.sent()
            return [4 /*yield*/, this.browser.pages()]
          case 2:
            pages = _b.sent()
            this.page = pages.pop()
            this.ready = true
            return [2 /*return*/]
        }
      })
    })
  }
  Tab.prototype.close = function () {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, this.browser.close()]
          case 1:
            _a.sent()
            return [4 /*yield*/, this.page.close()]
          case 2:
            return [2 /*return*/, _a.sent()]
        }
      })
    })
  }
  Tab.prototype.loadPage = function () {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            this.startTime = Date.now()
            this.setReady(false)
            logger.info("Navigating to page")
            if (!this.proxy) return [3 /*break*/, 2]
            return [
              4 /*yield*/,
              this.page.authenticate({
                username: this.proxy.username,
                password: this.proxy.password,
              }),
            ]
          case 1:
            _a.sent()
            _a.label = 2
          case 2:
            return [
              4 /*yield*/,
              this.page.goto(this.url, {
                waitUntil: "networkidle2",
                timeout: 30000,
              }),
            ]
          case 3:
            return [2 /*return*/, _a.sent()]
        }
      })
    })
  }
  Tab.prototype.getInnerHtmlTextOfAllElements = function () {
    return __awaiter(this, void 0, void 0, function () {
      var innerHtmlTextOfAllElements, options, _i, options_1, option, label
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            innerHtmlTextOfAllElements = ""
            return [4 /*yield*/, this.page.$$("body *")]
          case 1:
            options = _a.sent()
            ;(_i = 0), (options_1 = options)
            _a.label = 2
          case 2:
            if (!(_i < options_1.length)) return [3 /*break*/, 5]
            option = options_1[_i]
            return [
              4 /*yield*/,
              this.page.evaluate(function (el) {
                return el.innerText
              }, option),
            ]
          case 3:
            label = _a.sent()
            if (label !== undefined && label.length > 0) {
              innerHtmlTextOfAllElements =
                innerHtmlTextOfAllElements + label.trim() + " "
            }
            _a.label = 4
          case 4:
            _i++
            return [3 /*break*/, 2]
          case 5:
            return [2 /*return*/, innerHtmlTextOfAllElements]
        }
      })
    })
  }
  return Tab
})()
var Puppets = /** @class */ (function () {
  function Puppets(url, rateLimitPerMinute, registrationPageInnerText) {
    this.tabs = []
    this.url = url
    this.refreshRateInMs = (60 / rateLimitPerMinute) * 1000
    this.registrationPageInnerText = registrationPageInnerText
    this.paused = false
    this.similarityThreshold = 80
    this.lastHighScorer = -1
  }
  Puppets.prototype.setPaused = function (paused) {
    if (paused) {
      logger.info(
        "Pausing operation. Tabs wills finish their current page load."
      )
    } else {
      logger.info("Resuming operation.")
    }
    this.paused = paused
  }
  Puppets.prototype.getPaused = function () {
    return this.paused
  }
  Puppets.prototype.initializeTabs = function (tabQuantity) {
    return __awaiter(this, void 0, void 0, function () {
      var i, tab
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            this.tabs = []
            i = 0
            _a.label = 1
          case 1:
            if (!(i < tabQuantity)) return [3 /*break*/, 4]
            tab =
              i === 0 ? new Tab(this.url) : new Tab(this.url, proxies[i - 1])
            return [4 /*yield*/, tab.initialiseTab()]
          case 2:
            _a.sent()
            this.tabs.push(tab)
            _a.label = 3
          case 3:
            i++
            return [3 /*break*/, 1]
          case 4:
            return [2 /*return*/]
        }
      })
    })
  }
  Puppets.prototype.restartTab = function (tabIndex) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, this.tabs[tabIndex].close()]
          case 1:
            _a.sent()
            this.tabs[tabIndex] = new Tab(this.url)
            return [4 /*yield*/, this.tabs[tabIndex].initialiseTab()]
          case 2:
            _a.sent()
            return [2 /*return*/]
        }
      })
    })
  }
  Puppets.prototype.closeTabs = function () {
    return __awaiter(this, void 0, void 0, function () {
      var i
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            i = 0
            _a.label = 1
          case 1:
            if (!(i < this.tabs.length)) return [3 /*break*/, 4]
            return [4 /*yield*/, this.tabs[i].close()]
          case 2:
            _a.sent()
            _a.label = 3
          case 3:
            i++
            return [3 /*break*/, 1]
          case 4:
            return [2 /*return*/]
        }
      })
    })
  }
  Puppets.prototype.calculateSimilarity = function (
    retrievedText,
    desiredText
  ) {
    var retrievedTextTokens = retrievedText
      .replace(/(\r\n|\n|\r)/gm, "")
      .toLowerCase()
      .split(" ")
    var desiredTextTokens = desiredText
      .replace(/(\r\n|\n|\r)/gm, "")
      .toLowerCase()
      .split(" ")
    var countOfMatchingWords = 0
    // How could this be improved?
    for (var i = 0; i < desiredTextTokens.length; i++) {
      if (retrievedTextTokens.includes(desiredTextTokens[i])) {
        countOfMatchingWords = countOfMatchingWords + 1
      }
    }
    return (countOfMatchingWords / desiredTextTokens.length) * 100
  }
  Puppets.prototype.getHighestScoringTabIndex = function () {
    return __awaiter(this, void 0, void 0, function () {
      var highestScorer, i
      return __generator(this, function (_a) {
        highestScorer = null
        for (i = 0; i < this.tabs.length; i++) {
          if (highestScorer == null) {
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
        return [2 /*return*/, highestScorer]
      })
    })
  }
  // TODO: Tidy method
  Puppets.prototype.loadPagesAtRate = function () {
    return __awaiter(this, void 0, void 0, function () {
      var _loop_1, this_1, i
      var _this = this
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!true) return [3 /*break*/, 5]
            _loop_1 = function (i) {
              var _b, finishTime
              return __generator(this, function (_c) {
                switch (_c.label) {
                  case 0:
                    if (!(this_1.paused == true)) return [3 /*break*/, 2]
                    return [4 /*yield*/, this_1.sleep(10)]
                  case 1:
                    _c.sent()
                    return [3 /*break*/, 0]
                  case 2:
                    _b = i
                    return [4 /*yield*/, this_1.getHighestScoringTabIndex()]
                  case 3:
                    if (
                      !(
                        _b != _c.sent() ||
                        this_1.tabs[i].getSimilarityScore() == -1
                      )
                    )
                      return [3 /*break*/, 8]
                    if (!(this_1.tabs[i].getReady() == true))
                      return [3 /*break*/, 6]
                    logger.info({
                      tab: i,
                      message: "Loading page",
                    })
                    this_1.tabs[i]
                      .loadPage()
                      .then(function () {
                        return __awaiter(_this, void 0, void 0, function () {
                          var _this = this
                          return __generator(this, function (_a) {
                            switch (_a.label) {
                              case 0:
                                logger.info({
                                  tab: i,
                                  message: "Loaded page in ".concat(
                                    Date.now() - this.tabs[i].getStartTime(),
                                    "ms"
                                  ),
                                })
                                return [
                                  4 /*yield*/,
                                  this.tabs[i]
                                    .getInnerHtmlTextOfAllElements()
                                    .then(function (pageInnerHtmlText) {
                                      return __awaiter(
                                        _this,
                                        void 0,
                                        void 0,
                                        function () {
                                          var similarityScore, highestScoringTab
                                          return __generator(
                                            this,
                                            function (_a) {
                                              switch (_a.label) {
                                                case 0:
                                                  similarityScore =
                                                    this.calculateSimilarity(
                                                      pageInnerHtmlText,
                                                      this
                                                        .registrationPageInnerText
                                                    )
                                                  this.tabs[
                                                    i
                                                  ].setSimilarityScore(
                                                    similarityScore
                                                  )
                                                  logger.info({
                                                    tab: i,
                                                    message: "".concat(
                                                      similarityScore.toFixed(
                                                        2
                                                      ),
                                                      "% similarity found"
                                                    ),
                                                  })
                                                  // Hard coded this pause as results from the coach tickets run showed the page we want has a similarity score of 91
                                                  if (
                                                    similarityScore >
                                                    this.similarityThreshold
                                                  ) {
                                                    this.paused = true
                                                    logger.info({
                                                      tab: i,
                                                      message:
                                                        "Paused operation as page with > ".concat(
                                                          this
                                                            .similarityThreshold,
                                                          "% found"
                                                        ),
                                                    })
                                                  }
                                                  return [
                                                    4 /*yield*/,
                                                    this.getHighestScoringTabIndex(),
                                                  ]
                                                case 1:
                                                  highestScoringTab = _a.sent()
                                                  if (
                                                    !(
                                                      highestScoringTab !=
                                                      this.lastHighScorer
                                                    )
                                                  )
                                                    return [3 /*break*/, 3]
                                                  this.lastHighScorer =
                                                    highestScoringTab
                                                  return [
                                                    4 /*yield*/,
                                                    this.tabs[
                                                      highestScoringTab
                                                    ].bringToFront(),
                                                  ]
                                                case 2:
                                                  _a.sent()
                                                  _a.label = 3
                                                case 3:
                                                  this.tabs[i].setReady(true)
                                                  return [2 /*return*/]
                                              }
                                            }
                                          )
                                        }
                                      )
                                    }),
                                ]
                              case 1:
                                _a.sent()
                                return [2 /*return*/]
                            }
                          })
                        })
                      })
                      .catch(function (error) {
                        return __awaiter(_this, void 0, void 0, function () {
                          return __generator(this, function (_a) {
                            logger.error({
                              tab: i,
                              message: error,
                            })
                            this.tabs[i].setReady(true)
                            return [2 /*return*/]
                          })
                        })
                      })
                    finishTime = Date.now()
                    if (
                      !(
                        finishTime - this_1.tabs[i].getStartTime() <
                        this_1.refreshRateInMs
                      )
                    )
                      return [3 /*break*/, 5]
                    return [
                      4 /*yield*/,
                      this_1.sleep(
                        this_1.refreshRateInMs -
                          (finishTime - this_1.tabs[i].getStartTime())
                      ),
                    ]
                  case 4:
                    _c.sent()
                    _c.label = 5
                  case 5:
                    return [3 /*break*/, 8]
                  case 6:
                    // I've added a sleep here as when there are no pages ready it will freeze up
                    return [4 /*yield*/, this_1.sleep(10)]
                  case 7:
                    // I've added a sleep here as when there are no pages ready it will freeze up
                    _c.sent()
                    _c.label = 8
                  case 8:
                    return [2 /*return*/]
                }
              })
            }
            this_1 = this
            i = 0
            _a.label = 1
          case 1:
            if (!(i < this.tabs.length)) return [3 /*break*/, 4]
            return [5 /*yield**/, _loop_1(i)]
          case 2:
            _a.sent()
            _a.label = 3
          case 3:
            i++
            return [3 /*break*/, 1]
          case 4:
            return [3 /*break*/, 0]
          case 5:
            return [2 /*return*/]
        }
      })
    })
  }
  Puppets.prototype.sleep = function (ms) {
    return new Promise(function (resolve) {
      return setTimeout(resolve, ms)
    })
  }
  return Puppets
})()
function parseArgs() {
  if (!(argv["site"] && argv["rate-limit"] && argv["max-tabs"])) {
    // log.info(
    //   `Usage:\nnode main.js --site=\"localhost:3000\" --rate-limit=60 --max-tabs=10`
    // )
    process.exit(0)
  }
  return argv
}
function readFileAsString(filePath) {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4 /*yield*/, readFile(filePath)]
        case 1:
          return [2 /*return*/, _a.sent()]
      }
    })
  })
}
function getRegistrationPageInnerText() {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!(argv["test"] && argv["test"] !== "false"))
            return [3 /*break*/, 2]
          return [
            4 /*yield*/,
            readFileAsString("resources/test.txt").then(function (data) {
              return data.toString()
            }),
          ]
        case 1:
          return [2 /*return*/, _a.sent()]
        case 2:
          return [
            4 /*yield*/,
            readFileAsString("resources/live.txt").then(function (data) {
              return data.toString()
            }),
          ]
        case 3:
          return [2 /*return*/, _a.sent()]
      }
    })
  })
}
function run() {
  return __awaiter(this, void 0, void 0, function () {
    var registrationPageInnerText, tabs
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          parseArgs()
          return [4 /*yield*/, getRegistrationPageInnerText()]
        case 1:
          registrationPageInnerText = _a.sent()
          tabs = new Puppets(
            argv["site"],
            argv["rate-limit"],
            registrationPageInnerText
          )
          // Pause/resume by pressing enter
          readline.emitKeypressEvents(process.stdin)
          process.stdin.on("keypress", function (str, key) {
            if (key.ctrl && key.name === "c") {
              tabs.closeTabs()
              process.exit(0)
            } else if (key.name === "enter") {
              tabs.setPaused(!tabs.getPaused())
            }
          })
          return [4 /*yield*/, tabs.initializeTabs(argv["max-tabs"])]
        case 2:
          _a.sent()
          return [4 /*yield*/, tabs.loadPagesAtRate()]
        case 3:
          _a.sent()
          return [2 /*return*/]
      }
    })
  })
}
var proxies = [
  // new VPN("38.154.227.167", 5868, "molnkqai", "20rys3gn1bti"),
]
run()
