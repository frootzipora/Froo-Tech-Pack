require('dotenv').config();
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// ─── /sizechart command ──────────────────────────────────
app.command('/sizechart', async ({ command, ack, respond, client }) => {
  await ack();

  const args = command.text.trim().split(/\s+/);
  const subcommand = args[0] || 'help';

  switch (subcommand) {
    case 'help':
    default:
      await respond({
        response_type: 'ephemeral',
        text: [
          '*Size Chart Builder Commands:*',
          '`/sizechart new` — Create a new size chart',
          '`/sizechart view` — View the chart for this channel',
          '`/sizechart history` — View change history',
          '`/sizechart blocks` — List available size blocks',
        ].join('\n'),
      });
      break;

    case 'new':
      await client.views.open({
        trigger_id: command.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'new_sizechart',
          title: { type: 'plain_text', text: 'New Size Chart' },
          submit: { type: 'plain_text', text: 'Create' },
          blocks: [
            {
              type: 'input',
              block_id: 'style_code_block',
              element: {
                type: 'plain_text_input',
                action_id: 'style_code',
                placeholder: { type: 'plain_text', text: 'e.g., SS26-0108' },
              },
              label: { type: 'plain_text', text: 'Style Code' },
            },
            {
              type: 'input',
              block_id: 'style_name_block',
              element: {
                type: 'plain_text_input',
                action_id: 'style_name',
                placeholder: { type: 'plain_text', text: 'e.g., Ocean Vest' },
              },
              label: { type: 'plain_text', text: 'Style Name' },
            },
          ],
        },
      });
      break;

    case 'view':
      await respond({
        response_type: 'ephemeral',
        text: ':eyes: Size chart viewer coming soon — Supabase not connected yet.',
      });
      break;
  }
});

// ─── Modal submissions ───────────────────────────────────
app.view('new_sizechart', async ({ ack, view, body, client }) => {
  await ack();

  const styleCode = view.state.values.style_code_block.style_code.value;
  const styleName = view.state.values.style_name_block.style_name.value;

  // Send confirmation DM to the user
  await client.chat.postMessage({
    channel: body.user.id,
    text: `:white_check_mark: Size chart stub created for *${styleCode} — ${styleName}*\n\n_Connect Supabase to persist charts._`,
  });
});

// ─── Start ───────────────────────────────────────────────
(async () => {
  await app.start();
  console.log('⚡ Slack bot is running in Socket Mode!');
})();
