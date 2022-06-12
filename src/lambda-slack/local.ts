import { DynamoDB } from "aws-sdk";
import { log } from "../shared/helpers";
import { buildSlackBotApp } from "./lib";

const fakeDynamoDbClient: DynamoDB.DocumentClient = {
  put: (params: DynamoDB.DocumentClient.PutItemInput) => ({
    promise: () => Promise.resolve(`Fake database.put executed: ${JSON.stringify(params, undefined, 4)}`)
  })
} as unknown as DynamoDB.DocumentClient;

const app = buildSlackBotApp(
  {
    token: process.env.SLACK_BOT_TOKEN!,
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN!,
    port: 3000,
  },
  fakeDynamoDbClient
);

(async () => {
  await app.start();
  log("Feedbacks app is running!");
})();
