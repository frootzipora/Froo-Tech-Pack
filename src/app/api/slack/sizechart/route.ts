/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifySlackRequest } from '@/lib/slack/verify';
import { getSlackClient } from '@/lib/slack/slack-client';
import * as db from '@/lib/slack/supabase';
import { chartToSlackText } from '@/lib/slack/chart-composer';
import * as modals from '@/lib/slack/modals';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Verify Slack signature
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (signingSecret) {
    const timestamp = request.headers.get('x-slack-request-timestamp') || '';
    const signature = request.headers.get('x-slack-signature') || '';
    if (!verifySlackRequest(signingSecret, timestamp, rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  const params = new URLSearchParams(rawBody);
  const text = (params.get('text') || '').trim();
  const channelId = params.get('channel_id') || '';
  const triggerId = params.get('trigger_id') || '';

  const args = text.split(/\s+/);
  const subcommand = args[0] || 'help';
  const param = args.slice(1).join(' ');

  const client = getSlackClient();

  try {
    switch (subcommand) {
      case 'new':
        await handleNew(client, triggerId, channelId);
        return NextResponse.json({ text: '' });

      case 'clone':
        await handleClone(client, triggerId, param, channelId);
        return NextResponse.json({ text: '' });

      case 'view':
        return NextResponse.json(await handleView(param, channelId));

      case 'history':
        return NextResponse.json(await handleHistory(param, channelId));

      case 'blocks':
        return NextResponse.json(await handleBlocks());

      default:
        return NextResponse.json({
          response_type: 'ephemeral',
          text: [
            '*Size Chart Builder Commands:*',
            '`/sizechart new` \u2014 Create a new size chart',
            '`/sizechart clone <style-code>` \u2014 Clone an existing chart',
            '`/sizechart view` \u2014 View the chart for this channel',
            '`/sizechart history` \u2014 View change history for this channel',
            '`/sizechart blocks` \u2014 List available size blocks',
          ].join('\n'),
        });
    }
  } catch (error) {
    console.error('Slack sizechart error:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Something went wrong. Please try again.',
    });
  }
}

async function getChannelContext(client: any, channelId: string) {
  const context: any = { channelId, styleCode: '', styleName: '', channelName: '', existingStyle: null };

  try {
    const info = await client.conversations.info({ channel: channelId });
    context.channelName = info.channel?.name || '';
  } catch { /* DM or inaccessible */ }

  const { data: style } = await db.supabase
    .from('styles')
    .select('*')
    .eq('slack_channel_id', channelId)
    .single();

  if (style) {
    context.existingStyle = style;
    context.styleCode = style.style_code;
    context.styleName = style.name;
    return context;
  }

  if (context.channelName) {
    const parts = context.channelName.split('-');
    if (parts.length >= 2) {
      context.styleCode = parts[0].toUpperCase();
      context.styleName = parts.slice(1).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
  }

  return context;
}

async function handleNew(client: any, triggerId: string, channelId: string) {
  const ctx = await getChannelContext(client, channelId);

  if (ctx.existingStyle) {
    const chart = await db.getChartByStyleId(ctx.existingStyle.id);
    if (chart) {
      await client.views.open({
        trigger_id: triggerId,
        view: {
          type: 'modal',
          title: { type: 'plain_text', text: 'Chart Exists' },
          blocks: [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `This channel already has a size chart for *${ctx.styleCode} \u2014 ${ctx.styleName}*.\n\nUse \`/sizechart view\` to see it or \`/sizechart clone\` to clone it for a new style.`,
            },
          }],
        },
      });
      return;
    }
  }

  await client.views.open({
    trigger_id: triggerId,
    view: modals.methodModal(ctx.styleCode, ctx.styleName, channelId),
  });
}

async function handleClone(client: any, triggerId: string, styleCode: string, channelId: string) {
  const ctx = await getChannelContext(client, channelId);
  const prefill = {
    styleCode: styleCode || ctx.styleCode || '',
    styleName: ctx.styleName || '',
    channelId,
  };

  const { data: charts } = await db.supabase
    .from('size_charts_v2')
    .select('id, status, style:styles(style_code, name)')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (!charts || charts.length === 0) {
    await client.views.open({
      trigger_id: triggerId,
      view: modals.methodModal(prefill.styleCode, prefill.styleName, channelId),
    });
    return;
  }

  await client.views.open({
    trigger_id: triggerId,
    view: modals.clonePickerModal(charts, prefill),
  });
}

async function handleView(styleCode: string, channelId: string) {
  let chart;

  if (styleCode) {
    chart = await db.getChartByStyleCode(styleCode);
  } else {
    const { data: style } = await db.supabase
      .from('styles')
      .select('id')
      .eq('slack_channel_id', channelId)
      .single();
    if (style) {
      chart = await db.getChartByStyleId(style.id);
    }
  }

  if (!chart) {
    return {
      response_type: 'ephemeral' as const,
      text: styleCode
        ? `No chart found for style *${styleCode}*`
        : 'No chart linked to this channel. Use `/sizechart view <style-code>` or run `/sizechart new` first.',
    };
  }

  const text = chartToSlackText(chart);
  const style = (chart as any).style;

  return {
    response_type: 'in_channel' as const,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: `Size Chart \u2014 ${style.style_code} ${style.name}` } },
      { type: 'section', text: { type: 'mrkdwn', text: '```' + text + '```' } },
      {
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: `Status: *${chart.status.toUpperCase()}* \u00B7 Updated: ${new Date(chart.updated_at).toLocaleDateString()}`,
        }],
      },
    ],
  };
}

async function handleHistory(styleCode: string, channelId: string) {
  if (!styleCode) {
    const { data: style } = await db.supabase
      .from('styles')
      .select('style_code')
      .eq('slack_channel_id', channelId)
      .single();
    if (style) styleCode = style.style_code;
  }

  if (!styleCode) {
    return { response_type: 'ephemeral' as const, text: 'No chart linked to this channel. Use `/sizechart history <style-code>`.' };
  }

  const logs = await db.getAuditLogByStyleCode(styleCode);
  if (!logs || logs.length === 0) {
    return { response_type: 'ephemeral' as const, text: `No history found for style *${styleCode}*` };
  }

  const lines = logs.map((log: any) => {
    const date = new Date(log.created_at).toLocaleDateString();
    const who = log.changed_by_name || log.changed_by;
    let detail = log.action;
    if (log.field) {
      detail += `: ${log.field}`;
      if (log.old_value && log.new_value) detail += ` (${log.old_value} \u2192 ${log.new_value})`;
    }
    if (log.source_file) detail += ` via ${log.source_file}`;
    return `${date} \u00B7 *${who}* \u00B7 ${detail}`;
  });

  return {
    response_type: 'ephemeral' as const,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: `Change History \u2014 ${styleCode}` } },
      { type: 'section', text: { type: 'mrkdwn', text: lines.join('\n') } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `Showing last ${logs.length} changes` }] },
    ],
  };
}

async function handleBlocks() {
  const blocks = await db.getSizeBlocks();
  const byBrand: Record<string, any[]> = {};

  blocks.forEach((b: any) => {
    const brand = b.brand?.name || 'No Brand';
    if (!byBrand[brand]) byBrand[brand] = [];
    byBrand[brand].push(b);
  });

  const sections = Object.entries(byBrand).map(([brand, brandBlocks]) => {
    const list = brandBlocks
      .map((b: any) => `\u2022 ${b.name} (${b.rows.length} measurements, ${b.size_scale?.name || '?'})`)
      .join('\n');
    return `*${brand}*\n${list}`;
  });

  return {
    response_type: 'ephemeral' as const,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: 'Size Block Library' } },
      { type: 'section', text: { type: 'mrkdwn', text: sections.join('\n\n') || '_No blocks found._' } },
    ],
  };
}
