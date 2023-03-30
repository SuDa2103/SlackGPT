const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
});

app.message(async ({ message, say }) => {
  if (message.bot_id) {
    return;
  }
  
  const response = await chatgpt.generateResponse(message.text);
  say(response);
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("Bot is running!");
})();
