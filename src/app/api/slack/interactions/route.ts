/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifySlackRequest } from '@/lib/slack/verify';
import { getSlackClient } from '@/lib/slack/slack-client';
import * as db from '@/lib/slack/supabase';
import { chartToSlackText } from '@/lib/slack/chart-composer';
import { publishToCanvas, postChartMessage } from '@/lib/slack/canvas-publisher';
import * as modals from '@/lib/slack/modals';
import { changeAcceptedMessage, changeRejectedMessage } from '@/lib/slack/messages';

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

  // Interactions come as URL-encoded with a 'payload' field
  const params = new URLSearchParams(rawBody);
  const payloadStr = params.get('payload');
  if (!payloadStr) {
    return NextResponse.json({ error: 'No payload' }, { status: 400 });
  }

  const payload = JSON.parse(payloadStr);
  const client = getSlackClient();

  try {
    switch (payload.type) {
      case 'block_actions':
        return await handleBlockActions(payload, client);

      case 'view_submission':
        return await handleViewSubmission(payload, client);

      case 'view_closed':
        return new NextResponse(null, { status: 200 });

      default:
        return new NextResponse(null, { status: 200 });
    }
  } catch (error) {
    console.error('Slack interaction error:', error);
    return new NextResponse(null, { status: 200 });
  }
}

async function handleBlockActions(payload: any, client: any) {
  for (const action of payload.actions || []) {
    const actionId = action.action_id;

    if (actionId === 'home_new_chart') {
      await client.views.open({
        trigger_id: payload.trigger_id,
        view: modals.methodModal(),
      });
    } else if (actionId === 'home_view_chart') {
      const chartId = action.value;
      const chart = await db.getChart(chartId);
      if (chart) {
        const text = chartToSlackText(chart);
        const style = (chart as any).style || {};
        await client.views.open({
          trigger_id: payload.trigger_id,
          view: {
            type: 'modal',
            title: { type: 'plain_text', text: `${style.style_code || 'Chart'}` },
            blocks: [
              { type: 'section', text: { type: 'mrkdwn', text: `*${style.style_code}* \u2014 *${style.name || ''}*\nStatus: *${chart.status.toUpperCase()}*` } },
              { type: 'section', text: { type: 'mrkdwn', text: '```' + text + '```' } },
            ],
          },
        });
      }
    } else if (actionId === 'home_manage_blocks') {
      const blocks = await db.getSizeBlocks();
      const blocksList = blocks.map((b: any) =>
        `\u2022 *${b.name}* \u2014 ${b.brand?.name || 'No brand'} \u00B7 ${b.rows.length} measurements`
      ).join('\n') || '_No blocks found._';

      await client.views.open({
        trigger_id: payload.trigger_id,
        view: {
          type: 'modal',
          title: { type: 'plain_text', text: 'Size Blocks' },
          blocks: [{ type: 'section', text: { type: 'mrkdwn', text: blocksList } }],
        },
      });
    } else if (actionId.startsWith('edit_row_')) {
      const data = JSON.parse(action.value);
      const meta = payload.view ? JSON.parse(payload.view.private_metadata || '{}') : {};
      const modal = modals.editRowModal(data.rowId, data.pointOfMeasure, data.sizes, data.currentValues, { ...meta, rowId: data.rowId });
      await client.views.push({
        trigger_id: payload.trigger_id,
        view: modal,
      });
    } else if (actionId === 'cr_accept') {
      await handleCrAccept(action.value, payload, client);
    } else if (actionId === 'cr_reject') {
      await handleCrReject(action.value, payload, client);
    }
  }

  return new NextResponse(null, { status: 200 });
}

async function handleViewSubmission(payload: any, client: any) {
  const callbackId = payload.view.callback_id;
  const vals = payload.view.state.values;
  const meta = JSON.parse(payload.view.private_metadata || '{}');

  switch (callbackId) {
    case 'wizard_method': {
      const styleCode = vals.style_code_block.style_code.value;
      const styleName = vals.style_name_block.style_name.value;
      const method = vals.method_block.method.selected_option.value;
      const prefill = { styleCode, styleName, channelId: meta.channelId };

      if (method === 'clone') {
        const { data: charts } = await db.supabase
          .from('size_charts_v2')
          .select('id, status, style:styles(style_code, name)')
          .order('updated_at', { ascending: false })
          .limit(50);

        if (!charts || charts.length === 0) {
          return NextResponse.json({
            response_action: 'errors',
            errors: { method_block: 'No existing charts to clone. Please use "Build from blocks".' },
          });
        }

        return NextResponse.json({
          response_action: 'update',
          view: modals.clonePickerModal(charts, prefill),
        });
      }

      const [brands, garmentTypes, sizeScales] = await Promise.all([
        db.getBrands(),
        db.getGarmentTypes(),
        db.getSizeScales(),
      ]);

      return NextResponse.json({
        response_action: 'update',
        view: modals.styleInfoModal(brands, garmentTypes, sizeScales, prefill),
      });
    }

    case 'wizard_style_info': {
      const prefill = { ...meta };
      prefill.brandId = vals.brand_block.brand.selected_option.value;
      prefill.garmentTypeId = vals.garment_type_block.garment_type.selected_option.value;
      prefill.sizeScaleId = vals.size_scale_block.size_scale.selected_option.value;
      prefill.season = vals.season_block?.season?.value || '';

      const blocks = await db.getSizeBlocks({ garmentTypeId: prefill.garmentTypeId });
      const universalBlocks = await db.getSizeBlocks({});
      const allBlocks = [...blocks];
      universalBlocks.forEach((b: any) => {
        if (!allBlocks.find((existing: any) => existing.id === b.id)) {
          allBlocks.push(b);
        }
      });

      return NextResponse.json({
        response_action: 'update',
        view: modals.blockPickerModal(allBlocks, prefill),
      });
    }

    case 'wizard_block_picker': {
      const prefill = { ...meta };
      const selectedBlockIds: string[] = [];
      Object.keys(vals).forEach(blockId => {
        const selected = vals[blockId]?.selected_blocks?.selected_options;
        if (selected) {
          selected.forEach((opt: any) => selectedBlockIds.push(opt.value));
        }
      });

      if (selectedBlockIds.length === 0) {
        return NextResponse.json({
          response_action: 'errors',
          errors: { [Object.keys(vals)[0]]: 'Please select at least one block.' },
        });
      }

      prefill.blockIds = selectedBlockIds;

      const style = await db.upsertStyle({
        styleCode: prefill.styleCode,
        name: prefill.styleName,
        brandId: prefill.brandId,
        garmentTypeId: prefill.garmentTypeId,
        season: prefill.season,
        slackChannelId: prefill.channelId || null,
      });

      const chart = await db.createChart({
        styleId: style.id,
        sizeScaleId: prefill.sizeScaleId,
        blockIds: selectedBlockIds,
      });

      prefill.chartId = chart!.id;
      prefill.styleId = style.id;

      await db.logAudit({
        chartId: chart!.id,
        styleCode: prefill.styleCode,
        action: 'chart_created',
        changedBy: payload.user.id,
        changedByName: payload.user.name,
        source: 'manual',
      });

      const chartText = chartToSlackText(chart);

      return NextResponse.json({
        response_action: 'update',
        view: modals.previewModal(chartText, prefill),
      });
    }

    case 'wizard_clone_picker': {
      const prefill = { ...meta };
      const sourceChartId = vals.source_chart_block.source_chart.selected_option.value;
      const sourceChart = await db.getChart(sourceChartId);

      const style = await db.upsertStyle({
        styleCode: prefill.styleCode,
        name: prefill.styleName,
        brandId: (sourceChart as any).style?.brand_id,
        garmentTypeId: (sourceChart as any).style?.garment_type_id,
        season: prefill.styleCode.substring(0, 4),
        slackChannelId: prefill.channelId || null,
      });

      const newChart = await db.cloneChart(sourceChartId, style.id);
      prefill.chartId = newChart.id;
      prefill.styleId = style.id;

      await db.logAudit({
        chartId: newChart.id,
        styleCode: prefill.styleCode,
        action: 'chart_cloned',
        field: `from ${(sourceChart as any).style?.style_code || sourceChartId}`,
        changedBy: payload.user.id,
        changedByName: payload.user.name,
        source: 'clone',
      });

      const chartText = chartToSlackText(newChart);

      return NextResponse.json({
        response_action: 'update',
        view: modals.previewModal(chartText, prefill),
      });
    }

    case 'wizard_confirm': {
      const saveAction = vals.action_block.save_action.selected_option.value;
      const chart = await db.getChart(meta.chartId);

      if (saveAction === 'publish') {
        await db.updateChartStatus(meta.chartId, 'approved');
        await db.syncToFlatTable(meta.chartId);

        const style = (chart as any).style;
        if (style?.slack_channel_id) {
          try {
            const canvasId = await publishToCanvas(client, chart, style.slack_channel_id);
            if (canvasId) {
              await db.supabase.from('styles').update({ slack_canvas_id: canvasId }).eq('id', style.id);
            }
            await db.logAudit({
              chartId: meta.chartId,
              styleCode: meta.styleCode,
              action: 'published_to_canvas',
              changedBy: payload.user.id,
              changedByName: payload.user.name,
              source: 'manual',
            });
          } catch (err: any) {
            console.error('Canvas publish failed:', err.message);
            await postChartMessage(client, chart, style.slack_channel_id);
          }
        }

        await client.chat.postMessage({
          channel: payload.user.id,
          text: `:white_check_mark: Size chart for *${meta.styleCode} \u2014 ${meta.styleName}* has been published!`,
        });
      } else {
        await db.updateChartStatus(meta.chartId, 'draft');
        await client.chat.postMessage({
          channel: payload.user.id,
          text: `:pencil2: Size chart for *${meta.styleCode} \u2014 ${meta.styleName}* saved as draft.`,
        });
      }

      return new NextResponse(null, { status: 200 });
    }

    case 'edit_row_submit': {
      const overrides: { rowId: string; size: string; value: string }[] = [];
      meta.sizes.forEach((size: string) => {
        const value = vals[`val_${size}`]?.value?.value;
        if (value !== undefined && value !== '') {
          overrides.push({ rowId: meta.rowId, size, value });
        }
      });

      if (overrides.length > 0) {
        await db.addChartOverrides(meta.chartId, overrides);
        for (const o of overrides) {
          await db.logAudit({
            chartId: meta.chartId,
            styleCode: meta.styleCode,
            action: 'value_changed',
            field: `${meta.pointOfMeasure || 'measurement'} / ${o.size}`,
            newValue: o.value,
            changedBy: payload.user.id,
            changedByName: payload.user.name,
            source: 'manual',
          });
        }
      }

      return new NextResponse(null, { status: 200 });
    }

    default:
      return new NextResponse(null, { status: 200 });
  }
}

async function handleCrAccept(changeRequestId: string, payload: any, client: any) {
  const { data: cr } = await db.supabase
    .from('change_requests')
    .select('*')
    .eq('id', changeRequestId)
    .single();

  if (!cr || cr.status !== 'pending') return;

  let reviewerName = payload.user.id;
  try {
    const userInfo = await client.users.info({ user: payload.user.id });
    reviewerName = userInfo.user?.real_name || userInfo.user?.name || reviewerName;
  } catch { /* ignore */ }

  const changes = cr.changes;
  if (changes && changes.length > 0) {
    const overrides = changes.map((c: any) => ({ rowId: c.rowId, size: c.size, value: c.newValue }));
    await db.addChartOverrides(cr.chart_id, overrides);

    const chart = await db.getChart(cr.chart_id);
    const styleCode = (chart as any).style?.style_code || '';

    for (const c of changes) {
      await db.logAudit({
        chartId: cr.chart_id, styleCode, action: 'value_changed',
        field: `${c.pointOfMeasure} / ${c.size}`, oldValue: c.oldValue, newValue: c.newValue,
        changedBy: cr.uploaded_by, changedByName: cr.uploaded_by_name,
        source: 'excel_upload', sourceFile: cr.file_name,
      });
    }

    await db.logAudit({
      chartId: cr.chart_id, styleCode, action: 'change_approved',
      field: `${changes.length} changes from ${cr.file_name}`,
      changedBy: payload.user.id, changedByName: reviewerName, source: 'manual',
    });

    await db.syncToFlatTable(cr.chart_id);

    const style = (chart as any).style;
    if (style?.slack_channel_id) {
      try {
        const updatedChart = await db.getChart(cr.chart_id);
        await publishToCanvas(client, updatedChart, style.slack_channel_id);
      } catch {
        const updatedChart = await db.getChart(cr.chart_id);
        await postChartMessage(client, updatedChart, style.slack_channel_id);
      }
    }

    await db.updateChangeRequestStatus(changeRequestId, 'approved', payload.user.id, reviewerName);

    const msg = changeAcceptedMessage(styleCode, style?.name || '', changes.length, payload.user.id);
    await client.chat.postMessage({ channel: payload.channel.id, ...msg });
  }
}

async function handleCrReject(changeRequestId: string, payload: any, client: any) {
  const { data: cr } = await db.supabase
    .from('change_requests')
    .select('*')
    .eq('id', changeRequestId)
    .single();

  if (!cr || cr.status !== 'pending') return;

  let reviewerName = payload.user.id;
  try {
    const userInfo = await client.users.info({ user: payload.user.id });
    reviewerName = userInfo.user?.real_name || userInfo.user?.name || reviewerName;
  } catch { /* ignore */ }

  await db.updateChangeRequestStatus(changeRequestId, 'rejected', payload.user.id, reviewerName);

  const chart = await db.getChart(cr.chart_id);
  const styleCode = (chart as any).style?.style_code || '';

  await db.logAudit({
    chartId: cr.chart_id, styleCode, action: 'change_rejected',
    field: `${cr.changes.length} changes from ${cr.file_name}`,
    changedBy: payload.user.id, changedByName: reviewerName, source: 'manual',
  });

  const msg = changeRejectedMessage(styleCode, (chart as any).style?.name || '', payload.user.id);
  await client.chat.postMessage({ channel: payload.channel.id, ...msg });
}
