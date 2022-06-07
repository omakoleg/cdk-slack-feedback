import { App, AwsLambdaReceiver } from "@slack/bolt";
import { Callback, Context } from "aws-lambda";
import { buildSlackBotApp } from "./lib";
import { DynamoDB } from "aws-sdk";

const signingSecret = process.env.SLACK_SIGNING_SECRET!;
const token = process.env.SLACK_BOT_TOKEN!;
const region = process.env.REGION!;

const docClient = new DynamoDB.DocumentClient({ region });

const receiver = new AwsLambdaReceiver({
  signingSecret,
});

const app = buildSlackBotApp(
  {
    token,
    receiver,
  },
  docClient
);

export const handler = async (
  event: any,
  context: Context,
  callback: Callback
) => {
  const handler = await receiver.start();
  return handler(event, context, callback);
};
