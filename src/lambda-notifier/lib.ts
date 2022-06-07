import { App } from "@slack/bolt";
import { Feedback, DatabaseAdapter } from "../shared/db";
import {
  getManagerFeedbacksForUserMessage,
  getUserFeedbacksMessage,
  log,
} from "../shared/helpers";

export const internalHandler =
  (app: App, databaseAdapter: DatabaseAdapter) =>
  async (event: any): Promise<any> => {
    let nextUserFeedback = await databaseAdapter.getNextFeedback();
    while (nextUserFeedback !== undefined) {
      const userId = nextUserFeedback.userId;
      log("Processing feedbacks for the user", userId);

      /** Notify User */
      const userFeedbacks = await databaseAdapter.getFeedbacksForUser(userId);
      if (userFeedbacks.length > 0) {
        await app.client.chat.postMessage({
          channel: userId,
          text: getUserFeedbacksMessage(userFeedbacks),
        });
      }
      /** Notify Managers */
      const groupPerManager = userFeedbacks
        .filter((i) => i.managerId !== undefined)
        .reduce((prev: Record<string, Feedback[]>, cur: Feedback) => {
          if (!prev[cur.managerId!]) {
            prev[cur.managerId!] = [];
          }
          prev[cur.userId].push(cur);
          return prev;
        }, {});
      for (const managerId of Object.keys(groupPerManager)) {
        const managerFeedbacks = groupPerManager[managerId];
        await app.client.chat.postMessage({
          channel: managerId,
          text: getManagerFeedbacksForUserMessage(managerFeedbacks),
        });
      }
      /** Remove current user feedbacks */
      await databaseAdapter.deleteUserFeedbacks(userFeedbacks);
      /** next */
      nextUserFeedback = await databaseAdapter.getNextFeedback();
    }
  };
