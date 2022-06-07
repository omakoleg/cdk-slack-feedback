import { DynamoDB } from "aws-sdk";
import { chunk, log } from "./helpers";

const TABLE_NAME = "feedbacks";

export interface Feedback {
  userId: string;
  ts: number;
  managerId?: string;
  text: string;
}

export interface DatabaseAdapter {
  saveFeedback(feedback: Feedback): Promise<void>;
  getFeedbacksForUser(userId: string): Promise<Feedback[]>;
  getFeedbacksForManager(managerId: string): Promise<Feedback[]>;
  getNextFeedback(): Promise<Feedback | undefined>;
  deleteUserFeedbacks(feedbacks: Feedback[]): Promise<void>;
}

export const buildDatabaseAdapter = (docClient: DynamoDB.DocumentClient) => {
  const saveFeedback = async (feedback: Feedback): Promise<void> => {
    log(`saveFeedback`, feedback);
    await docClient
      .put({
        TableName: TABLE_NAME,
        Item: feedback,
      })
      .promise();
  };

  const getFeedbacksForUser = async (userId: string): Promise<Feedback[]> => {
    log(`getFeedbacksForUser`, userId);
    const list = await docClient
      .query({
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: {
          ":uid": userId,
        },
        TableName: TABLE_NAME,
      })
      .promise();
    return (list.Items ?? []) as unknown as Feedback[];
  };

  const getFeedbacksForManager = async (
    managerId: string
  ): Promise<Feedback[]> => {
    log(`getFeedbacksForManager`, managerId);
    const list = await docClient
      .query({
        KeyConditionExpression: "managerId = :mid",
        IndexName: "managerIdIndex",
        ExpressionAttributeValues: {
          ":mid": managerId,
        },
        TableName: TABLE_NAME,
      })
      .promise();
    return (list.Items ?? []) as unknown as Feedback[];
  };

  const getNextFeedback = async (): Promise<Feedback | undefined> => {
    log(`getNextFeedback`);
    const list = await docClient
      .scan({
        TableName: TABLE_NAME,
        Limit: 1,
      })
      .promise();
    if (list.Count && list.Count > 0) {
      return list.Items![0] as unknown as Feedback;
    }
    return undefined;
  };

  const deleteUserFeedbacks = async (feedbacks: Feedback[]): Promise<void> => {
    log(`deleteUserFeedbacks`, feedbacks);
    let groups = chunk(feedbacks);

    for (var group of groups) {
      var delReqs = [];
      for (const { userId } of group) {
        delReqs.push({ DeleteRequest: { Key: { userId } } });
      }
      let RequestItems = {
        [TABLE_NAME]: delReqs,
      };
      await docClient.batchWrite({ RequestItems }).promise();
    }
  };

  return {
    saveFeedback,
    getFeedbacksForUser,
    getFeedbacksForManager,
    getNextFeedback,
    deleteUserFeedbacks,
  };
};
