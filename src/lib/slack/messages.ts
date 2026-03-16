export function changeAcceptedMessage(styleCode: string, styleName: string, changeCount: number, reviewerId: string) {
  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:white_check_mark: *Changes Accepted* for *${styleCode} — ${styleName}*\n${changeCount} change(s) applied by <@${reviewerId}>`,
        },
      },
    ],
    text: `Changes accepted for ${styleCode}`,
  };
}

export function changeRejectedMessage(styleCode: string, styleName: string, reviewerId: string) {
  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:x: *Changes Rejected* for *${styleCode} — ${styleName}*\nRejected by <@${reviewerId}>`,
        },
      },
    ],
    text: `Changes rejected for ${styleCode}`,
  };
}
