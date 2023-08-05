const puppeteer = require("puppeteer-extra");
const TelegramBot = require("node-telegram-bot-api");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
// const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const express = require("express");
// const chrome = require("chrome-aws-lambda");
const dotenv = require("dotenv");
const chromium = require("@sparticuz/chromium");

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
const placementsUrl = "https://placements.masaischool.com/placements?filter=new";

let isLoggedIn = false;
let browser;
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

// options = {
//   args: ["--no-sandbox"],
// };

// optin

async function performLogin() {
  try {
    puppeteer.use(StealthPlugin());
    browser = await puppeteer.launch({
      args:chromium.args,
      defaultViewport:chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
    })


    // browser = await puppeteer.use(StealthPlugin()).launch(options);
    const page = await browser.newPage();
    await page.goto(loginUrl, { waitUntil: "domcontentloaded" });

    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    await page.type("#email", email);
    await page.type("#password", password);

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

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


async function checkNewPlacements(page) {
  try {
    await page.goto(placementsUrl, { waitUntil: "domcontentloaded" });
    const placementsPageHtml = await page.content();
    const newPlacementsElement = await page.$(
      'a[href="https://placements.masaischool.com/placements?filter=new"] span'
    );

    if (newPlacementsElement) {
      const newPlacementsCount = await page.evaluate(
        (element) => element.textContent,
        newPlacementsElement
      );
      console.log(`Number of new placements: ${newPlacementsCount}`);
      if (newPlacementsCount > 0) {
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
          // const expiresAt="2023-08-04 19:54:35";
          const formattedExpiresAt = new Date(expiresAt).toLocaleString("en-US", {hour12: true});
          const datenow = new Date();
          const diffinsec = Math.abs(new Date(expiresAt) - datenow)/1000;
          const hours = Math.floor(diffinsec/3600)%24;
          const minutes = Math.floor(diffinsec/60)%60;
          const seconds = Math.floor(diffinsec%60);


          const newmsg = `Company Name: ${companyName}\nCompany URL: ${companyURL}\nRole: ${role}\nExpires At: ${formattedExpiresAt}\nTime Left: ${hours} hours ${minutes} minutes ${seconds} seconds`;

          // const companyId = companyURL.split('/').pop();
          const companyId = companyURL.match(/\/(\d+)$/)[1];
          const inlineKeyboard = {
            inline_keyboard: [
              [
                {
                  text: "Apply",
                  callback_data: `apply_${companyId}`,
                },
              ],
              [
                {
                  text: "Job Info",
                  callback_data: `info_${companyId}`,
                },
              ],
            ],
          };

          bot.sendMessage(chatId, newmsg, {
            reply_markup: inlineKeyboard,
          });
        }

        bot.on("callback_query", async (query) => {
          const userChatId = query.message.chat.id;
          const queryData = query.data.split("_")[0];
          const companyId = query.data.split("_")[1];
          const companyUrl1 = `https://placements.masaischool.com/placements/application/${companyId}`;
          const CompanyUrl2 = `https://placements.masaischool.com/placements/application/${companyId}/confirmation/optin`;
          // console.log(CompanyUrl2);
          if (queryData === "info") {
            try {
              const companyPage = await browser.newPage();
              await companyPage.goto(companyUrl1, {
                waitUntil: "domcontentloaded",
              });
              const companyPageHtml = await companyPage.content();
              const companyName1 = await companyPage.$eval(
                "h2.text-2xl",
                (el) => el.textContent.trim()
              );
              const companyDescriptions = await companyPage.$$eval(
                "div.mt-2.flex.items-center.text-sm.text-gray-500",
                (elements) => elements.map((el) => el.textContent.trim())
              );
              const details = await companyPage.evaluate(() => {
                  let detailsObj = {};
                  const dtNodes = Array.from(document.querySelectorAll('dt'));
                  const ddNodes = Array.from(document.querySelectorAll('dd'));
          
                  dtNodes.forEach((node, index) => {
                      detailsObj[node.textContent] = ddNodes[index].textContent.trim()||'NA';
                  });
                  
                  return detailsObj;
              });

              const newmsg3 = `Company Name: ${companyName1}\nJob Type: ${companyDescriptions[0]
                }\nLocation: ${companyDescriptions[1]}\nEmployment Type: ${companyDescriptions[2]
                }\nSalary: ${companyDescriptions[3].replace(/\n\s+/g, " ")}\nBond: ${details['Bond']}\nProcess :${details['Interview Process']}\nWebsite :${details['Company Website']}\nJob Description: ${details['Additional Details']}
              `;

              const inline_keyboard1 = {
                inline_keyboard: [
                  [
                    {
                      text: "Apply",
                      callback_data: `apply_${companyId}`,
                    },
                  ],
                ],
              };
              bot.sendMessage(userChatId, newmsg3, {
                reply_markup: inline_keyboard1,
              });
            } catch (err) {
              console.log("Error in info:"+err);
            }
          } else if (queryData === "apply") {
            try {
              const companyPage = await browser.newPage();
              await companyPage.goto(CompanyUrl2, {
                waitUntil: "domcontentloaded",
              });
              const companyPageHtml = await companyPage.content();
              const companyName2 = await companyPage.$eval(
                "h2.text-2xl",
                (el) => el.textContent.trim()
              );
              await companyPage.click('input[type="checkbox"]');
              await companyPage.click('button[type="submit"]');
              await companyPage.waitForTimeout(2000);
              console.log("Applied to the company");
              bot.sendMessage(
                userChatId,
                `You have applied to ${companyName2}. Good luck with your application!`
              );
            } catch (err) {
              console.log("Error in apply:"+err);
            }
          }

        });
      }
    } else {
      isLoggedIn = false;
      console.log("Unable to find the element for new placements.");
    }
  } catch (error) {
    console.error("Error occurred with checkplacement:", error);
  }
}


async function continuouslyCheckPlacements() {
  try {
    let page;

    if (!isLoggedIn) {
      page = await performLogin();
      isLoggedIn = true;
    } else {
      const pages = await browser.pages();
      page = pages[0];
    }
    await checkNewPlacements(page);
    const timeout = 5 * 60 * 1000;
    setTimeout(continuouslyCheckPlacements, timeout);
  } catch (error) {
    console.error("Error occurred with continouslycheckplacement:", error);
  }
}

continuouslyCheckPlacements();

// exports.handler = async (event, context) => {
//   const recursivelyCheckPlacements = async () => {
//     try {
//       let page;

//       if (!isLoggedIn) {
//         page = await performLogin();
//         isLoggedIn = true;
//       } else {
//         const pages = await browser.pages();
//         page = pages[0];
//       }
//       await checkNewPlacements(page);
//       const timeout = 5 * 60 * 1000;
//       setTimeout(recursivelyCheckPlacements, timeout);  // Call the function recursively
//     } catch (error) {
//       console.error("Error occurred with continuouslyCheckPlacements:", error);
//     }
//   };

//   // Start the initial invocation of the recursive function
//   recursivelyCheckPlacements();
// };
