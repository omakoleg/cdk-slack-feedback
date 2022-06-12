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
      log("userFeedbacks", userFeedbacks);
      if (userFeedbacks.length > 0) {
        log("userFeedbacks. none");
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
          prev[cur.managerId!].push(cur);
          return prev;
        }, {});
      log("groupPerManager", groupPerManager);
      for (const managerId of Object.keys(groupPerManager)) {
        const managerFeedbacks = groupPerManager[managerId];
        log(`manager ${managerId}`, managerFeedbacks);
        await app.client.chat.postMessage({
          channel: managerId,
          text: getManagerFeedbacksForUserMessage(managerFeedbacks),
        });
      }
      log("delete", userFeedbacks);
      /** Remove current user feedbacks */
      await databaseAdapter.deleteUserFeedbacks(userFeedbacks);
      /** next */
      nextUserFeedback = await databaseAdapter.getNextFeedback();
    }
  };
