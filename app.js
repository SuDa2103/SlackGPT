const { App, AwsLambdaReceiver } = require('@slack/bolt');
const openai = require("openai");

// Initialize your custom receiver
const awsLambdaReceiver = new AwsLambdaReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Initializes your app with your bot token and the AWS Lambda ready receiver
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver: awsLambdaReceiver,

    // When using the AwsLambdaReceiver, processBeforeResponse can be omitted.
    // If you use other Receivers, such as ExpressReceiver for OAuth flow support
    // then processBeforeResponse: true is required. This option will defer sending back
    // the acknowledgement until after your handler has run to ensure your handler
    // isn't terminated early by responding to the HTTP request that triggered it.

    // processBeforeResponse: true

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

// Handle the Lambda function event
module.exports.handler = async (event, context, callback) => {
    const handler = await awsLambdaReceiver.start();
    return handler(event, context, callback);
}