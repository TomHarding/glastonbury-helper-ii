# Glastonbury Helper II

*Note: This will not work with the new queuing system*

Based on [JackOHara](https://github.com/JackOHara)'s [glasto-helper](https://github.com/JackOHara/glasto-helper) tool

## Usage
This app launches Chrome via Playwright. It opens a number of browsers set by the user. It will then iterate through each browser and load the set URL in a tab. It will only begin loading the page on the next browser tab when a certain amount of time has passed so it does not surpass the set rate limit (60 a minute on the Glastonbury site). 

After each page has loads it calculates a similarity rating by comparing the text on the loaded page to the text in `resources/live.txt`. It is using the inner text of all elements within the body of the returned page. The browser will then automatically switch to the tab with the highest similarity rating. This tab will not be reloaded until another tab beats its similarity rating.

You can pause by pressing the enter key on the command line. It should automatically stop when the registration page loads.

`--site` : URL to poll, this should be to the event page, i.e. `https://glastonbury.seetickets.com/event/glastonbury-2024/worthy-farm/3500000`.

`--rate-limit` : Rate limit per minute.

`--max-tabs` : The number of tabs to use. The more the better. A tab will reload after the iteration of loading tabs has looped back around to it. So more tabs means more time for a page to load. 

`--disable-images` : Disables image loading on all the tabs - _should_ speed up page loading.

`--enable-proxies` : Enables proxies to be run against all tabs. Make sure to add your proxies to the `ProxyConfig` function.

## To Run

Install the dependencies with:

```
yarn install
```

Example run command:

```
tsc main.ts && node main.js --site="https://glastonbury.seetickets.com" --rate-limit=55 --max-tabs=15 --disable-images=true
```

## Code Quality

Formatting, linting and type checking is done with Prettier, ESLint and TSC respectively. These can ran with the following commands:

```
yarn format
yarn lint
yarn typecheck
```
