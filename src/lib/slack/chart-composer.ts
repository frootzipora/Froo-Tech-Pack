/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Composes size blocks + overrides into a flat table structure
 * ready for display in Slack or export.
 */
export function composeChart(chart: any) {
  const sizes: string[] = chart.size_scale.sizes;

  const overrideMap: Record<string, string> = {};
  (chart.overrides || []).forEach((o: any) => {
    overrideMap[`${o.row_id}:${o.size}`] = o.value;
  });

  const sections: any[] = [];
  chart.blocks.forEach((cb: any) => {
    const block = cb.block;
    const rows = block.rows.map((row: any) => {
      const values: Record<string, string> = {};
      sizes.forEach((size: string) => {
        const override = overrideMap[`${row.id}:${size}`];
        values[size] = override || (row.values && row.values[size]) || '';
      });
      return {
        id: row.id,
        pointOfMeasure: row.point_of_measure,
        tolerance: row.tolerance || '',
        description: row.description || '',
        values,
        hasOverride: sizes.some((s: string) => overrideMap[`${row.id}:${s}`]),
      };
    });
    sections.push({
      blockId: block.id,
      blockName: block.name,
      rows,
    });
  });

  return { sizes, sections };
}

/**
 * Converts a composed chart into a Slack markdown table.
 */
export function chartToMarkdown(chart: any) {
  const { sizes, sections } = composeChart(chart);
  const lines: string[] = [];

  const header = `| Measurement | Tol | ${sizes.join(' | ')} |`;
  const sep = `|---|---|${sizes.map(() => '---').join('|')}|`;
  lines.push(header, sep);

  sections.forEach((section: any) => {
    lines.push(`| **${section.blockName.toUpperCase()}** | | ${sizes.map(() => '').join(' | ')} |`);
    section.rows.forEach((row: any) => {
      const vals = sizes.map((s: string) => row.values[s] || '');
      lines.push(`| ${row.pointOfMeasure} | ${row.tolerance} | ${vals.join(' | ')} |`);
    });
  });

  return lines.join('\n');
}

/**
 * Converts a composed chart into a plain text table for Slack messages.
 */
export function chartToSlackText(chart: any) {
  const { sizes, sections } = composeChart(chart);

  const measureCol = 24;
  const tolCol = 6;
  const sizeCol = 8;
  const pad = (str: string, width: number) => String(str || '').padEnd(width);
  const padR = (str: string, width: number) => String(str || '').padStart(width);

  const lines: string[] = [];

  // Header
  lines.push(
    pad('Measurement', measureCol) +
    pad('Tol', tolCol) +
    sizes.map((s: string) => padR(s, sizeCol)).join('')
  );
  lines.push('\u2500'.repeat(measureCol + tolCol + sizes.length * sizeCol));

  sections.forEach((section: any) => {
    lines.push(`*${section.blockName.toUpperCase()}*`);
    section.rows.forEach((row: any) => {
      lines.push(
        pad(row.pointOfMeasure, measureCol) +
        pad(row.tolerance, tolCol) +
        sizes.map((s: string) => padR(row.values[s] || '-', sizeCol)).join('')
      );
    });
    lines.push('');
  });

  return lines.join('\n');
}
