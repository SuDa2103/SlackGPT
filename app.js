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

// Set up OpenAI API client
const openaiApiKey = null;
const openaiClient = new openai.OpenAI(openaiApiKey);

// Ask user for OpenAI API key when they first message the bot
app.event("app_mention", async ({ event, context }) => {
  try {
    if (!openaiApiKey) {
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: event.channel,
        text: "Hi there! To get started, please provide your OpenAI API key.",
      });
    }
  } catch (error) {
    console.error(error);
  }
});

// Listen for incoming messages and generate response using ChatGPT
app.message(async ({ message, context, say }) => {
  try {
    // Verify that OpenAI API key is valid
    if (!openaiApiKey) {
      const input = message.text.trim();
      const match = input.match(/^openaiapikey\s+(.+)$/i);
      if (match) {
        openaiApiKey = match[1];
        openaiClient.apiKey = openaiApiKey;
        await say(`Thanks! we've processed your API Key.`);
      } else {
        await say(`Sorry, I didn't get that. To get started, please provide your OpenAI API key by typing "openaiapikey [YOUR_API_KEY]".`);
      }
      return;
    }

    // Generate response using ChatGPT
    const input = message.text.trim();
    const response = await openaiClient.complete({
      engine: "davinci",
      prompt: input,
      maxTokens: 150,
      n: 1,
      stop: "\n",
    });
    const answer = response.data.choices[0].text.trim();
    await say(answer);
  } catch (error) {
    console.error(error);
  }
});

// Handle the Lambda function event
module.exports.handler = async (event, context, callback) => {
    const handler = await awsLambdaReceiver.start();
    return handler(event, context, callback);
}