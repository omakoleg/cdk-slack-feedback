import { App, AppOptions } from "@slack/bolt";
import { modalView } from "./modal";
import { DynamoDB } from "aws-sdk";
import { Feedback, buildDatabaseAdapter } from "../shared/db";
import {
  getManagerFeedbacksForUserMessage,
  getUserFeedbacksMessage,
  log,
} from "../shared/helpers";

export const buildSlackBotApp = (
  options: AppOptions,
  docClient: DynamoDB.DocumentClient
) => {
  const app = new App(options);
  const databaseAdapter = buildDatabaseAdapter(docClient);

  // Modal handler showing popup or replying to the request
  app.command("/kudos", async ({ ack, body, client, command }) => {
    await ack();
    try {
      if (command.text === "list") {
        const myFeebbacks = await databaseAdapter.getFeedbacksForUser(
          body.user_id
        );
        if (myFeebbacks.length > 0) {
          await client.chat.postMessage({
            channel: body.user_id,
            text: getUserFeedbacksMessage(myFeebbacks),
          });
        } else {
          await client.chat.postMessage({
            channel: body.user_id,
            text: `You don't have feedbacks submitted for You`,
          });
        }
        const myManagerFeedbacks = await databaseAdapter.getFeedbacksForManager(
          body.user_id
        );
        log(`kudos.myManagerFeedbacks`, myManagerFeedbacks);
        if (myManagerFeedbacks.length > 0) {
          await client.chat.postMessage({
            channel: body.user_id,
            text: getManagerFeedbacksForUserMessage(myManagerFeedbacks),
          });
        }
      } else {
        await client.views.open({
          trigger_id: body.trigger_id,
          view: modalView,
        });
      }
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
  return app;
};
