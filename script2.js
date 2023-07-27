const puppeteer = require("puppeteer-extra");
const TelegramBot = require("node-telegram-bot-api");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
// const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const express = require("express");
const chrome = require("chrome-aws-lambda");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const telegramBotToken = process.env.BOT_TOKEN;
const chatId = "707047567";

app.get("/", (req, res) => {
    res.send("Hello World!");
});
    

app.listen(3000, () => {
    console.log("server started");
});

const loginUrl = "https://placements.masaischool.com/login";
const placementsUrl = "https://placements.masaischool.com/placements";

let isLoggedIn = false; // Flag to track login status
let browser; // Puppeteer browser instance
let options;

const bot = new TelegramBot(telegramBotToken, { polling: true });

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  options = {
    args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
    defaultViewport: chrome.defaultViewport,
    executablePath: await chrome.executablePath,
    headless: true,
    ignoreHTTPSErrors: true,
  };
}else{
  options = {
    headless: true,
  };
}


// Function to perform login using Puppeteer
async function performLogin() {
  try {
    browser = await puppeteer
      .use(StealthPlugin())
      .launch(options);
    const page = await browser.newPage();
    await page.goto(loginUrl, { waitUntil: "domcontentloaded" });

    // Replace 'your_email' and 'your_password' with the actual email and password
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    await page.type("#email", email);
    await page.type("#password", password);

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    // Check if login was successful
    isLoggedIn = await page.evaluate(() => {
      return !document.querySelector('input[name="email"]');
    });
    console.log(isLoggedIn);
    if (!isLoggedIn) {
      console.error("Login failed. Please check your credentials.");
    } else {
      console.log("Login successful.");
    }

    return page;
  } catch (error) {
    console.error("Error occurred during login:", error);
  }
}

// Function to check if 'NEW' placements are available
async function checkNewPlacements(page) {
  try {
    // Continue with checking for new placements
    await page.goto(placementsUrl, { waitUntil: "domcontentloaded" });
    const placementsPageHtml = await page.content();

    // Get the element containing the number of new placements
    const newPlacementsElement = await page.$(
      'a[href="https://placements.masaischool.com/placements?filter=new"] span'
    );

    if (newPlacementsElement) {
      const newPlacementsCount = await page.evaluate(
        (element) => element.textContent,
        newPlacementsElement
      );
    //   bot.on("message",async (msg) => {
    //     const chatId = msg.chat.id;
    //     const resp = msg.text;
    //     console.log(resp,chatId);
    //     bot.sendMessage(chatId, `Number of new placements: ${newPlacementsCount}`);
    //     });
      console.log(`Number of new placements: ${newPlacementsCount}`);
      bot.sendMessage(chatId, `Number of new placements: ${newPlacementsCount}`);
      if (newPlacementsCount > 0) {
        console.log("New placement available");
        // Send notification to the user via Telegram
        const message = `New placements available! Count: ${newPlacementsCount}`;
        bot.sendMessage(chatId, message);
        // bot.sendMessage(chatId, message);
        // bot.on("message",async (msg) => {
        //     const chatId = msg.chat.id;
        //     const resp = msg.text;
        //     console.log(resp,chatId);
        //     // bot.sendMessage(chatId, message);
        //     });
        

      }
    } else {
      isLoggedIn = false; // Update the login status
      console.log("Unable to find the element for new placements.");
    }
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

// Function to continuously check for new placements
async function continuouslyCheckPlacements() {
  try {
    let page;

    if (!isLoggedIn) {
      // If not logged in or login has expired, perform login again
      page = await performLogin();
      isLoggedIn = true; // Update the login status
    } else {
      // If already logged in, use the existing browser instance
      const pages = await browser.pages();
      page = pages[0];
    }

    // Call the function to check for new placements
    await checkNewPlacements(page);

    // Check again after 1 minute
    // 30 minutes
    const timeout = 1 * 60 * 1000;
    setTimeout(continuouslyCheckPlacements, timeout);
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

// Call the function to continuously check for new placements
continuouslyCheckPlacements();
