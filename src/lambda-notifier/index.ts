import { App } from "@slack/bolt";
import { Handler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { buildDatabaseAdapter } from "../shared/db";
import { internalHandler } from "./lib";

const token = process.env.SLACK_BOT_TOKEN!;
const region = process.env.REGION!;

const docClient = new DynamoDB.DocumentClient({ region });
const app = new App({
  token,
});
const databaseAdapter = buildDatabaseAdapter(docClient);

export const handler: Handler = internalHandler(app, databaseAdapter);
