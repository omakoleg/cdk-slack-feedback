import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  Table,
  AttributeType,
  BillingMode,
  ProjectionType,
} from "aws-cdk-lib/aws-dynamodb";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { join } from "path";
import { FunctionUrlAuthType } from "aws-cdk-lib/aws-lambda";

export class CdkSlackFeedbackStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * Slack Feedback Handler
     */
    const slackHandlerLambda = new NodejsFunction(
      this,
      "SlackFeedbackHandlerFunction",
      {
        functionName: "slack-feedbacks",
        entry: join(__dirname, "..", "src", "lambda-slack", "index.ts"),
        handler: "handler",
        environment: {
          SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET!,
          SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN!,
          REGION: process.env.REGION!,
        },
      }
    );
    const functionUrl = slackHandlerLambda.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    });

    /**
     * Lambda to automatically dump feedbacks to the users and theirs managers
     */
    const feedbacksNotifier = new NodejsFunction(
      this,
      "FeedbacksNotifierFunction",
      {
        functionName: "scheduled-feedbacks",
        entry: join(__dirname, "..", "src", "lambda-notifier", "index.ts"),
        handler: "handler",
        environment: {
          SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN!,
          REGION: process.env.REGION!,
        },
      }
    );
    new Rule(this, "LambdaSyslogLoaderRule", {
      schedule: Schedule.expression("cron(0 10 ? * MON-FRI)"),
      targets: [new LambdaFunction(feedbacksNotifier)],
    });

    /**
     * Storages
     */
    const feedbacksTable = new Table(this, "FeedbacksTable", {
      tableName: "feedbacks",
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "ts", type: AttributeType.NUMBER },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    feedbacksTable.addGlobalSecondaryIndex({
      indexName: "managerIdIndex",
      partitionKey: { name: "managerId", type: AttributeType.STRING },
      sortKey: { name: "ts", type: AttributeType.NUMBER },
      projectionType: ProjectionType.ALL,
    });
    feedbacksTable.grantReadWriteData(slackHandlerLambda);
    feedbacksTable.grantReadWriteData(feedbacksNotifier);

    /**
     * Lambda URL to be used in Slack Application configuration
     */
    new CfnOutput(this, "LambdaUrl", { value: functionUrl.url });
  }
}
