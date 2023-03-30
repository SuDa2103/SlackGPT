const { App } = require("@slack/bolt");
const openai = require("openai");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
});

let openaiApiKey;

async function validateOpenaiApiKey(apiKey) {
  try {
    const models = await openai.models.list(apiKey);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function generateResponse(message, openaiApiKey) {
  const completions = await openai.completions.create({
    engine: "davinci",
    prompt: message,
    maxTokens: 150,
    n: 1,
    stop: "\n",
    temperature: 0.7,
  }, {
    apiKey: openaiApiKey
  });

  return completions.choices[0].text.trim();
}

app.message(async ({ message, say }) => {
  if (message.bot_id) {
    return;
  }

  if (!openaiApiKey) {
    const apiKey = message.text.trim();

    if (await validateOpenaiApiKey(apiKey)) {
      openaiApiKey = apiKey;
      say("OpenAI API key validated! You can now use the bot to interact with ChatGPT.");
    } else {
      say("Invalid OpenAI API key. Please try again.");
    }

    return;
  }

  const response = await generateResponse(message.text, openaiApiKey);
  say(response);
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("Bot is running!");
})();
