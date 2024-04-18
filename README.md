# Glastonbury Ticket Helper

This a fork of [@JackOHara's Glastonbury Ticket Helper](https://github.com/JackOHara/glasto-helper). I have refactored the code to use TypeScript and added the ability to use VPNs with Puppeteer.

You can enable proxies by using the `--enable-proxies` command and adding your VPNs to the `ProxyConfig` function.

Formatting, linting and type checking is done with Prettier, ESLint and TSC respectively. These can ran with the following commands:

```
yarn format
yarn lint
yarn typecheck
```
---

## 2023 Glastonbury
It worked! 

## 2019 Glastonbury
I did not get Glastonbury tickets.

I ran the bot for Thursday coach tickets. The site kept crashing and pages timed out. Still, I eventually got through. I entered our registrations but I couldn't pick bus tickets due to an error on the page, this seemed to happen to a lot of people on Twitter. 

I fixed the errors and made a few good improvements over the weekend. I ran it on two laptops then on Sunday. I got through on both. It froze up after submitting payment. This seemed to be a common problem on Twitter once again. I waited util the 10 minutes on ticket lock was over and submitted on the other page. It was too late however. Sold out. 

---

## Usage
This app launches Chrome via Puppeteer. It opens a number of browsers set by the user. It will then iterate through each browser and load the set URL in a tab. It will only begin loading the page on the next browser tab when a certain amount of time has passed so it does not surpass the set rate limit (60 a minute on the Glastonbury site). 

After each page has loads it calculates a similarity rating by comparing the text on the loaded page to the text in `resources/live.txt`. It is using the inner text of all elements within the body of the returned page. The browser will then automatically switch to the tab with the highest similarity rating. This tab will not be reloaded until another tab beats its similarity rating.

You can pause by pressing the enter key on the command line. It should automatically stop when the reg page loads.

`--site` : URL

`--rate-limit` : Rate limit per minute

`--max-tabs` : The number of tabs to use. The more the better. A tab will reload after the iteration of loading tabs has looped back around to it. So more tabs means more time for a page to load. 

`--disable-images` : Disables image loading on all the tabs - _should_ speed up page loading.

`--enable-proxies` : Enables proxies to be run against all tabs.

`--test` : Will use `resources/test.txt` for comparison. For use with test site. 


## To run

```
yarn
```

Example run command:

```
tsc main.ts && node main.js --site="https://glastonbury.seetickets.com" --rate-limit=55 --max-tabs=15 --disable-images=true --enable-proxies=true
```

## Testing

Test site from https://github.com/thomasms/testsites

```
cd test_site
npm start
```

Add test flag in run command:

```
tsc main.ts && node main.js --site="http://localhost:3000" --rate-limit=55 --max-tabs=15 --test
```

When it loads the 20th page it pretends it is in. Runs on `localhost:3000`
