/* eslint-disable @typescript-eslint/no-explicit-any */
import { chartToSlackText } from './chart-composer';

/**
 * Publish a chart to a Slack canvas in the given channel.
 * Falls back to posting a message if canvas API is unavailable.
 */
export async function publishToCanvas(client: any, chart: any, channelId: string) {
  const style = chart.style || {};
  const text = chartToSlackText(chart);
  const title = `Size Chart — ${style.style_code || ''} ${style.name || ''}`;

  try {
    // Try to create a canvas
    const result = await client.canvases.create({
      title,
      document_content: {
        type: 'markdown',
        markdown: `# ${title}\n\n\`\`\`\n${text}\n\`\`\`\n\nStatus: **${(chart.status || 'draft').toUpperCase()}** · Updated: ${new Date(chart.updated_at).toLocaleDateString()}`,
      },
    });

    // Share canvas to channel
    if (result.canvas_id) {
      await client.conversations.canvases.create({
        channel_id: channelId,
        canvas_id: result.canvas_id,
      });
    }

    return result.canvas_id;
  } catch (err: any) {
    console.error('Canvas API failed, falling back to message:', err.message);
    await postChartMessage(client, chart, channelId);
    return null;
  }
}

/**
 * Post the chart as a regular Slack message (fallback).
 */
export async function postChartMessage(client: any, chart: any, channelId: string) {
  const style = chart.style || {};
  const text = chartToSlackText(chart);

  await client.chat.postMessage({
    channel: channelId,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `Size Chart — ${style.style_code || ''} ${style.name || ''}` },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '```' + text + '```' },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Status: *${(chart.status || 'draft').toUpperCase()}* · Updated: ${new Date(chart.updated_at).toLocaleDateString()}`,
          },
        ],
      },
    ],
    text: `Size Chart — ${style.style_code || ''}`,
  });
}
