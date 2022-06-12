import { App, AppOptions, CodedError } from "@slack/bolt";
import { modalView } from "./modal";
import { DynamoDB } from "aws-sdk";
import { Feedback, buildDatabaseAdapter } from "../shared/db";
import {
  log,
} from "../shared/helpers";

export const buildSlackBotApp = (
  options: AppOptions,
  docClient: DynamoDB.DocumentClient
) => {
  const app = new App(options);
  const databaseAdapter = buildDatabaseAdapter(docClient);

  // Modal handler showing popup
  app.command("/kudos", async ({ ack, body, client }) => {
    await ack();
    try {
      await client.views.open({
          trigger_id: body.trigger_id,
          view: modalView,
        });
    } catch (error) {
      console.error(error);
    }
  });

  // Handler for submitting feedback
  app.view("feedback_view", async ({ ack, client, body, view }) => {
    await ack();

    const currentUserId = body.user.id;
    const userId = view.state.values["block_name"]["select_user"].selected_user;
    const managerId =
      view.state.values["block_manager"]["select_manager"].selected_user ??
      undefined;
    const text = view.state.values["block_feedback"]["input_feedback"].value;

    if (userId && text) {
      const user = await client.users.info({
        user: userId,
      });
      const feedback: Feedback = {
        userId: userId,
        ts: new Date().getTime(),
        managerId,
        text,
      };

      await databaseAdapter.saveFeedback(feedback);
      await client.chat.postMessage({
        channel: currentUserId,
        text: `Your feedback for ${user.user!.real_name} was accepted.`,
      });
    } else {
      log("No user provided");
    }

    log("processed  feedback", {
      userId,
      managerId,
      text,
    });
  });

  // Each "action_id" mentioned in the view will receive
  // events when there was some interaction with input on the view
  app.action("select_user", async ({ ack, body }) => {
    await ack();
    log("select_user", body);
  });

  app.action("select_manager", async ({ ack, body }) => {
    await ack();
    log("select_manager", body);
  });

  app.action("input_feedback", async ({ ack, body }) => {
    await ack();
    log("input_feedback", body);
  });

  return app;
};
