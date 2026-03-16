import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ─── BRANDS ──────────────────────────────────────────────
export async function getBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function upsertBrand(name: string) {
  const { data, error } = await supabase
    .from('brands')
    .upsert({ name }, { onConflict: 'name' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── GARMENT TYPES ───────────────────────────────────────
export async function getGarmentTypes() {
  const { data, error } = await supabase
    .from('garment_types')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function upsertGarmentType(name: string) {
  const { data, error } = await supabase
    .from('garment_types')
    .upsert({ name }, { onConflict: 'name' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── SIZE SCALES ─────────────────────────────────────────
export async function getSizeScales() {
  const { data, error } = await supabase
    .from('size_scales')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function upsertSizeScale(name: string, sizes: string[]) {
  const { data, error } = await supabase
    .from('size_scales')
    .upsert({ name, sizes }, { onConflict: 'name' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── SIZE BLOCKS ─────────────────────────────────────────
export async function getSizeBlocks(filters: { brandId?: string; garmentTypeId?: string; sizeScaleId?: string } = {}) {
  let query = supabase
    .from('size_blocks')
    .select(`
      *,
      brand:brands(name),
      garment_type:garment_types(name),
      size_scale:size_scales(name, sizes),
      rows:size_block_rows(*)
    `)
    .eq('is_active', true)
    .order('name');

  if (filters.brandId) query = query.eq('brand_id', filters.brandId);
  if (filters.garmentTypeId) query = query.eq('garment_type_id', filters.garmentTypeId);
  if (filters.sizeScaleId) query = query.eq('size_scale_id', filters.sizeScaleId);

  const { data, error } = await query;
  if (error) throw error;

  // Sort rows within each block
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data!.forEach((block: any) => {
    block.rows.sort((a: any, b: any) => a.sort_order - b.sort_order);
  });

  return data!;
}

export async function getSizeBlock(id: string) {
  const { data, error } = await supabase
    .from('size_blocks')
    .select(`
      *,
      brand:brands(name),
      garment_type:garment_types(name),
      size_scale:size_scales(name, sizes),
      rows:size_block_rows(*)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.rows.sort((a: any, b: any) => a.sort_order - b.sort_order);
  return data;
}

export async function createSizeBlock({ name, brandId, garmentTypeId, sizeScaleId, rows }: {
  name: string;
  brandId: string;
  garmentTypeId: string;
  sizeScaleId: string;
  rows?: { pointOfMeasure: string; description?: string; tolerance?: string; values: Record<string, string> }[];
}) {
  const { data: block, error: blockErr } = await supabase
    .from('size_blocks')
    .insert({
      name,
      brand_id: brandId,
      garment_type_id: garmentTypeId,
      size_scale_id: sizeScaleId,
    })
    .select()
    .single();
  if (blockErr) throw blockErr;

  if (rows && rows.length > 0) {
    const blockRows = rows.map((row, i) => ({
      block_id: block.id,
      point_of_measure: row.pointOfMeasure,
      description: row.description || null,
      tolerance: row.tolerance || null,
      sort_order: i,
      values: row.values,
    }));
    const { error: rowErr } = await supabase
      .from('size_block_rows')
      .insert(blockRows);
    if (rowErr) throw rowErr;
  }

  return getSizeBlock(block.id);
}

// ─── STYLES ──────────────────────────────────────────────
export async function getStyles() {
  const { data, error } = await supabase
    .from('styles')
    .select(`
      *,
      brand:brands(name),
      garment_type:garment_types(name)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getStyleByCode(styleCode: string) {
  const { data, error } = await supabase
    .from('styles')
    .select(`
      *,
      brand:brands(name),
      garment_type:garment_types(name)
    `)
    .eq('style_code', styleCode)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertStyle({ styleCode, name, brandId, garmentTypeId, season, slackChannelId }: {
  styleCode: string;
  name: string;
  brandId?: string;
  garmentTypeId?: string;
  season?: string;
  slackChannelId?: string | null;
}) {
  const { data, error } = await supabase
    .from('styles')
    .upsert({
      style_code: styleCode,
      name,
      brand_id: brandId,
      garment_type_id: garmentTypeId,
      season,
      slack_channel_id: slackChannelId,
    }, { onConflict: 'style_code' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── SIZE CHARTS ─────────────────────────────────────────
export async function getChart(id: string) {
  const { data, error } = await supabase
    .from('size_charts_v2')
    .select(`
      *,
      style:styles(*, brand:brands(name)),
      size_scale:size_scales(name, sizes),
      blocks:size_chart_blocks(
        sort_order,
        block:size_blocks(
          *,
          rows:size_block_rows(*)
        )
      ),
      overrides:size_chart_overrides(*)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.blocks.sort((a: any, b: any) => a.sort_order - b.sort_order);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.blocks.forEach((cb: any) => {
    cb.block.rows.sort((a: any, b: any) => a.sort_order - b.sort_order);
  });

  return data;
}

export async function getChartByStyleId(styleId: string) {
  const { data, error } = await supabase
    .from('size_charts_v2')
    .select('id')
    .eq('style_id', styleId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return getChart(data.id);
}

export async function getChartByStyleCode(styleCode: string) {
  const style = await getStyleByCode(styleCode);
  if (!style) return null;
  return getChartByStyleId(style.id);
}

export async function createChart({ styleId, sizeScaleId, blockIds, clonedFromId }: {
  styleId: string;
  sizeScaleId: string;
  blockIds?: string[];
  clonedFromId?: string;
}) {
  const { data: chart, error: chartErr } = await supabase
    .from('size_charts_v2')
    .insert({
      style_id: styleId,
      size_scale_id: sizeScaleId,
      cloned_from_id: clonedFromId || null,
    })
    .select()
    .single();
  if (chartErr) throw chartErr;

  if (blockIds && blockIds.length > 0) {
    const chartBlocks = blockIds.map((blockId, i) => ({
      chart_id: chart.id,
      block_id: blockId,
      sort_order: i,
    }));
    const { error: blockErr } = await supabase
      .from('size_chart_blocks')
      .insert(chartBlocks);
    if (blockErr) throw blockErr;
  }

  return getChart(chart.id);
}

export async function updateChartStatus(chartId: string, status: string) {
  const { error } = await supabase
    .from('size_charts_v2')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', chartId);
  if (error) throw error;
}

export async function addChartOverrides(chartId: string, overrides: { rowId: string; size: string; value: string }[]) {
  const rows = overrides.map(o => ({
    chart_id: chartId,
    row_id: o.rowId,
    size: o.size,
    value: o.value,
  }));
  const { error } = await supabase
    .from('size_chart_overrides')
    .upsert(rows, { onConflict: 'chart_id,row_id,size' });
  if (error) throw error;
}

export async function cloneChart(sourceChartId: string, newStyleId: string) {
  const source = await getChart(sourceChartId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blockIds = source.blocks.map((b: any) => b.block.id);
  const newChart = await createChart({
    styleId: newStyleId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sizeScaleId: (source as any).size_scale?.id || (source as any).size_scale_id,
    blockIds,
    clonedFromId: sourceChartId,
  });

  // Copy overrides from source
  if (source.overrides && source.overrides.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const overridesCopy = source.overrides.map((o: any) => ({
      rowId: o.row_id,
      size: o.size,
      value: o.value,
    }));
    await addChartOverrides(newChart!.id, overridesCopy);
  }

  return getChart(newChart!.id);
}

// ─── CHANGE REQUESTS ─────────────────────────────────────
export async function createChangeRequest({ chartId, slackFileId, fileName, uploadedBy, uploadedByName, changes }: {
  chartId: string;
  slackFileId?: string;
  fileName: string;
  uploadedBy: string;
  uploadedByName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  changes: any[];
}) {
  const { data, error } = await supabase
    .from('change_requests')
    .insert({
      chart_id: chartId,
      slack_file_id: slackFileId,
      file_name: fileName,
      uploaded_by: uploadedBy,
      uploaded_by_name: uploadedByName,
      changes,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateChangeRequestStatus(id: string, status: string, reviewedBy?: string, reviewedByName?: string) {
  const { error } = await supabase
    .from('change_requests')
    .update({
      status,
      reviewed_by: reviewedBy,
      reviewed_by_name: reviewedByName,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

// ─── AUDIT LOG ───────────────────────────────────────────
export async function logAudit({ chartId, styleCode, action, field, oldValue, newValue, changedBy, changedByName, source, sourceFile }: {
  chartId: string;
  styleCode: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedByName: string;
  source: string;
  sourceFile?: string;
}) {
  const { error } = await supabase
    .from('size_chart_audit_log')
    .insert({
      chart_id: chartId,
      style_code: styleCode,
      action,
      field,
      old_value: oldValue || null,
      new_value: newValue || null,
      changed_by: changedBy,
      changed_by_name: changedByName,
      source,
      source_file: sourceFile || null,
    });
  if (error) throw error;
}

export async function getAuditLog(chartId: string, limit = 20) {
  const { data, error } = await supabase
    .from('size_chart_audit_log')
    .select('*')
    .eq('chart_id', chartId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getAuditLogByStyleCode(styleCode: string, limit = 20) {
  const { data, error } = await supabase
    .from('size_chart_audit_log')
    .select('*')
    .eq('style_code', styleCode)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ─── SYNC TO FLAT TABLE ──────────────────────────────────
export async function syncToFlatTable(chartId: string) {
  const chart = await getChart(chartId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!chart || !(chart as any).style) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const style = (chart as any).style;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sizes = (chart as any).size_scale.sizes;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overrideMap: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chart.overrides || []).forEach((o: any) => {
    overrideMap[`${o.row_id}:${o.size}`] = o.value;
  });

  // Delete existing rows for this style
  await supabase
    .from('Size Charts')
    .delete()
    .eq('style_code', style.style_code);

  // Build flat rows
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flatRows: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chart.blocks.forEach((cb: any, blockIdx: number) => {
    const prefix = String.fromCharCode(65 + blockIdx);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cb.block.rows.forEach((row: any) => {
      sizes.forEach((size: string) => {
        const override = overrideMap[`${row.id}:${size}`];
        const value = override || (row.values && row.values[size]) || null;
        if (value !== null) {
          flatRows.push({
            style_code: style.style_code,
            style_name: style.name,
            measurement: `${prefix},${row.point_of_measure.toUpperCase()}`,
            description: row.description || '',
            size,
            value_cm: value,
          });
        }
      });
    });
  });

  if (flatRows.length > 0) {
    const { error } = await supabase
      .from('Size Charts')
      .insert(flatRows);
    if (error) throw error;
  }
}
