import { View } from "@slack/bolt";

export const modalView: View = {
  type: "modal",
  callback_id: "feedback_view",
  submit: {
    type: "plain_text",
    text: "Send",
    emoji: true,
  },
  close: {
    type: "plain_text",
    text: "Cancel",
    emoji: true,
  },
  title: {
    type: "plain_text",
    text: "Submit Feedback",
    emoji: true,
  },
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Pick a user",
      },
    },
    {
      type: "actions",
      block_id: "block_name",
      elements: [
        {
          action_id: "select_user",
          type: "users_select",
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Pick a manager who can read feedback (optional)",
      },
    },
    {
      type: "actions",
      block_id: "block_manager",
      elements: [
        {
          action_id: "select_manager",
          type: "users_select",
        },
      ],
    },
    {
      type: "input",
      block_id: "block_feedback",
      label: {
        type: "plain_text",
        text: "What feedback You would like to give ?",
      },
      element: {
        type: "plain_text_input",
        action_id: "input_feedback",
        multiline: true,
      },
    },
  ],
};
