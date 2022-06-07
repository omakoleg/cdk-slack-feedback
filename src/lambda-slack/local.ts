import { DynamoDB } from "aws-sdk";
import { log } from "../shared/helpers";
import { buildSlackBotApp } from "./lib";

const app = buildSlackBotApp(
  {
    token: process.env.SLACK_BOT_TOKEN!,
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN!,
    port: 3000,
  },
  new DynamoDB.DocumentClient({ region: process.env.REGION! })
);

(async () => {
  await app.start();
  log("Feedbacks app is running!");
})();
