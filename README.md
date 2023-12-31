# PlacementsNotifierBot 🤖

**Stay Updated. Never Miss Out. Your Job Search Just Got Smarter!**

## Introduction

PlacementsNotifierBot is a Telegram bot designed to keep you informed about new placement opportunities at Masai School. 
Developed using Puppeteer, this bot automates the process of monitoring the placements page and sending real-time notifications to subscribed users on Telegram.
Say goodbye to constantly refreshing web pages and waiting for delayed email notifications – PlacementsNotifierBot ensures you're always in the loop!

## Key Features

- **Real-time Notifications:** Receive instant updates about new placement opportunities via Telegram.
- **Automated Monitoring:** Utilizes Puppeteer to automatically track and detect new companies on the placements portal.
- **Seamless Application:** Apply directly for job openings within the bot for a more convenient and efficient process.

## Getting Started

To use PlacementsNotifierBot locally, follow these steps:

1. Clone the repository.
2. Install dependencies: `npm install`.
3. Create a `.env` file in the project root and add your credentials:

```
EMAIL="your-email@gmail.com"
PASSWORD="your-password"
BOT_TOKEN="your-telegram-bot-token"
```

To obtain a Telegram Bot Token, you can follow these steps:

- Create a bot on Telegram by talking to the BotFather (https://core.telegram.org/bots#botfather) [find telegram bot token](https://drive.google.com/file/d/12CQum85EHOA6ckAHdGWWH0ePJUn6DxPV/view).
- Once you have your Bot Token, replace `your-telegram-bot-token` in the `.env` file.
- Change the line no 10 chatId with your telegram chat id to find the chat id start this telegram bot it will give you your chat id [RawDataBot](https://t.me/raw_data_bot)

4. Start the bot: `npm start`.

## Using Replit

You can also use PlacementsNotifierBot on Replit:

1. Fork the [Replit link](https://replit.com/@Ankithubnew/PlacementsNotifierBot#).
2. Set the environment variables in the Replit's Secrets tab:

   - `EMAIL`: Your email for Masai School login.
   - `PASSWORD`: Your password for Masai School login.
   - `BOT_TOKEN`: Your Telegram Bot Token.

3. Change the line no 20 chatId with your telegram chat id to find the chat id start this telegram bot it will give you your chat id [RawDataBot](https://t.me/raw_data_bot)

   ```const chatId = "replacewithyourchatid"```

4. Run the Replit server.

Check out how to deploy on replit: [Watch Here](https://drive.google.com/file/d/12CQum85EHOA6ckAHdGWWH0ePJUn6DxPV/view).

## Showcase

Check out a video demonstration of PlacementsNotifierBot in action: [Watch Here](https://drive.google.com/file/d/1m-5nXAf-JZdWTYjAsdoDDyAOLEWr4R5M/view).


Screenshot:
![Screenshot](https://github.com/Ankithubnew/Placements-Notifier-Bot/assets/120358743/f71f2671-c216-4959-9f09-80c731431d1e)



## Contributions and Feedback

Contributions and feedback are welcome! Feel free to submit issues, feature requests, or pull requests. Your input helps improve the bot for everyone.

## Let's Connect

Connect with me on LinkedIn: [LinkedIn Profile](https://www.linkedin.com/in/ankit-kumar-19121a245/)
