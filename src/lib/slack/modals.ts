/* eslint-disable @typescript-eslint/no-explicit-any */
import { composeChart } from './chart-composer';

// ─── Step 1: Choose method (new vs clone) ────────────────
export function methodModal(styleCode = '', styleName = '', channelId = '') {
  const styleCodeElement: any = {
    type: 'plain_text_input',
    action_id: 'style_code',
    placeholder: { type: 'plain_text', text: 'e.g., SS26-0108' },
  };
  if (styleCode) styleCodeElement.initial_value = styleCode;

  const styleNameElement: any = {
    type: 'plain_text_input',
    action_id: 'style_name',
    placeholder: { type: 'plain_text', text: 'e.g., Ocean Vest' },
  };
  if (styleName) styleNameElement.initial_value = styleName;

  const blocks: any[] = [];

  if (styleCode || styleName) {
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: ':sparkles: Auto-detected from this channel. Edit if needed.' }],
    });
  }

  blocks.push(
    {
      type: 'input',
      block_id: 'style_code_block',
      element: styleCodeElement,
      label: { type: 'plain_text', text: 'Style Code' },
    },
    {
      type: 'input',
      block_id: 'style_name_block',
      element: styleNameElement,
      label: { type: 'plain_text', text: 'Style Name' },
    },
    {
      type: 'input',
      block_id: 'method_block',
      element: {
        type: 'static_select',
        action_id: 'method',
        options: [
          { text: { type: 'plain_text', text: 'Build from blocks' }, value: 'build' },
          { text: { type: 'plain_text', text: 'Clone existing chart' }, value: 'clone' },
        ],
      },
      label: { type: 'plain_text', text: 'How to create' },
    },
  );

  return {
    type: 'modal',
    callback_id: 'wizard_method',
    private_metadata: JSON.stringify({ channelId }),
    title: { type: 'plain_text', text: 'New Size Chart' },
    submit: { type: 'plain_text', text: 'Next' },
    blocks,
  };
}

// ─── Step 2a: Select garment type, brand, scale ──────────
export function styleInfoModal(brands: any[], garmentTypes: any[], sizeScales: any[], prefill: any = {}) {
  return {
    type: 'modal',
    callback_id: 'wizard_style_info',
    private_metadata: JSON.stringify(prefill),
    title: { type: 'plain_text', text: 'Style Details' },
    submit: { type: 'plain_text', text: 'Next' },
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Style:* ${prefill.styleCode || ''} — ${prefill.styleName || ''}` },
      },
      {
        type: 'input',
        block_id: 'brand_block',
        element: {
          type: 'static_select',
          action_id: 'brand',
          options: brands.map((b: any) => ({
            text: { type: 'plain_text', text: b.name },
            value: b.id,
          })),
        },
        label: { type: 'plain_text', text: 'Brand' },
      },
      {
        type: 'input',
        block_id: 'garment_type_block',
        element: {
          type: 'static_select',
          action_id: 'garment_type',
          options: garmentTypes.map((g: any) => ({
            text: { type: 'plain_text', text: g.name },
            value: g.id,
          })),
        },
        label: { type: 'plain_text', text: 'Garment Type' },
      },
      {
        type: 'input',
        block_id: 'size_scale_block',
        element: {
          type: 'static_select',
          action_id: 'size_scale',
          options: sizeScales.map((s: any) => ({
            text: { type: 'plain_text', text: `${s.name} (${s.sizes.join(', ')})` },
            value: s.id,
          })),
        },
        label: { type: 'plain_text', text: 'Size Scale' },
      },
      {
        type: 'input',
        block_id: 'season_block',
        optional: true,
        element: {
          type: 'plain_text_input',
          action_id: 'season',
          placeholder: { type: 'plain_text', text: 'e.g., SS26' },
          initial_value: prefill.styleCode ? prefill.styleCode.substring(0, 4) : '',
        },
        label: { type: 'plain_text', text: 'Season' },
      },
    ],
  };
}

// ─── Step 3: Pick blocks per category ────────────────────
export function blockPickerModal(blocks: any[], prefill: any = {}) {
  const byCategory: Record<string, any[]> = {};
  blocks.forEach((block: any) => {
    const cat = block.brand?.name
      ? `${block.brand.name} — ${block.garment_type?.name || 'General'}`
      : block.garment_type?.name || 'General';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(block);
  });

  const modalBlocks: any[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Style:* ${prefill.styleCode} — ${prefill.styleName}\nSelect the size blocks to include in this chart:`,
      },
    },
    { type: 'divider' },
  ];

  Object.entries(byCategory).forEach(([category, catBlocks]) => {
    modalBlocks.push({
      type: 'input',
      block_id: `blocks_${category.replace(/[^a-zA-Z0-9]/g, '_')}`,
      optional: true,
      element: {
        type: 'multi_static_select',
        action_id: 'selected_blocks',
        options: catBlocks.map((b: any) => ({
          text: { type: 'plain_text', text: `${b.name} (${b.rows.length} measurements)` },
          value: b.id,
        })),
      },
      label: { type: 'plain_text', text: category },
    });
  });

  return {
    type: 'modal',
    callback_id: 'wizard_block_picker',
    private_metadata: JSON.stringify(prefill),
    title: { type: 'plain_text', text: 'Select Blocks' },
    submit: { type: 'plain_text', text: 'Preview' },
    blocks: modalBlocks,
  };
}

// ─── Step 2b: Clone source picker ────────────────────────
export function clonePickerModal(charts: any[], prefill: any = {}) {
  const options = charts.map((c: any) => ({
    text: { type: 'plain_text', text: `${c.style?.style_code || 'Unknown'} — ${c.style?.name || ''}` },
    value: c.id,
  }));

  return {
    type: 'modal',
    callback_id: 'wizard_clone_picker',
    private_metadata: JSON.stringify(prefill),
    title: { type: 'plain_text', text: 'Clone Chart' },
    submit: { type: 'plain_text', text: 'Clone & Preview' },
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `Clone an existing chart for *${prefill.styleCode}* — *${prefill.styleName}*` },
      },
      {
        type: 'input',
        block_id: 'source_chart_block',
        element: {
          type: 'static_select',
          action_id: 'source_chart',
          options,
          placeholder: { type: 'plain_text', text: 'Select a chart to clone...' },
        },
        label: { type: 'plain_text', text: 'Source Chart' },
      },
    ],
  };
}

// ─── Preview: show chart and confirm ─────────────────────
export function previewModal(chartText: string, prefill: any = {}) {
  return {
    type: 'modal',
    callback_id: 'wizard_confirm',
    private_metadata: JSON.stringify(prefill),
    title: { type: 'plain_text', text: 'Preview Chart' },
    submit: { type: 'plain_text', text: 'Save & Publish' },
    close: { type: 'plain_text', text: 'Back' },
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*${prefill.styleCode}* — *${prefill.styleName}*` },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '```' + chartText + '```' },
      },
      {
        type: 'input',
        block_id: 'action_block',
        element: {
          type: 'static_select',
          action_id: 'save_action',
          options: [
            { text: { type: 'plain_text', text: 'Save as Draft' }, value: 'draft' },
            { text: { type: 'plain_text', text: 'Save & Publish to Canvas' }, value: 'publish' },
          ],
          initial_option: { text: { type: 'plain_text', text: 'Save & Publish to Canvas' }, value: 'publish' },
        },
        label: { type: 'plain_text', text: 'Action' },
      },
    ],
  };
}

// ─── Edit Values Modal ───────────────────────────────────
export function editValuesModal(chart: any, prefill: any = {}) {
  const { sizes, sections } = composeChart(chart);
  const modalBlocks: any[] = [];

  sections.forEach((section: any) => {
    modalBlocks.push({
      type: 'header',
      text: { type: 'plain_text', text: section.blockName.toUpperCase() },
    });

    section.rows.forEach((row: any) => {
      const valuesText = sizes
        .map((s: string) => `${s}: ${row.values[s] || '-'}`)
        .join('  |  ');

      modalBlocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `*${row.pointOfMeasure}*\n${valuesText}` },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: 'Edit' },
          action_id: `edit_row_${row.id}`,
          value: JSON.stringify({ rowId: row.id, pointOfMeasure: row.pointOfMeasure, sizes, currentValues: row.values }),
        },
      });
    });
  });

  return {
    type: 'modal',
    callback_id: 'edit_values',
    private_metadata: JSON.stringify(prefill),
    title: { type: 'plain_text', text: 'Edit Values' },
    close: { type: 'plain_text', text: 'Done' },
    blocks: modalBlocks,
  };
}

// ─── Edit Single Row Modal ───────────────────────────────
export function editRowModal(rowId: string, pointOfMeasure: string, sizes: string[], currentValues: Record<string, string>, prefill: any = {}) {
  const modalBlocks: any[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `Editing: *${pointOfMeasure}*` },
    },
  ];

  sizes.forEach((size: string) => {
    modalBlocks.push({
      type: 'input',
      block_id: `val_${size}`,
      element: {
        type: 'plain_text_input',
        action_id: 'value',
        initial_value: String(currentValues[size] || ''),
        placeholder: { type: 'plain_text', text: `Value for ${size}` },
      },
      label: { type: 'plain_text', text: `Size ${size}` },
    });
  });

  return {
    type: 'modal',
    callback_id: 'edit_row_submit',
    private_metadata: JSON.stringify({ ...prefill, rowId, sizes }),
    title: { type: 'plain_text', text: 'Edit Measurement' },
    submit: { type: 'plain_text', text: 'Save' },
    blocks: modalBlocks,
  };
}
