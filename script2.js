const puppeteer = require("puppeteer-extra");
const TelegramBot = require("node-telegram-bot-api");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
// const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const express = require("express");
// const chrome = require("chrome-aws-lambda");
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
const placementsUrl =
  "https://placements.masaischool.com/placements?filter=new";
const newCompanyUrl = "https://placements.masaischool.com/placements/new";

let isLoggedIn = false; // Flag to track login status
let browser; // Puppeteer browser instance
let options;

const bot = new TelegramBot(telegramBotToken, { polling: true });

// if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
//   options = {
//     args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
//     defaultViewport: chrome.defaultViewport,
//     executablePath: await chrome.executablePath,
//     headless: true,
//     ignoreHTTPSErrors: true,
//   };
// }else{
// }
options = {
  args: ["--no-sandbox"],
};

// Function to perform login using Puppeteer
async function performLogin() {
  try {
    browser = await puppeteer.use(StealthPlugin()).launch(options);
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
//Function to apply company
async function applyCompany(page) {
  try {
    await page.goto(newCompanyUrl, { waitUntil: "domcontentloaded" });
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
    // console.log(placementsPageHtml);
    const newPlacementsElement = await page.$(
      'a[href="https://placements.masaischool.com/placements?filter=new"] span'
    );

    // const newPlacementElements = await page.$$('ul[role="list"] > li');
    // for (const element of newPlacementElements) {
    //   const companyName = await element.$eval('p.text-indigo-600', el => el.textContent.trim());
    //   const companyURL = await element.$eval('a.block', el => el.href.trim());
    //   const role = await element.$eval('p.text-sm.text-gray-500', el => el.textContent.trim());
    //   const expiresAt = await element.$eval('time', el => el.textContent.trim());

    //   // Log the new placement information
    //   console.log('Company Name:', companyName);
    //   console.log('Company URL:', companyURL);
    //   console.log('Role:', role);
    //   console.log('Expires At:', expiresAt);
    //   console.log('---');

    //   // Here you can send this information to users via Telegram bot
    //   // Replace the console.log statements with the Telegram notification logic
    // }

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
      // bot.sendMessage(chatId, `Number of new placements: ${newPlacementsCount}`);
      if (newPlacementsCount > 0) {
        console.log("New placement available");
        // Send notification to the user via Telegram
        const message = `New placements available! Count: ${newPlacementsCount}`;
        bot.sendMessage(chatId, message);
        const newPlacementElements = await page.$$('ul[role="list"] > li');
        for (const element of newPlacementElements) {
          const companyName = await element.$eval("p.text-indigo-600", (el) =>
            el.textContent.trim()
          );
          const companyURL = await element.$eval("a.block", (el) =>
            el.href.trim()
          );
          const role = await element.$eval("p.text-sm.text-gray-500", (el) =>
            el.textContent.trim()
          );
          const expiresAt = await element.$eval("time", (el) =>
            el.textContent.trim()
          );

          // Log the new placement information
          console.log("Company Name:", companyName);
          console.log("Company URL:", companyURL);
          console.log("Role:", role);
          console.log("Expires At:", expiresAt);
          console.log("---");
          const newmsg = `Company Name: ${companyName}\nCompany URL: ${companyURL}\nRole: ${role}\nExpires At: ${expiresAt}\n---`;
          // bot.sendMessage(chatId, newmsg);
          // const companyId = companyURL.split('/').pop();
          const companyId = companyURL.match(/\/(\d+)$/)[1];
          // Here you can send this information to users via Telegram bot
          // Replace the console.log statements with the Telegram notification logic
          // Create an inline keyboard with an "Apply" button
          const inlineKeyboard = {
            inline_keyboard: [
              [
                {
                  text: "Apply",
                  callback_data: `apply_${companyId}`, // Use the unique identifier in the callback data
                },
              ],
            ],
          };

          // Here you can send this information to users via Telegram bot with the inline keyboard button
          // Replace the console.log statements with the Telegram notification logic
          // const newmsg = `Company Name: ${companyName}\nCompany URL: ${companyURL}\nRole: ${role}\nExpires At: ${expiresAt}\n---`;
          bot.sendMessage(chatId, newmsg, {
            reply_markup: inlineKeyboard,
          });
        }
        // bot.sendMessage(chatId, message);
        // bot.on("message",async (msg) => {
        //     const chatId = msg.chat.id;
        //     const resp = msg.text;
        //     console.log(resp,chatId);
        //     // bot.sendMessage(chatId, message);
        //     });

        bot.on("callback_query", async (query) => {
          const userChatId = query.message.chat.id;
          const companyId = query.data.split("_")[1]; // Extract the unique identifier from the callback data
          const CompanyUrl2 = `https://placements.masaischool.com/placements/application/${companyId}/confirmation/optin`;
          console.log(CompanyUrl2);

          // Open the company URL in a tab
          try{
            const companyPage = await browser.newPage();
            await companyPage.goto(CompanyUrl2, { waitUntil: "domcontentloaded" });
            const companyPageHtml = await companyPage.content();
            // console.log(companyPageHtml);
            const companyName2= await companyPage.$eval('h2.text-2xl', el => el.textContent.trim());
            await companyPage.click('input[type="checkbox"]');
            await companyPage.click('button[type="submit"]');
            await companyPage.waitForTimeout(2000);// Wait for 2 seconds
            console.log("Applied to the company");
            bot.sendMessage(
              userChatId,
              `You have applied to ${companyName2}. Good luck with your application!`
            );
          }catch(err){
            console.log(err);
          }
        });
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
