import { Feedback } from "./db";

export const log = (title: string, obj?: any) =>
  console.log(`${title}: ${obj ? JSON.stringify(obj, undefined, 4) : ""}`);

export const chunk = <A>(list: A[]): A[][] => {
  let groups: A[][] = [];
  for (let i = 0; i < list.length; i += 25) {
    groups.push(list.slice(i, i + 25));
  }
  return groups;
};

export const getUserFeedbacksMessage = (feedbacks: Feedback[]): string =>
  `*Your feedbacks:*\n${feedbacks.map((i) => `${i.text}`).join("\n")}`;

export const getManagerSingleFeedbackMessage = (feedback: Feedback): string =>
  `User *<@${feedback.userId}>* got feedback: \n${feedback.text}`;

export const getManagerFeedbacksForUserMessage = (
  userFeedbacks: Feedback[]
): string => {
  log(`getManagerFeedbacksForUserMessage`, userFeedbacks);
  const groupped = userFeedbacks.reduce(
    (prev: Record<string, string[]>, cur: Feedback) => {
      if (!prev[cur.userId]) {
        prev[cur.userId] = [];
      }
      prev[cur.userId].push(cur.text);
      return prev;
    },
    {}
  );
  log(`getManagerFeedbacksForUserMessage. groupped`, groupped);
  return `*Feedbacks shared with You as a manager:*\n${Object.keys(groupped)
    .map((key) => `<@${key}> feedbacks:\n${groupped[key].join("\n")}`)
    .join("\n")}`;
};
